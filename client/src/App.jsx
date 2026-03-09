import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Leaderboard from './pages/Leaderboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:inviteCode" element={<Room />} />
      <Route path="/leaderboard/:inviteCode" element={<Leaderboard />} />
    </Routes>
  );
}
