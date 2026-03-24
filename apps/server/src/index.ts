import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { GameManager } from './game/GameManager.js';
import { registerConnectionHandler } from './handlers/connectionHandler.js';
import { registerGameHandler } from './handlers/gameHandler.js';
import { registerMediaHandler } from './handlers/mediaHandler.js';

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 15 * 1024 * 1024, // 15MB for media uploads
});

app.use(cors({ origin: '*' }));
app.use(express.json());

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve uploaded media
app.get('/api/media/:filename', (req, res) => {
  const { filename } = req.params;
  // Security: only allow safe filenames
  if (!/^[a-f0-9-]+\.(jpg|mp4)$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(filePath);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: gameManager.getRoomCount() });
});

const gameManager = new GameManager();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  registerConnectionHandler(io, socket, gameManager);
  registerGameHandler(io, socket, gameManager);
  registerMediaHandler(io, socket, gameManager);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`StagiosRoulette server running on 0.0.0.0:${PORT}`);
});
