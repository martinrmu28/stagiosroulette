import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameManager } from '../game/GameManager.js';
import { Player } from '../game/Player.js';

export function registerConnectionHandler(io: Server, socket: Socket, gameManager: GameManager) {
  const { playerName, avatar, roomCode } = socket.handshake.auth as {
    playerName?: string;
    avatar?: string;
    roomCode?: string;
  };

  // Reconnection attempt
  if (roomCode) {
    const room = gameManager.getRoom(roomCode);
    if (room) {
      const existing = Array.from(room.players.values()).find(
        p => p.name === playerName && !p.isConnected
      );
      if (existing) {
        existing.socketId = socket.id;
        existing.isConnected = true;
        socket.join(roomCode);
        socket.data.playerId = existing.id;
        socket.data.roomCode = roomCode;
        io.to(roomCode).emit('player:reconnected', { player: existing.toJSON() });
        socket.emit('room:state', room.toJSON());
        console.log(`Player ${existing.name} reconnected to room ${roomCode}`);
        return;
      }
    }
  }

  socket.on('room:create', ({ playerName, avatar, settings }) => {
    const room = gameManager.createRoom(settings);
    const playerId = uuidv4();
    const player = new Player(playerId, socket.id, playerName, avatar, true);
    room.addPlayer(player);
    socket.join(room.code);
    socket.data.playerId = playerId;
    socket.data.roomCode = room.code;

    socket.emit('room:created', { code: room.code, playerId, player: player.toJSON() });
    console.log(`Room ${room.code} created by ${playerName}`);
  });

  socket.on('room:join', ({ code, playerName, avatar }) => {
    const room = gameManager.getRoom(code);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (room.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    const playerId = uuidv4();
    const player = new Player(playerId, socket.id, playerName, avatar);
    room.addPlayer(player);
    socket.join(code);
    socket.data.playerId = playerId;
    socket.data.roomCode = code;

    socket.emit('room:joined', { code, playerId, player: player.toJSON(), room: room.toJSON() });
    socket.to(code).emit('room:playerJoined', { player: player.toJSON() });
    console.log(`${playerName} joined room ${code}`);
  });

  socket.on('disconnect', () => {
    const { playerId, roomCode } = socket.data as { playerId?: string; roomCode?: string };
    if (!playerId || !roomCode) return;

    const room = gameManager.getRoom(roomCode);
    if (!room) return;

    room.removePlayer(playerId);
    const player = room.getPlayer(playerId);
    io.to(roomCode).emit('room:playerLeft', { playerId, playerName: player?.name });
    console.log(`Player ${playerId} disconnected from room ${roomCode}`);

    // Cleanup empty rooms
    if (room.getConnectedPlayers().length === 0) {
      setTimeout(() => {
        const r = gameManager.getRoom(roomCode);
        if (r && r.getConnectedPlayers().length === 0) {
          gameManager.deleteRoom(roomCode);
          console.log(`Room ${roomCode} deleted (empty)`);
        }
      }, 30000);
    }
  });
}
