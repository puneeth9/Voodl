require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const db = require('./db');
const registerGameHandlers = require('./socket/index');
const registerSignalingHandlers = require('./socket/signalingHandlers');
const healthRouter = require('./routes/health');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api', healthRouter);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'db', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await db.query(sql);
    console.log(`[migration] ran ${file}`);
  }
}

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);
  registerGameHandlers(io, socket);
  registerSignalingHandlers(io, socket);
  socket.on('disconnect', () => console.log(`[socket] disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 4000;

runMigrations()
  .then(() => {
    httpServer.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[migration] failed:', err);
    process.exit(1);
  });
