import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket/socket';

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');

  function connectAndListen() {
    if (!socket.connected) socket.connect();

    socket.once('room_error', ({ message }) => {
      setError(message);
      socket.disconnect();
    });

    return () => {
      socket.off('room_error');
    };
  }

  function handleCreate() {
    if (!username.trim()) return setError('Enter a username');
    setError('');
    connectAndListen();

    socket.once('room_created', ({ inviteCode: code }) => {
      navigate(`/room/${code}`);
    });

    socket.emit('create_room', { username: username.trim() });
  }

  function handleJoin() {
    if (!username.trim()) return setError('Enter a username');
    if (!inviteCode.trim()) return setError('Enter an invite code');
    setError('');
    connectAndListen();

    socket.once('room_joined', ({ roomState }) => {
      navigate(`/room/${roomState.inviteCode}`);
    });

    socket.emit('join_room', { inviteCode: inviteCode.trim().toUpperCase(), username: username.trim() });
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1>Voodl</h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8, fontSize: 16 }}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={handleCreate} style={{ marginRight: 8, padding: '8px 16px' }}>
        Create Room
      </button>
      <button onClick={() => setShowJoin(v => !v)} style={{ padding: '8px 16px' }}>
        Join Room
      </button>

      {showJoin && (
        <div style={{ marginTop: 12 }}>
          <input
            type="text"
            placeholder="Invite Code"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, fontSize: 16 }}
          />
          <button onClick={handleJoin} style={{ padding: '8px 16px' }}>
            Join
          </button>
        </div>
      )}
    </div>
  );
}
