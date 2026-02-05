# Imposter Game - Multiplayer Implementation

## 🎮 Features

### Local Mode (Original)
- Pass one phone around
- Each player views their role in sequence
- Perfect for in-person gatherings

### Online Multiplayer Mode (NEW!)
- Each player uses their own phone
- Room-based system with 4-character codes
- Real-time synchronization via Socket.io
- Host controls game start
- 3-12 players supported

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16 + React + TypeScript + Tailwind CSS
- **Real-time**: Socket.io (WebSocket)
- **Server**: Custom Node.js server with Socket.io integration

### File Structure
```
src/
├── app/
│   ├── api/socket/route.ts   # Socket.io API route (not used with custom server)
│   ├── layout.tsx             # Root layout with SocketProvider
│   └── page.tsx               # Mode selector (Local vs Online)
├── components/
│   ├── ImposterGame.tsx       # Original local game
│   └── MultiplayerGame.tsx    # New online multiplayer
├── contexts/
│   └── SocketContext.tsx      # Socket.io React context
server.js                       # Custom Next.js server with Socket.io
```

## 🔌 Socket.io Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `create-room` | `{ playerName }` | Create a new game room |
| `join-room` | `{ roomCode, playerName }` | Join existing room |
| `toggle-ready` | `{ roomCode }` | Toggle ready status |
| `start-game` | `{ roomCode, category, playerCount, imposterCount, theme }` | Start the game (host only) |
| `get-my-role` | `{ roomCode }` | Request current role |
| `end-game` | `{ roomCode }` | End the game (host only) |
| `leave-room` | `{ roomCode }` | Leave the room |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `room-update` | `{ players[], hostId }` | Room state updated |
| `game-started` | `{ category, playerCount, startingPlayer }` | Game has started |
| `your-role` | `{ role, theme }` | Your role assignment |
| `game-ended` | `{ results[], theme }` | Game finished |

## 📱 How to Play (Online Mode)

### 1. Host Creates Room
1. Select "Online Game"
2. Enter your name
3. Click "Create Room"
4. Share the 4-letter room code with friends

### 2. Players Join
1. Enter name and click "Join Room"
2. Enter the room code
3. Click "Ready" when ready to play

### 3. Start Game
1. Host waits for all players (min 3) to be ready
2. Host clicks "Start Game"
3. Each player sees their role on their own device

### 4. Play
- **Players**: See the topic (e.g., "Messi")
- **Imposters**: See only a hint (e.g., "Best footballer ever")
- Starting player is announced
- Discuss and vote who the imposter is!

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Hosting Options

#### Option 1: Railway (Recommended)
1. Push to GitHub
2. Connect Railway to your repo
3. Deploy automatically
4. Free tier available

#### Option 2: Render
1. Connect GitHub repo
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Deploy

#### Option 3: Vercel + External Socket Server
- Deploy Next.js to Vercel (frontend)
- Deploy Socket.io server separately (Railway/Render)
- Update socket connection URL in `SocketContext.tsx`

## 🔧 Environment Variables

No environment variables needed for basic setup. All runs on same server.

For separate socket server deployment:
```env
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.com
```

## 🎯 Future Enhancements

- [ ] Persist rooms in Redis (currently in-memory)
- [ ] Add game timer
- [ ] In-game chat
- [ ] Vote system
- [ ] Kick player (host)
- [ ] Reconnection handling
- [ ] Game history/stats
- [ ] Custom categories in multiplayer
- [ ] Spectator mode
- [ ] Multiple game rooms simultaneously
- [ ] Audio/video chat integration

## 📊 Performance

- **Latency**: < 50ms (WebSocket)
- **Concurrent Games**: Limited by server memory (recommend Redis for production)
- **Max Players per Room**: 12
- **Connection**: Persistent WebSocket

## 🐛 Troubleshooting

### "Connecting to server..." stuck
- Check if server is running (`npm run dev`)
- Check console for Socket.io errors
- Verify firewall/network settings

### Room not found
- Room codes expire when all players leave
- Room codes are case-sensitive (auto-uppercase)

### Players not seeing updates
- Check Socket.io connection status
- Refresh browser
- Rejoin room

## 📝 License

MIT

## 👤 Author

Created with ❤️ for party games
