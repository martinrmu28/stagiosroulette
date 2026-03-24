import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { GameManager } from '../game/GameManager.js';
import { PlayerMedia } from '../game/Player.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MAX_PHOTOS_PER_PLAYER = 30;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function registerMediaHandler(io: Server, socket: Socket, gameManager: GameManager) {
  socket.on('media:upload', async ({ data, type, mimeType }: {
    data: string; // base64
    type: 'photo' | 'video';
    mimeType: string;
  }) => {
    const { playerId, roomCode } = socket.data as { playerId: string; roomCode: string };
    const room = gameManager.getRoom(roomCode);
    if (!room || room.status !== 'waiting') {
      return socket.emit('error', { message: 'Cannot upload now' });
    }

    const player = room.getPlayer(playerId);
    if (!player) return socket.emit('error', { message: 'Player not found' });

    if (player.media.length >= MAX_PHOTOS_PER_PLAYER) {
      return socket.emit('error', { message: 'Max photos reached' });
    }

    try {
      const buffer = Buffer.from(data, 'base64');

      if (buffer.length > MAX_FILE_SIZE) {
        return socket.emit('error', { message: 'File too large' });
      }

      const mediaId = uuidv4();
      const ext = type === 'video' ? 'mp4' : 'jpg';
      const filename = `${mediaId}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      if (type === 'photo') {
        // Compress with sharp
        await sharp(buffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(filePath);
      } else {
        fs.writeFileSync(filePath, buffer);
      }

      const media: PlayerMedia = {
        id: mediaId,
        url: `/api/media/${filename}`,
        type,
        filename,
      };

      room.addMediaToPlayer(playerId, media);
      io.to(roomCode).emit('player:uploadProgress', {
        playerId,
        mediaCount: player.media.length,
      });
      socket.emit('media:uploaded', { media: { id: media.id, url: media.url, type: media.type } });

    } catch (err) {
      console.error('Upload error:', err);
      socket.emit('error', { message: 'Upload failed' });
    }
  });

  socket.on('media:remove', ({ mediaId }: { mediaId: string }) => {
    const { playerId, roomCode } = socket.data as { playerId: string; roomCode: string };
    const room = gameManager.getRoom(roomCode);
    if (!room) return;

    const player = room.getPlayer(playerId);
    if (!player) return;

    const media = player.media.find(m => m.id === mediaId);
    if (media) {
      const filePath = path.join(UPLOADS_DIR, media.filename);
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    }

    room.removeMediaFromPlayer(playerId, mediaId);
    io.to(roomCode).emit('player:uploadProgress', {
      playerId,
      mediaCount: player.media.length,
    });
    socket.emit('media:removed', { mediaId });
  });

  socket.on('player:ready', () => {
    const { playerId, roomCode } = socket.data as { playerId: string; roomCode: string };
    const room = gameManager.getRoom(roomCode);
    if (!room) return;

    const player = room.getPlayer(playerId);
    if (!player) return;

    if (player.media.length < 1) {
      return socket.emit('error', { message: 'Upload at least 1 photo' });
    }

    room.setPlayerReady(playerId);
    io.to(roomCode).emit('player:ready', { playerId });
  });
}
