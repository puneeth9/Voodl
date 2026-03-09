import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket/socket';
import useWebRTC from '../hooks/useWebRTC';

export default function Room() {
  const { inviteCode } = useParams();
  const [players, setPlayers] = useState([]);
  useWebRTC();

  useEffect(() => {
    function onRoomJoined({ roomState }) {
      setPlayers(roomState.players);
    }

    function onRoomCreated({ roomState }) {
      setPlayers(roomState.players);
    }

    function onPlayerJoined({ roomState }) {
      setPlayers(roomState.players);
    }

    function onPlayerLeft({ roomState }) {
      if (roomState) setPlayers(roomState.players);
    }

    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);

    return () => {
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
    };
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Room: <strong>{inviteCode}</strong></h2>
      <p style={{ color: '#555' }}>Share this code with friends to join!</p>

      <h3>Players</h3>
      <ul>
        {players.map(p => (
          <li key={p.socketId}>{p.username}</li>
        ))}
      </ul>

      <hr />

      <div style={{ marginTop: 24, color: '#aaa' }}>
        <p>[Canvas coming in Step 2]</p>
        <p>[Chat coming in Step 2]</p>
      </div>
    </div>
  );
}
