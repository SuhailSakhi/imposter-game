const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active rooms
const rooms = new Map();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Create room
    socket.on('create-room', (data, callback) => {
      const roomCode = generateRoomCode();
      
      rooms.set(roomCode, {
        hostId: socket.id,
        players: new Map([[socket.id, { 
          id: socket.id, 
          name: data.playerName, 
          ready: false 
        }]]),
        gameState: 'waiting'
      });

      socket.join(roomCode);
      
      callback({ success: true, roomCode, playerId: socket.id });
      console.log(`Room created: ${roomCode} by ${data.playerName}`);
    });

    // Join room
    socket.on('join-room', (data, callback) => {
      const room = rooms.get(data.roomCode);
      
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.gameState !== 'waiting') {
        callback({ success: false, error: 'Game already started' });
        return;
      }

      room.players.set(socket.id, {
        id: socket.id,
        name: data.playerName,
        ready: false
      });

      socket.join(data.roomCode);
      
      io.to(data.roomCode).emit('room-update', {
        players: Array.from(room.players.values()),
        hostId: room.hostId
      });

      callback({ success: true, playerId: socket.id });
      console.log(`${data.playerName} joined room ${data.roomCode}`);
    });

    // Player ready toggle
    socket.on('toggle-ready', (data) => {
      const room = rooms.get(data.roomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.ready = !player.ready;

      io.to(data.roomCode).emit('room-update', {
        players: Array.from(room.players.values()),
        hostId: room.hostId
      });
    });

    // Start game
    socket.on('start-game', (data) => {
      const room = rooms.get(data.roomCode);
      if (!room || room.hostId !== socket.id) return;

      room.gameState = 'playing';
      room.category = data.category;
      room.playerCount = data.playerCount;
      room.imposterCount = data.imposterCount;
      room.theme = data.theme;

      // Assign roles
      const playerIds = Array.from(room.players.keys());
      const shuffled = playerIds.sort(() => Math.random() - 0.5);
      room.roles = new Map();

      shuffled.forEach((playerId, index) => {
        room.roles.set(
          playerId, 
          index < data.imposterCount ? 'imposter' : 'crewmate'
        );
      });

      // Calculate starting player
      const startingPlayerIndex = Math.floor(Math.random() * playerIds.length);
      const startingPlayerId = playerIds[startingPlayerIndex];
      const startingPlayerName = room.players.get(startingPlayerId).name;

      io.to(data.roomCode).emit('game-started', {
        category: data.category,
        playerCount: room.players.size,
        startingPlayer: startingPlayerName
      });

      // Send individual roles
      playerIds.forEach((playerId) => {
        const role = room.roles.get(playerId);
        io.to(playerId).emit('your-role', {
          role,
          theme: role === 'crewmate' ? data.theme : { name: '', hint: data.theme.hint }
        });
      });

      console.log(`Game started in room ${data.roomCode}`);
    });

    // Get my role
    socket.on('get-my-role', (data, callback) => {
      const room = rooms.get(data.roomCode);
      if (!room || !room.roles) {
        callback({ success: false });
        return;
      }

      const role = room.roles.get(socket.id);
      const theme = room.theme;

      callback({
        success: true,
        role,
        theme: role === 'crewmate' ? theme : { name: '', hint: theme?.hint }
      });
    });

    // End game
    socket.on('end-game', (data) => {
      const room = rooms.get(data.roomCode);
      if (!room || room.hostId !== socket.id) return;

      room.gameState = 'finished';

      const results = Array.from(room.players.values()).map(player => ({
        ...player,
        role: room.roles.get(player.id)
      }));

      io.to(data.roomCode).emit('game-ended', {
        results,
        theme: room.theme
      });
    });

    // Restart game
    socket.on('restart-game', (data) => {
      const room = rooms.get(data.roomCode);
      if (!room || room.hostId !== socket.id) return;

      // Reset game state
      room.gameState = 'waiting';
      room.roles = undefined;
      room.theme = undefined;

      // Reset all players to not ready
      room.players.forEach(player => {
        player.ready = false;
      });

      io.to(data.roomCode).emit('room-update', {
        players: Array.from(room.players.values()),
        hostId: room.hostId
      });

      console.log(`Game restarted in room ${data.roomCode}`);
    });

    // Leave room
    socket.on('leave-room', (data) => {
      handlePlayerLeave(socket.id, data.roomCode);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      rooms.forEach((room, roomCode) => {
        if (room.players.has(socket.id)) {
          handlePlayerLeave(socket.id, roomCode);
        }
      });
    });

    function handlePlayerLeave(playerId, roomCode) {
      const room = rooms.get(roomCode);
      if (!room) return;

      room.players.delete(playerId);

      if (room.players.size === 0) {
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted (empty)`);
      } else if (room.hostId === playerId) {
        room.hostId = Array.from(room.players.keys())[0];
        
        io.to(roomCode).emit('room-update', {
          players: Array.from(room.players.values()),
          hostId: room.hostId
        });
      } else {
        io.to(roomCode).emit('room-update', {
          players: Array.from(room.players.values()),
          hostId: room.hostId
        });
      }
    }
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
