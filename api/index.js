const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// In-memory room storage (no database!)
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('🐱 Player connected:', socket.id);

  // Create or join room
  socket.on('createRoom', () => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      players: [socket.id],
      gameState: {
        tiltLeft: 0,
        tiltRight: 0,
        trayAngle: 0,
        waterLevel: 100,
        position: 10,
        isPlaying: false,
        winner: false,
        obstaclesDodged: 0,
        lastObstacleCheck: 0
      }
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, playerNumber: 1 });
    console.log('🎮 Room created:', roomCode);
  });

  socket.on('joinRoom', (roomCode) => {
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('error', 'Room not found 😢');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', 'Room is full 🚫');
      return;
    }

    room.players.push(socket.id);
    socket.join(roomCode);
    socket.emit('roomJoined', { roomCode, playerNumber: 2 });

    io.to(roomCode).emit('bothPlayersReady');
    console.log('🐰 Player joined room:', roomCode);
  });

  socket.on('startGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.players.length === 2) {
      room.gameState.isPlaying = true;
      room.gameState.waterLevel = 100;
      room.gameState.position = 10;
      room.gameState.trayAngle = 0;
      room.gameState.obstaclesDodged = 0;
      room.gameState.lastObstacleCheck = 0;
      io.to(roomCode).emit('gameStarted', room.gameState);
    }
  });

  socket.on('tilt', ({ roomCode, value }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState.isPlaying) return;

    const playerIndex = room.players.indexOf(socket.id);

    if (playerIndex === 0) {
      room.gameState.tiltLeft = value;
    } else if (playerIndex === 1) {
      room.gameState.tiltRight = value;
    }

    room.gameState.trayAngle = (room.gameState.tiltLeft + room.gameState.tiltRight) / 2;

    const tiltAmount = Math.abs(room.gameState.trayAngle);
    if (tiltAmount > 15) {
      room.gameState.waterLevel -= 2;
    }

    if (tiltAmount < 10) {
      room.gameState.position += 0.3;
    }

    const currentProgress = Math.floor(room.gameState.position / 10);
    if (currentProgress > room.gameState.lastObstacleCheck && tiltAmount < 10) {
      room.gameState.obstaclesDodged++;
      room.gameState.lastObstacleCheck = currentProgress;
    }

    if (room.gameState.position >= 90) {
      room.gameState.isPlaying = false;
      room.gameState.winner = true;
      io.to(roomCode).emit('gameOver', {
        winner: true,
        waterLevel: room.gameState.waterLevel,
        obstaclesDodged: room.gameState.obstaclesDodged
      });
      return;
    }

    if (room.gameState.waterLevel <= 0) {
      room.gameState.isPlaying = false;
      room.gameState.winner = false;
      io.to(roomCode).emit('gameOver', { winner: false });
      return;
    }

    io.to(roomCode).emit('updateGame', room.gameState);
  });

  socket.on('obstacleHit', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState.isPlaying) return;

    room.gameState.waterLevel -= 5;
    console.log('⚠️ Obstacle hit! Water level:', room.gameState.waterLevel);

    if (room.gameState.waterLevel <= 0) {
      room.gameState.isPlaying = false;
      room.gameState.winner = false;
      io.to(roomCode).emit('gameOver', { winner: false });
    }
  });

  socket.on('disconnect', () => {
    console.log('👋 Player disconnected:', socket.id);

    for (const [code, room] of rooms.entries()) {
      if (room.players.includes(socket.id)) {
        io.to(code).emit('playerLeft');
        rooms.delete(code);
        console.log('🗑️ Room deleted:', code);
        break;
      }
    }
  });
});

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = httpServer;
