import { Server, Socket } from 'socket.io';
import { GameManager } from '../game/GameManager.js';

export function registerGameHandler(io: Server, socket: Socket, gameManager: GameManager) {
  socket.on('game:start', () => {
    const { playerId, roomCode } = socket.data as { playerId: string; roomCode: string };
    const room = gameManager.getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Room not found' });

    const player = room.getPlayer(playerId);
    if (!player?.isHost) return socket.emit('error', { message: 'Only the host can start' });

    const connected = room.getConnectedPlayers();
    if (connected.length < 3) return socket.emit('error', { message: 'Need at least 3 players' });

    if (room.allMedia.length < room.settings.totalRounds) {
      const available = room.allMedia.length;
      if (available < connected.length) {
        return socket.emit('error', { message: 'Not enough media uploaded' });
      }
      room.settings.totalRounds = Math.min(room.settings.totalRounds, available);
    }

    room.status = 'starting';
    room.prepareRounds();

    io.to(roomCode).emit('game:starting', { countdown: 3 });

    setTimeout(() => startNextRound(io, roomCode, gameManager), 3000);
  });

  socket.on('game:guess', ({ roundId, guessedPlayerId, timestamp }) => {
    const { playerId, roomCode } = socket.data as { playerId: string; roomCode: string };
    const room = gameManager.getRoom(roomCode);
    if (!room || room.status !== 'playing') return;

    const round = room.getCurrentRound();
    if (!round || round.roundNumber !== roundId) return;
    if (guessedPlayerId === playerId) return; // Can't guess yourself

    round.submitGuess(playerId, guessedPlayerId, timestamp);
    socket.emit('game:guessConfirmed', { guessedPlayerId });
    // Notify all players in room that someone guessed (for live activity counter)
    socket.to(roomCode).emit('game:guessConfirmed', { guessedPlayerId: null });

    // Check if all connected players (except the owner) have guessed
    const connected = room.getConnectedPlayers();
    const eligibleGuessers = connected.filter(p => p.id !== round.ownerPlayerId);
    const guessCount = round.guesses.size;

    if (guessCount >= eligibleGuessers.length) {
      resolveRound(io, roomCode, gameManager);
    }
  });
}

export function startNextRound(io: Server, roomCode: string, gameManager: GameManager) {
  const room = gameManager.getRoom(roomCode);
  if (!room) return;

  const round = room.status === 'starting' ? room.getCurrentRound() : room.nextRound();
  if (!round) {
    endGame(io, roomCode, gameManager);
    return;
  }

  room.status = 'playing';

  io.to(roomCode).emit('game:newRound', {
    roundNumber: round.roundNumber,
    totalRounds: room.rounds.length,
    mediaUrl: round.media.url,
    mediaType: round.media.type,
    duration: room.settings.displayDuration,
    progressiveBlur: room.settings.progressiveBlur,
    ownerId: null, // Don't reveal owner during display
  });

  // After display duration, switch to guess phase
  setTimeout(() => {
    const r = gameManager.getRoom(roomCode);
    if (!r || r.status !== 'playing') return;

    const players = r.getConnectedPlayers().map(p => p.toJSON());
    io.to(roomCode).emit('game:guessPhase', {
      players,
      duration: 5,
    });

    // Auto-resolve after 5 seconds
    setTimeout(() => {
      const rr = gameManager.getRoom(roomCode);
      if (!rr || rr.status !== 'playing') return;
      const cr = rr.getCurrentRound();
      if (cr && !cr.isComplete) resolveRound(io, roomCode, gameManager);
    }, 5000);
  }, room.settings.displayDuration * 1000);
}

function resolveRound(io: Server, roomCode: string, gameManager: GameManager) {
  const room = gameManager.getRoom(roomCode);
  if (!room) return;

  const round = room.getCurrentRound();
  if (!round || round.isComplete) return;

  const result = round.calculateResults(room.getAllPlayers());
  room.applyRoundResults(result);

  const guessesObj: Record<string, string> = {};
  for (const [pid, guess] of result.guesses) {
    guessesObj[pid] = guess.guessedPlayerId;
  }

  const pointsObj: Record<string, number> = {};
  for (const [pid, pts] of result.pointsAwarded) {
    pointsObj[pid] = pts;
  }

  const owner = room.getPlayer(result.ownerPlayerId);

  io.to(roomCode).emit('game:roundResult', {
    roundNumber: result.roundNumber,
    correctPlayerId: result.ownerPlayerId,
    correctPlayerName: owner?.name,
    mediaUrl: result.mediaUrl,
    guesses: guessesObj,
    pointsAwarded: pointsObj,
  });

  io.to(roomCode).emit('game:scores', {
    scores: room.getScores(),
  });

  // Transition to next round after 4 seconds
  setTimeout(() => startNextRound(io, roomCode, gameManager), 4000);
}

function endGame(io: Server, roomCode: string, gameManager: GameManager) {
  const room = gameManager.getRoom(roomCode);
  if (!room) return;

  room.status = 'results';
  const finalScores = room.getScores();
  const stats = room.getGameStats();
  const podium = finalScores.slice(0, 3);

  io.to(roomCode).emit('game:ended', { finalScores, stats, podium });

  // Cleanup media after 5 minutes
  setTimeout(() => {
    const r = gameManager.getRoom(roomCode);
    if (r) r.cleanup();
  }, 5 * 60 * 1000);
}
