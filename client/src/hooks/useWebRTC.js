import { useEffect } from 'react';
import socket from '../socket/socket';
import peerManager from '../webrtc/peerManager';

export default function useWebRTC() {
  useEffect(() => {
    function onOffer({ fromSocketId, sdp }) {
      // stub: handle incoming offer
      console.log('[webrtc] offer from', fromSocketId);
    }

    function onAnswer({ fromSocketId, sdp }) {
      // stub: handle incoming answer
      console.log('[webrtc] answer from', fromSocketId);
    }

    function onIceCandidate({ fromSocketId, candidate }) {
      // stub: handle incoming ICE candidate
      console.log('[webrtc] ice_candidate from', fromSocketId);
    }

    function onPeerLeft({ fromSocketId }) {
      // stub: handle peer leaving
      console.log('[webrtc] peer_left from', fromSocketId);
    }

    socket.on('webrtc_offer', onOffer);
    socket.on('webrtc_answer', onAnswer);
    socket.on('webrtc_ice_candidate', onIceCandidate);
    socket.on('webrtc_peer_left', onPeerLeft);

    return () => {
      socket.off('webrtc_offer', onOffer);
      socket.off('webrtc_answer', onAnswer);
      socket.off('webrtc_ice_candidate', onIceCandidate);
      socket.off('webrtc_peer_left', onPeerLeft);
    };
  }, []);

  function muteLocalAudio() {
    // stub
    console.log('[webrtc] muteLocalAudio');
  }

  function unmuteLocalAudio() {
    // stub
    console.log('[webrtc] unmuteLocalAudio');
  }

  return { muteLocalAudio, unmuteLocalAudio };
}
