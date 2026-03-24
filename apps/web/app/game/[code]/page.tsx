'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';
import { PhotoDisplay } from '@/components/game/PhotoDisplay';
import { GuessButtons } from '@/components/game/GuessButtons';
import { RoundResultDisplay } from '@/components/game/RoundResult';
import { MiniScoreBar } from '@/components/game/ScoreBoard';
import { sounds, vibrate } from '@/lib/sounds';

import { getServerUrl } from '@/lib/serverUrl';
const SERVER_URL = getServerUrl();

export default function GamePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const store  = useGameStore();
  const { code } = params;
  const initialized = useRef(false);
  const [guessedCount, setGuessedCount] = useState(0);

  const { phase, currentRound, lastResult, players, scores, playerId: myId, myGuess } = store;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket(store.playerName, store.playerAvatar, code);

    socket.on('game:newRound', (round) => {
      store.setPhase('display');
      store.setCurrentRound(round);
      setGuessedCount(0);
    });

    socket.on('game:guessPhase', ({ players: ps }) => {
      store.setPhase('guess');
      store.setPlayers(ps);
      setGuessedCount(0);
    });

    socket.on('game:guessConfirmed', () => {
      setGuessedCount(c => c + 1);
    });

    socket.on('game:roundResult', (result) => {
      store.setPhase('roundResult');
      store.setLastResult(result);
      const correct = result.guesses[myId ?? ''] === result.correctPlayerId;
      if (correct) { sounds.play('correct'); vibrate(100); }
      else if (result.guesses[myId ?? '']) { sounds.play('wrong'); vibrate([80, 40, 80]); }
    });

    socket.on('game:scores', ({ scores: s }) => store.setScores(s));

    socket.on('game:ended', ({ finalScores, stats, podium }) => {
      store.setGameEnded(finalScores, stats, podium);
      router.push(`/results/${code}`);
    });

    return () => {
      ['game:newRound', 'game:guessPhase', 'game:guessConfirmed', 'game:roundResult', 'game:scores', 'game:ended']
        .forEach(e => socket.off(e));
      initialized.current = false;
    };
  }, [code]);

  const handleGuess = (pid: string) => {
    store.setMyGuess(pid);
    getSocket().emit('game:guess', {
      roundId: currentRound?.roundNumber,
      guessedPlayerId: pid,
      timestamp: Date.now(),
    });
  };

  return (
    <main className="fixed inset-0 bg-bg-deep flex flex-col overflow-hidden">

      {/* Top HUD */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(to bottom, rgba(11,17,32,0.95), transparent)' }}
      >
        <MiniScoreBar scores={scores} myPlayerId={myId ?? ''} />
        {currentRound && (
          <span className="glass-amber rounded-full px-3 py-1 text-xs font-mono font-bold text-[var(--amber-500)] border border-[var(--amber-border)] shrink-0 ml-3">
            {currentRound.roundNumber}/{currentRound.totalRounds}
          </span>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">

        {/* Display phase */}
        {phase === 'display' && currentRound && (
          <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <PhotoDisplay
              mediaUrl={currentRound.mediaUrl}
              mediaType={currentRound.mediaType}
              duration={currentRound.duration}
              progressiveBlur={currentRound.progressiveBlur}
              roundNumber={currentRound.roundNumber}
              totalRounds={currentRound.totalRounds}
            />
          </motion.div>
        )}

        {/* Guess phase */}
        {phase === 'guess' && currentRound && (
          <motion.div
            key="guess"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-end pt-16 pb-6 gap-4"
          >
            {/* Thumbnail */}
            <div className="px-4">
              <img
                src={`${SERVER_URL}${currentRound.mediaUrl}`}
                alt=""
                className="w-full max-h-44 object-contain rounded-2xl border border-[var(--glass-border)]"
              />
            </div>
            <p className="text-center text-sm font-display font-semibold text-[var(--text-secondary)] px-4">
              À qui appartient cette photo ?
            </p>
            <GuessButtons
              players={players}
              myPlayerId={myId ?? ''}
              myGuess={myGuess}
              onGuess={handleGuess}
              guessedCount={guessedCount}
            />
          </motion.div>
        )}

        {/* Round result */}
        {phase === 'roundResult' && lastResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto pt-14"
          >
            <RoundResultDisplay result={lastResult} players={players} myPlayerId={myId ?? ''} />
          </motion.div>
        )}

        {/* Starting / loading */}
        {(phase === 'starting' || phase === 'idle') && (
          <motion.div key="loading" className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--amber-border)] border-t-[var(--amber-500)] animate-spin mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">Chargement...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
