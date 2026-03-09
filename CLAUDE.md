# CLAUDE.md — Voodl (Scribble Game)

## Project Overview
Voodl is a real-time multiplayer drawing and guessing game (Skribbl.io-style). One player draws a word, the rest guess it via text chat. All guessing players are connected via WebRTC audio chat. The drawer is automatically muted during their turn. Players join private rooms via invite codes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Audio | WebRTC (peer-to-peer, native browser API) |
| Database | PostgreSQL |
| ORM/Query | pg (node-postgres) |

---

## Monorepo Structure

```
scribble/
├── client/                         # React + Vite frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/
│   │   │   ├── useSocket.js        # Socket.io event bindings
│   │   │   └── useWebRTC.js        # WebRTC lifecycle hook
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Username input, create/join room
│   │   │   ├── Room.jsx            # Main game screen
│   │   │   └── Leaderboard.jsx     # Per-room end screen
│   │   ├── socket/
│   │   │   └── socket.js           # Socket.io singleton (autoConnect: false)
│   │   ├── webrtc/
│   │   │   └── peerManager.js      # RTCPeerConnection manager
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js              # Proxies /api and ws to localhost:4000
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js            # pg Pool, reads DATABASE_URL from .env
│   │   │   └── migrations/         # SQL files run in order on startup
│   │   ├── game/
│   │   │   └── RoomManager.js      # Singleton in-memory room state
│   │   ├── socket/
│   │   │   ├── index.js            # Registers all socket handlers
│   │   │   └── signalingHandlers.js# WebRTC signaling relay only
│   │   ├── routes/
│   │   │   └── health.js           # GET /api/health
│   │   └── index.js                # Entry point
│   ├── .env.example
│   └── package.json
│
├── CLAUDE.md
├── .gitignore
└── README.md
```

---

## Architecture Decisions

### In-Memory Room State (RoomManager)
- `RoomManager` is a **singleton** — instantiated once, exported as `module.exports = new RoomManager()`
- `this.rooms` is a **dictionary keyed by invite code** — multiple concurrent games are fully isolated
- PostgreSQL is only written to at **two points**: room creation and game end (scores)
- Everything during active gameplay (drawing strokes, guesses, timers, scoring) is purely in-memory
- Never add DB calls inside the game loop — keep it fast

### WebRTC Audio
- Socket.io server is a **signaling relay only** — it never touches audio data
- Peer connections are managed client-side in `peerManager.js`
- Active connections stored in a `peers` map: `{ [socketId]: RTCPeerConnection }`
- When a player becomes the drawer: `muteLocalAudio()` is called + other clients close the peer connection with the drawer
- When drawer's turn ends: connections re-established, `unmuteLocalAudio()` called
- No external WebRTC library — use native browser `RTCPeerConnection` API only

### Rooms
- Private rooms only — join via 8-character alphanumeric invite code
- First player to create the room is the host
- If host disconnects, next player in the list becomes host automatically
- No public lobby

### Authentication
- Username only for now (no password, no auth)
- `players` DB table has no `password_hash` column intentionally
- Schema is designed so auth can be added later without breaking changes

---

## Game Rules
- Turn duration: **60 seconds**
- Total rounds: **3** (hardcoded for now)
- Word pool: mix of hardcoded server words + words suggested by players before game starts
- Drawer is excluded from audio chat during their turn
- All guessing players remain in audio chat throughout
- Leaderboard shown at end of game (per-room only, no global leaderboard)

---

## Database Schema

```sql
rooms           -- one row per room, tracks invite_code and lifecycle
players         -- one row per player session, stores socket_id (updated on reconnect)
game_sessions   -- one row per game played in a room
round_scores    -- one row per player per round, stores points_earned and was_drawer
```

---

## Socket Events Reference

### Game Events (socket/index.js)
| Direction | Event | Payload |
|---|---|---|
| C → S | `create_room` | `{ username }` |
| C → S | `join_room` | `{ inviteCode, username }` |
| S → C | `room_created` | `{ inviteCode, roomState }` |
| S → C | `room_joined` | `{ roomState }` |
| S → C | `room_error` | `{ message }` |
| S → C | `player_joined` | `{ username, roomState }` |
| S → C | `player_left` | `{ username, roomState }` |

### Signaling Events (socket/signalingHandlers.js)
| Direction | Event | Payload |
|---|---|---|
| C → S → C | `webrtc_offer` | `{ targetSocketId, sdp }` |
| C → S → C | `webrtc_answer` | `{ targetSocketId, sdp }` |
| C → S → C | `webrtc_ice_candidate` | `{ targetSocketId, candidate }` |
| C → S → C | `webrtc_peer_left` | `{ targetSocketId }` |

All signaling events are relayed as-is to the target socket. Server does not inspect SDP or ICE data.

---

## Environment Variables

```
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/scribble
```

---

## Running the Project

```bash
# Server
cd server && npm install && npm run dev

# Client
cd client && npm install && npm run dev
```

Client runs on `http://localhost:5173`, server on `http://localhost:4000`.

---

## Key Conventions
- Never put game logic in socket handlers — socket handlers call RoomManager methods only
- Never call the DB inside the game loop — in-memory only during gameplay
- `getRoomState()` must always strip `currentWord` before broadcasting — the socket layer sends it separately to the drawer only
- All signaling handlers live in `signalingHandlers.js`, never mixed into game socket handlers
- `peerManager.js` is framework-agnostic vanilla JS — do not import React into it
- `useWebRTC.js` is the only place that bridges peerManager with React lifecycle

---

## Build Steps
This project is being built incrementally:

- **Step 1** ✅ — Project scaffold, DB setup, room create/join, WebRTC signaling stubs
- **Step 2** — Drawing canvas, word selection, turn management, full WebRTC audio wiring
- **Step 3** — Guessing logic, scoring, leaderboard screen
- **Step 4** — Polish, error handling, reconnection logic