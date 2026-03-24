'use client';
import { create } from 'zustand';

export type GamePhase =
  | 'idle'
  | 'lobby'
  | 'starting'
  | 'display'
  | 'guess'
  | 'roundResult'
  | 'ended';

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  mediaCount: number;
  isConnected: boolean;
}

export interface RoundState {
  roundNumber: number;
  totalRounds: number;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  duration: number;
  progressiveBlur: boolean;
}

export interface RoundResult {
  roundNumber: number;
  correctPlayerId: string;
  correctPlayerName: string;
  mediaUrl: string;
  guesses: Record<string, string>;
  pointsAwarded: Record<string, number>;
}

export interface ScoreEntry {
  playerId: string;
  name: string;
  avatar: string;
  score: number;
}

export interface GameStats {
  mostGuessedPhoto: { mediaUrl: string; ownerName: string; correctCount: number } | null;
  mostMysteriousPlayer: { name: string; guessedCount: number } | null;
  fastestAnswer: { playerName: string; time: number } | null;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video';
}

interface RoomSettings {
  totalRounds: number;
  displayDuration: number;
  mediaMode: 'photo' | 'video' | 'both';
  progressiveBlur: boolean;
}

interface GameStore {
  // Identity
  playerId: string | null;
  playerName: string;
  playerAvatar: string;

  // Room
  roomCode: string | null;
  roomSettings: RoomSettings | null;
  players: PlayerState[];
  myMedia: MediaItem[];

  // Game
  phase: GamePhase;
  currentRound: RoundState | null;
  lastResult: RoundResult | null;
  scores: ScoreEntry[];
  myGuess: string | null;
  startCountdown: number;

  // End game
  finalScores: ScoreEntry[];
  gameStats: GameStats | null;
  podium: ScoreEntry[];

  // Actions
  setIdentity: (id: string, name: string, avatar: string) => void;
  setRoomCode: (code: string) => void;
  setRoomSettings: (settings: RoomSettings) => void;
  setPlayers: (players: PlayerState[]) => void;
  addPlayer: (player: PlayerState) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<PlayerState>) => void;
  addMyMedia: (media: MediaItem) => void;
  removeMyMedia: (mediaId: string) => void;
  setPhase: (phase: GamePhase) => void;
  setCurrentRound: (round: RoundState) => void;
  setLastResult: (result: RoundResult) => void;
  setScores: (scores: ScoreEntry[]) => void;
  setMyGuess: (playerId: string | null) => void;
  setStartCountdown: (n: number) => void;
  setGameEnded: (finalScores: ScoreEntry[], stats: GameStats, podium: ScoreEntry[]) => void;
  reset: () => void;
}

const initialState = {
  playerId: null,
  playerName: '',
  playerAvatar: '🎭',
  roomCode: null,
  roomSettings: null,
  players: [],
  myMedia: [],
  phase: 'idle' as GamePhase,
  currentRound: null,
  lastResult: null,
  scores: [],
  myGuess: null,
  startCountdown: 3,
  finalScores: [],
  gameStats: null,
  podium: [],
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setIdentity: (id, name, avatar) => set({ playerId: id, playerName: name, playerAvatar: avatar }),
  setRoomCode: (code) => set({ roomCode: code }),
  setRoomSettings: (settings) => set({ roomSettings: settings }),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => set(s => ({ players: [...s.players.filter(p => p.id !== player.id), player] })),
  removePlayer: (playerId) => set(s => ({
    players: s.players.map(p => p.id === playerId ? { ...p, isConnected: false } : p),
  })),
  updatePlayer: (playerId, updates) => set(s => ({
    players: s.players.map(p => p.id === playerId ? { ...p, ...updates } : p),
  })),
  addMyMedia: (media) => set(s => ({ myMedia: [...s.myMedia, media] })),
  removeMyMedia: (mediaId) => set(s => ({ myMedia: s.myMedia.filter(m => m.id !== mediaId) })),
  setPhase: (phase) => set({ phase }),
  setCurrentRound: (round) => set({ currentRound: round, myGuess: null }),
  setLastResult: (result) => set({ lastResult: result }),
  setScores: (scores) => set({ scores }),
  setMyGuess: (playerId) => set({ myGuess: playerId }),
  setStartCountdown: (n) => set({ startCountdown: n }),
  setGameEnded: (finalScores, stats, podium) => set({ finalScores, gameStats: stats, podium, phase: 'ended' }),
  reset: () => set({ ...initialState }),
}));
