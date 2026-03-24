import { Player, PlayerMedia } from './Player.js';

export interface Guess {
  playerId: string;
  guessedPlayerId: string;
  timestamp: number;
  points: number;
}

export interface RoundResult {
  roundNumber: number;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  ownerPlayerId: string;
  guesses: Map<string, Guess>;
  pointsAwarded: Map<string, number>;
}

export class Round {
  public roundNumber: number;
  public media: PlayerMedia;
  public ownerPlayerId: string;
  public guesses: Map<string, Guess>;
  public startTime: number;
  public displayDuration: number;
  public isComplete: boolean;

  constructor(roundNumber: number, media: PlayerMedia, ownerPlayerId: string, displayDuration: number) {
    this.roundNumber = roundNumber;
    this.media = media;
    this.ownerPlayerId = ownerPlayerId;
    this.guesses = new Map();
    this.startTime = Date.now();
    this.displayDuration = displayDuration;
    this.isComplete = false;
  }

  submitGuess(playerId: string, guessedPlayerId: string, timestamp: number): Guess {
    const elapsed = timestamp - this.startTime;
    let points = 0;

    if (guessedPlayerId === this.ownerPlayerId) {
      points = 100;
      if (elapsed <= 1000) points += 50;
      else if (elapsed <= 2000) points += 30;
      else if (elapsed <= 3000) points += 10;
    }

    const guess: Guess = { playerId, guessedPlayerId, timestamp, points };
    this.guesses.set(playerId, guess);
    return guess;
  }

  calculateResults(players: Player[]): RoundResult {
    const pointsAwarded = new Map<string, number>();

    // Points for correct guesses
    for (const [, guess] of this.guesses) {
      if (guess.points > 0) {
        pointsAwarded.set(guess.playerId, (pointsAwarded.get(guess.playerId) || 0) + guess.points);
      }
    }

    // Bonus if nobody guessed the photo owner
    const anyCorrect = Array.from(this.guesses.values()).some(g => g.guessedPlayerId === this.ownerPlayerId);
    if (!anyCorrect) {
      pointsAwarded.set(this.ownerPlayerId, (pointsAwarded.get(this.ownerPlayerId) || 0) + 25);
    }

    this.isComplete = true;

    return {
      roundNumber: this.roundNumber,
      mediaUrl: this.media.url,
      mediaType: this.media.type,
      ownerPlayerId: this.ownerPlayerId,
      guesses: this.guesses,
      pointsAwarded,
    };
  }

  toJSON() {
    return {
      roundNumber: this.roundNumber,
      mediaUrl: this.media.url,
      mediaType: this.media.type,
      ownerPlayerId: this.ownerPlayerId,
      displayDuration: this.displayDuration,
    };
  }
}
