const { v4: uuidv4 } = require('uuid');

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

class RoomManager {
  constructor() {
    this.rooms = {};
  }

  async createRoom(username, socketId, db) {
    let inviteCode;
    // Ensure unique invite code
    do {
      inviteCode = generateInviteCode();
    } while (this.rooms[inviteCode]);

    await db.query(
      'INSERT INTO rooms (invite_code) VALUES ($1)',
      [inviteCode]
    );

    this.rooms[inviteCode] = {
      inviteCode,
      hostSocketId: socketId,
      players: [{ socketId, username }],
      status: 'waiting',
      currentWord: null,
      currentDrawerIndex: 0,
      round: 0,
    };

    return this.getRoomState(inviteCode);
  }

  joinRoom(inviteCode, username, socketId) {
    const room = this.rooms[inviteCode];
    if (!room) throw new Error('Room not found');
    if (room.status !== 'waiting') throw new Error('Game already in progress');

    room.players.push({ socketId, username });
    return this.getRoomState(inviteCode);
  }

  leaveRoom(inviteCode, socketId) {
    const room = this.rooms[inviteCode];
    if (!room) return null;

    const leavingPlayer = room.players.find(p => p.socketId === socketId);
    room.players = room.players.filter(p => p.socketId !== socketId);

    if (room.players.length === 0) {
      delete this.rooms[inviteCode];
      return { username: leavingPlayer?.username, roomState: null };
    }

    // Promote new host if host left
    if (room.hostSocketId === socketId) {
      room.hostSocketId = room.players[0].socketId;
    }

    return { username: leavingPlayer?.username, roomState: this.getRoomState(inviteCode) };
  }

  getRoom(inviteCode) {
    return this.rooms[inviteCode] || null;
  }

  getRoomState(inviteCode) {
    const room = this.rooms[inviteCode];
    if (!room) return null;

    const { currentWord, ...state } = room;
    return state;
  }
}

module.exports = new RoomManager();
