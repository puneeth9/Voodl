function registerSignalingHandlers(io, socket) {
  socket.on('webrtc_offer', ({ targetSocketId, sdp }) => {
    console.log(`[signaling] webrtc_offer from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit('webrtc_offer', { fromSocketId: socket.id, sdp });
  });

  socket.on('webrtc_answer', ({ targetSocketId, sdp }) => {
    console.log(`[signaling] webrtc_answer from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit('webrtc_answer', { fromSocketId: socket.id, sdp });
  });

  socket.on('webrtc_ice_candidate', ({ targetSocketId, candidate }) => {
    console.log(`[signaling] webrtc_ice_candidate from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit('webrtc_ice_candidate', { fromSocketId: socket.id, candidate });
  });

  socket.on('webrtc_peer_left', ({ targetSocketId }) => {
    console.log(`[signaling] webrtc_peer_left from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit('webrtc_peer_left', { fromSocketId: socket.id });
  });
}

module.exports = registerSignalingHandlers;
