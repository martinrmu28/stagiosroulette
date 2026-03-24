export interface PlayerMedia {
  id: string;
  url: string;
  type: 'photo' | 'video';
  filename: string;
}

export class Player {
  public id: string;
  public socketId: string;
  public name: string;
  public avatar: string;
  public isHost: boolean;
  public isReady: boolean;
  public score: number;
  public media: PlayerMedia[];
  public isConnected: boolean;
  public lastSeen: Date;

  constructor(id: string, socketId: string, name: string, avatar: string, isHost = false) {
    this.id = id;
    this.socketId = socketId;
    this.name = name;
    this.avatar = avatar;
    this.isHost = isHost;
    this.isReady = false;
    this.score = 0;
    this.media = [];
    this.isConnected = true;
    this.lastSeen = new Date();
  }

  addMedia(media: PlayerMedia): void {
    this.media.push(media);
  }

  removeMedia(mediaId: string): void {
    this.media = this.media.filter(m => m.id !== mediaId);
  }

  setReady(ready: boolean): void {
    this.isReady = ready;
  }

  addScore(points: number): void {
    this.score += points;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      isHost: this.isHost,
      isReady: this.isReady,
      score: this.score,
      mediaCount: this.media.length,
      isConnected: this.isConnected,
    };
  }
}
