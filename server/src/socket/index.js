const roomManager = require('../game/RoomManager');
const db = require('../db');

function registerGameHandlers(io, socket) {
  socket.on('create_room', async ({ username }) => {
    try {
      const roomState = await roomManager.createRoom(username, socket.id, db);
      socket.join(roomState.inviteCode);
      socket.emit('room_created', { inviteCode: roomState.inviteCode, roomState });
    } catch (err) {
      socket.emit('room_error', { message: err.message });
    }
  });

  socket.on('join_room', ({ inviteCode, username }) => {
    try {
      const roomState = roomManager.joinRoom(inviteCode, username, socket.id);
      socket.join(inviteCode);
      socket.emit('room_joined', { roomState });
      socket.to(inviteCode).emit('player_joined', { username, roomState });
    } catch (err) {
      socket.emit('room_error', { message: err.message });
    }
  });

  socket.on('disconnect', () => {
    // Find which room this socket was in
    for (const inviteCode of Object.keys(roomManager.rooms)) {
      const room = roomManager.getRoom(inviteCode);
      if (room && room.players.some(p => p.socketId === socket.id)) {
        const result = roomManager.leaveRoom(inviteCode, socket.id);
        if (result && result.roomState) {
          io.to(inviteCode).emit('player_left', {
            username: result.username,
            roomState: result.roomState,
          });
        }
        break;
      }
    }
  });
}

module.exports = registerGameHandlers;
