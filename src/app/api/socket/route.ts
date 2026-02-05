import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | undefined;

// Store active rooms in memory (in production, use Redis)
const rooms = new Map<string, {
  hostId: string;
  players: Map<string, { id: string; name: string; ready: boolean }>;
  gameState: 'waiting' | 'playing' | 'finished';
  category?: string;
  playerCount?: number;
  imposterCount?: number;
  roles?: Map<string, 'imposter' | 'crewmate'>;
  theme?: { name: string; hint: string };
}>();

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function GET(req: NextRequest) {
  if (!io) {
    // @ts-ignore
    const httpServer: HTTPServer = (global as any).httpServer;
    
    if (!httpServer) {
      return new Response('Socket.io server not initialized', { status: 500 });
    }

    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Create room
      socket.on('create-room', (data: { playerName: string }, callback) => {
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
      socket.on('join-room', (data: { roomCode: string; playerName: string }, callback) => {
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
        
        // Notify all players in room
        io?.to(data.roomCode).emit('room-update', {
          players: Array.from(room.players.values()),
          hostId: room.hostId
        });

        callback({ success: true, playerId: socket.id });
        console.log(`${data.playerName} joined room ${data.roomCode}`);
      });

      // Player ready toggle
      socket.on('toggle-ready', (data: { roomCode: string }) => {
        const room = rooms.get(data.roomCode);
        if (!room) return;

        const player = room.players.get(socket.id);
        if (!player) return;

        player.ready = !player.ready;

        io?.to(data.roomCode).emit('room-update', {
          players: Array.from(room.players.values()),
          hostId: room.hostId
        });
      });

      // Start game (host only)
      socket.on('start-game', (data: { 
        roomCode: string; 
        category: string; 
        playerCount: number;
        imposterCount: number;
        theme: { name: string; hint: string };
      }) => {
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
          room.roles!.set(
            playerId, 
            index < data.imposterCount ? 'imposter' : 'crewmate'
          );
        });

        // Notify all players
        io?.to(data.roomCode).emit('game-started', {
          category: data.category,
          playerCount: room.players.size
        });

        // Send individual roles
        playerIds.forEach((playerId) => {
          const role = room.roles!.get(playerId);
          io?.to(playerId).emit('your-role', {
            role,
            theme: role === 'crewmate' ? data.theme : { name: '', hint: data.theme.hint }
          });
        });

        console.log(`Game started in room ${data.roomCode}`);
      });

      // Get my role
      socket.on('get-my-role', (data: { roomCode: string }, callback) => {
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
      socket.on('end-game', (data: { roomCode: string }) => {
        const room = rooms.get(data.roomCode);
        if (!room || room.hostId !== socket.id) return;

        room.gameState = 'finished';

        // Send results
        const results = Array.from(room.players.values()).map(player => ({
          ...player,
          role: room.roles!.get(player.id)
        }));

        io?.to(data.roomCode).emit('game-ended', {
          results,
          theme: room.theme
        });
      });

      // Leave room
      socket.on('leave-room', (data: { roomCode: string }) => {
        handlePlayerLeave(socket.id, data.roomCode);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        
        // Find and remove player from all rooms
        rooms.forEach((room, roomCode) => {
          if (room.players.has(socket.id)) {
            handlePlayerLeave(socket.id, roomCode);
          }
        });
      });

      function handlePlayerLeave(playerId: string, roomCode: string) {
        const room = rooms.get(roomCode);
        if (!room) return;

        room.players.delete(playerId);

        if (room.players.size === 0) {
          // Delete empty room
          rooms.delete(roomCode);
          console.log(`Room ${roomCode} deleted (empty)`);
        } else if (room.hostId === playerId) {
          // Transfer host to first remaining player
          room.hostId = Array.from(room.players.keys())[0];
          
          io?.to(roomCode).emit('room-update', {
            players: Array.from(room.players.values()),
            hostId: room.hostId
          });
        } else {
          io?.to(roomCode).emit('room-update', {
            players: Array.from(room.players.values()),
            hostId: room.hostId
          });
        }
      }
    });

    console.log('Socket.io server initialized');
  }

  return new Response('Socket.io server running', { status: 200 });
}
