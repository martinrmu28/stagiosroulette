import { Room, RoomSettings } from './Room.js';
import { generateCode } from '../utils/codeGenerator.js';

export class GameManager {
  private rooms: Map<string, Room> = new Map();
  private readonly ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

  constructor() {
    // Cleanup expired rooms every 15 minutes
    setInterval(() => this.cleanupExpiredRooms(), 15 * 60 * 1000);
  }

  createRoom(settings: RoomSettings): Room {
    let code = generateCode();
    while (this.rooms.has(code)) {
      code = generateCode();
    }

    const room = new Room(code, settings);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  deleteRoom(code: string): void {
    const room = this.rooms.get(code);
    if (room) {
      room.cleanup();
      this.rooms.delete(code);
    }
  }

  private cleanupExpiredRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.lastActivity.getTime() > this.ROOM_EXPIRY_MS) {
        room.cleanup();
        this.rooms.delete(code);
        console.log(`Room ${code} expired and cleaned up`);
      }
    }
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}
