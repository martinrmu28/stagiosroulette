import { v4 as uuidv4 } from 'uuid';
import { Player, PlayerMedia } from './Player.js';
import { Round, RoundResult } from './Round.js';
import fs from 'fs';
import path from 'path';

export interface RoomSettings {
  totalRounds: number;
  displayDuration: number;
  mediaMode: 'photo' | 'video' | 'both';
  progressiveBlur: boolean;
}

export type RoomStatus = 'waiting' | 'starting' | 'playing' | 'results';

export interface GameStats {
  mostGuessedPhoto: { mediaUrl: string; ownerName: string; correctCount: number } | null;
  mostMysteriousPlayer: { name: string; guessedCount: number } | null;
  fastestAnswer: { playerName: string; time: number } | null;
}

export class Room {
  public code: string;
  public players: Map<string, Player>;
  public status: RoomStatus;
  public settings: RoomSettings;
  public rounds: Round[];
  public currentRoundIndex: number;
  public allMedia: Array<{ media: PlayerMedia; ownerId: string }>;
  public createdAt: Date;
  public lastActivity: Date;

  constructor(code: string, settings: RoomSettings) {
    this.code = code;
    this.players = new Map();
    this.status = 'waiting';
    this.settings = settings;
    this.rounds = [];
    this.currentRoundIndex = -1;
    this.allMedia = [];
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    this.lastActivity = new Date();
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
      this.lastActivity = new Date();
    }
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  getConnectedPlayers(): Player[] {
    return Array.from(this.players.values()).filter(p => p.isConnected);
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  addMediaToPlayer(playerId: string, media: PlayerMedia): void {
    const player = this.players.get(playerId);
    if (player) {
      player.addMedia(media);
      this.allMedia.push({ media, ownerId: playerId });
    }
    this.lastActivity = new Date();
  }

  removeMediaFromPlayer(playerId: string, mediaId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.removeMedia(mediaId);
      this.allMedia = this.allMedia.filter(m => m.media.id !== mediaId);
    }
  }

  setPlayerReady(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.setReady(true);
    }
  }

  allPlayersReady(): boolean {
    const connected = this.getConnectedPlayers();
    return connected.length >= 3 && connected.every(p => p.isReady);
  }

  prepareRounds(): void {
    // Shuffle all media
    const shuffled = [...this.allMedia].sort(() => Math.random() - 0.5);
    const selectedMedia = shuffled.slice(0, this.settings.totalRounds);

    this.rounds = selectedMedia.map((item, index) =>
      new Round(index + 1, item.media, item.ownerId, this.settings.displayDuration * 1000)
    );
    this.currentRoundIndex = 0;
  }

  getCurrentRound(): Round | null {
    if (this.currentRoundIndex < 0 || this.currentRoundIndex >= this.rounds.length) return null;
    return this.rounds[this.currentRoundIndex];
  }

  nextRound(): Round | null {
    this.currentRoundIndex++;
    if (this.currentRoundIndex >= this.rounds.length) return null;
    return this.rounds[this.currentRoundIndex];
  }

  applyRoundResults(result: RoundResult): void {
    for (const [playerId, points] of result.pointsAwarded) {
      const player = this.players.get(playerId);
      if (player) {
        player.addScore(points);
      }
    }
    this.lastActivity = new Date();
  }

  getScores(): Array<{ playerId: string; name: string; avatar: string; score: number }> {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .map(p => ({ playerId: p.id, name: p.name, avatar: p.avatar, score: p.score }));
  }

  getGameStats(): GameStats {
    const guessCountMap = new Map<string, number>();
    const correctGuessMap = new Map<string, number>();
    let fastestAnswer: { playerName: string; time: number } | null = null;

    for (const round of this.rounds) {
      if (!round.isComplete) continue;

      for (const [, guess] of round.guesses) {
        if (guess.guessedPlayerId === round.ownerPlayerId) {
          const count = correctGuessMap.get(round.ownerPlayerId) || 0;
          correctGuessMap.set(round.ownerPlayerId, count + 1);

          const elapsed = guess.timestamp - round.startTime;
          const guesser = this.players.get(guess.playerId);
          if (guesser && (!fastestAnswer || elapsed < fastestAnswer.time)) {
            fastestAnswer = { playerName: guesser.name, time: elapsed };
          }
        }
        const count = guessCountMap.get(guess.guessedPlayerId) || 0;
        guessCountMap.set(guess.guessedPlayerId, count + 1);
      }
    }

    let mostGuessedPhoto = null;
    let maxCorrect = 0;
    for (const [ownerId, count] of correctGuessMap) {
      if (count > maxCorrect) {
        maxCorrect = count;
        const owner = this.players.get(ownerId);
        const roundForOwner = this.rounds.find(r => r.ownerPlayerId === ownerId && r.isComplete);
        if (owner && roundForOwner) {
          mostGuessedPhoto = { mediaUrl: roundForOwner.media.url, ownerName: owner.name, correctCount: count };
        }
      }
    }

    let mostMysteriousPlayer = null;
    let minGuessed = Infinity;
    for (const player of this.players.values()) {
      const guessed = correctGuessMap.get(player.id) || 0;
      if (guessed < minGuessed) {
        minGuessed = guessed;
        mostMysteriousPlayer = { name: player.name, guessedCount: guessed };
      }
    }

    return { mostGuessedPhoto, mostMysteriousPlayer, fastestAnswer };
  }

  cleanup(): void {
    // Delete media files
    for (const { media } of this.allMedia) {
      const filePath = path.join(process.cwd(), 'public', media.url.replace('/api/media/', ''));
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    this.allMedia = [];
  }

  toJSON() {
    return {
      code: this.code,
      status: this.status,
      settings: this.settings,
      players: Array.from(this.players.values()).map(p => p.toJSON()),
      currentRound: this.currentRoundIndex + 1,
      totalRounds: this.rounds.length,
    };
  }
}
