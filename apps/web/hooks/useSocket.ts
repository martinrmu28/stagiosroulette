'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/stores/gameStore';
import { sounds, vibrate } from '@/lib/sounds';

export function useSocket() {
  const router = useRouter();
  const store = useGameStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket(store.playerName, store.playerAvatar, store.roomCode || undefined);

    socket.on('room:created', ({ code, playerId, player }) => {
      store.setRoomCode(code);
      store.setIdentity(playerId, player.name, player.avatar);
      store.addPlayer(player);
      router.push(`/room/${code}`);
    });

    socket.on('room:joined', ({ code, playerId, player, room }) => {
      store.setRoomCode(code);
      store.setIdentity(playerId, player.name, player.avatar);
      store.setPlayers(room.players);
      store.setRoomSettings(room.settings);
      router.push(`/room/${code}`);
    });

    socket.on('room:playerJoined', ({ player }) => {
      store.addPlayer(player);
      sounds.play('ding');
    });

    socket.on('room:playerLeft', ({ playerId }) => {
      store.removePlayer(playerId);
    });

    socket.on('player:reconnected', ({ player }) => {
      store.updatePlayer(player.id, { isConnected: true });
    });

    socket.on('room:state', (room) => {
      store.setPlayers(room.players);
      store.setRoomSettings(room.settings);
    });

    socket.on('player:ready', ({ playerId }) => {
      store.updatePlayer(playerId, { isReady: true });
    });

    socket.on('player:uploadProgress', ({ playerId, mediaCount }) => {
      store.updatePlayer(playerId, { mediaCount });
    });

    socket.on('game:starting', ({ countdown }) => {
      store.setPhase('starting');
      store.setStartCountdown(countdown);
      sounds.play('countdown');
    });

    socket.on('game:newRound', (round) => {
      store.setPhase('display');
      store.setCurrentRound(round);
    });

    socket.on('game:guessPhase', ({ players }) => {
      store.setPhase('guess');
      store.setPlayers(players);
    });

    socket.on('game:roundResult', (result) => {
      store.setPhase('roundResult');
      store.setLastResult(result);
      const myId = store.playerId;
      if (myId && result.guesses[myId] === result.correctPlayerId) {
        sounds.play('correct');
        vibrate(100);
      } else if (myId && result.guesses[myId]) {
        sounds.play('wrong');
        vibrate([100, 50, 100]);
      }
    });

    socket.on('game:scores', ({ scores }) => {
      store.setScores(scores);
    });

    socket.on('game:ended', ({ finalScores, stats, podium }) => {
      store.setGameEnded(finalScores, stats, podium);
      sounds.play('fanfare');
      const code = store.roomCode;
      if (code) router.push(`/results/${code}`);
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      initialized.current = false;
    };
  }, []);

  return getSocket();
}
