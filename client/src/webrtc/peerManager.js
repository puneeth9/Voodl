const peerManager = {
  peers: {}, // { [socketId]: RTCPeerConnection }

  createPeer(socketId, stream) {
    // stub
  },

  addIceCandidate(socketId, candidate) {
    // stub
  },

  handleAnswer(socketId, sdp) {
    // stub
  },

  closePeer(socketId) {
    // stub
  },

  closeAll() {
    // stub
  },
};

export default peerManager;
