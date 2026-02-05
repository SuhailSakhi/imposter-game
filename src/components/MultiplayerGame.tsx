'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

type GameMode = 'select' | 'create' | 'join' | 'lobby' | 'playing' | 'results';
type Role = 'imposter' | 'crewmate';
type Category = 'footballers' | 'clash-royale' | 'celebrities' | 'superheroes' | 'objects';

interface Player {
  id: string;
  name: string;
  ready: boolean;
}

interface GameData {
  role?: Role;
  theme?: { name: string; hint: string };
  category?: string;
  playerCount?: number;
  startingPlayer?: string;
}

interface GameItem {
  name: string;
  hint: string;
}

export default function MultiplayerGame() {
  const { socket, isConnected } = useSocket();
  const [gameMode, setGameMode] = useState<GameMode>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState('');
  const [gameData, setGameData] = useState<GameData>({});
  const [error, setError] = useState('');
  
  // Host game settings
  const [selectedCategory, setSelectedCategory] = useState<Category>('footballers');
  const [imposterCount, setImposterCount] = useState(1);
  const [categoryData, setCategoryData] = useState<{ [key: string]: GameItem[] }>({});

  // Load category data
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [footballers, clash, celebs, heroes, objs] = await Promise.all([
          fetch('/football.json').then(r => r.json()),
          fetch('/clash.json').then(r => r.json()),
          fetch('/celebs.json').then(r => r.json()),
          fetch('/superheroes.json').then(r => r.json()),
          fetch('/objects.json').then(r => r.json()),
        ]);
        
        setCategoryData({
          footballers,
          'clash-royale': clash,
          celebrities: celebs,
          superheroes: heroes,
          objects: objs,
        });
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    
    loadCategories();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for room updates
    socket.on('room-update', (data: { players: Player[]; hostId: string }) => {
      setPlayers(data.players);
      setHostId(data.hostId);
    });

    // Listen for game started
    socket.on('game-started', (data: { category: string; playerCount: number; startingPlayer: string }) => {
      setGameData(prev => ({ 
        ...prev, 
        category: data.category, 
        playerCount: data.playerCount,
        startingPlayer: data.startingPlayer
      }));
      setGameMode('playing');
    });

    // Listen for my role
    socket.on('your-role', (data: { role: Role; theme: { name: string; hint: string } }) => {
      setGameData(prev => ({ ...prev, role: data.role, theme: data.theme }));
    });

    // Listen for game ended
    socket.on('game-ended', (data: { results: any[]; theme: { name: string; hint: string } }) => {
      setGameData(prev => ({ ...prev, theme: data.theme }));
      setGameMode('results');
    });

    return () => {
      socket.off('room-update');
      socket.off('game-started');
      socket.off('your-role');
      socket.off('game-ended');
    };
  }, [socket]);

  const createRoom = () => {
    if (!socket || !playerName.trim()) return;

    socket.emit('create-room', { playerName: playerName.trim() }, (response: any) => {
      if (response.success) {
        setRoomCode(response.roomCode);
        setPlayerId(response.playerId);
        setIsHost(true);
        setPlayers([{ id: response.playerId, name: playerName, ready: false }]);
        setHostId(response.playerId);
        setGameMode('lobby');
      }
    });
  };

  const joinRoom = () => {
    if (!socket || !playerName.trim() || !roomCode.trim()) return;

    socket.emit('join-room', 
      { roomCode: roomCode.toUpperCase().trim(), playerName: playerName.trim() },
      (response: any) => {
        if (response.success) {
          setPlayerId(response.playerId);
          setIsHost(false);
          setGameMode('lobby');
        } else {
          setError(response.error || 'Could not join room');
        }
      }
    );
  };

  const toggleReady = () => {
    if (!socket) return;
    socket.emit('toggle-ready', { roomCode });
  };

  const startGame = () => {
    if (!socket || !isHost) return;

    // Get random theme from selected category
    const items = categoryData[selectedCategory] || [];
    if (items.length === 0) return;
    
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    socket.emit('start-game', {
      roomCode,
      category: selectedCategory,
      playerCount: players.length,
      imposterCount: imposterCount,
      theme: randomItem
    });
  };

  const restartGame = () => {
    if (!socket || !isHost) return;
    
    // Reset all players to not ready
    socket.emit('restart-game', { roomCode });
    
    // Back to lobby
    setGameMode('lobby');
    setGameData({});
  };

  const endGame = () => {
    if (!socket || !isHost) return;
    
    socket.emit('end-game', { roomCode });
  };

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit('leave-room', { roomCode });
    setGameMode('select');
    setRoomCode('');
    setPlayers([]);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
        <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 border border-[#2A3F5F]">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-[#016FB9] rounded-full animate-pulse"></div>
            <p className="text-white text-lg">Connecting to server...</p>
          </div>
        </div>
      </div>
    );
  }

  // MODE SELECT
  if (gameMode === 'select') {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-6 border border-[#2A3F5F] animate-fadeIn">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-white uppercase tracking-tight">
                MULTIPLAYER
              </h1>
              <p className="text-[#016FB9] text-xs uppercase tracking-widest">
                Imposter Game
              </p>
            </div>

            <div className="h-px bg-[#2A3F5F]"></div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A1F2E] border-2 border-[#016FB9] rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-[#016FB9]/50"
                maxLength={15}
              />

              <button
                onClick={() => setGameMode('create')}
                disabled={!playerName.trim()}
                className="w-full bg-[#016FB9] text-white text-sm font-bold py-4 rounded hover:bg-[#004C8C] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Room
              </button>

              <button
                onClick={() => setGameMode('join')}
                disabled={!playerName.trim()}
                className="w-full bg-[#1A1F2E] border-2 border-[#016FB9] text-white text-sm font-bold py-4 rounded hover:bg-[#016FB9] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CREATE MODE
  if (gameMode === 'create') {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-6 border border-[#2A3F5F] animate-fadeIn">
            <button
              onClick={() => setGameMode('select')}
              className="text-[#016FB9] text-sm font-semibold uppercase tracking-wide hover:text-white transition-all"
            >
              ← Back
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white uppercase">Create Room</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-[#1A1F2E] border-2 border-[#016FB9] rounded-lg p-4 text-center">
                <p className="text-[#016FB9] text-xs uppercase mb-2">Your Name</p>
                <p className="text-white text-xl font-bold">{playerName}</p>
              </div>

              <button
                onClick={createRoom}
                className="w-full bg-[#016FB9] text-white text-sm font-bold py-4 rounded hover:bg-[#004C8C] transition-all uppercase tracking-wide"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // JOIN MODE
  if (gameMode === 'join') {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-6 border border-[#2A3F5F] animate-fadeIn">
            <button
              onClick={() => {
                setGameMode('select');
                setError('');
              }}
              className="text-[#016FB9] text-sm font-semibold uppercase tracking-wide hover:text-white transition-all"
            >
              ← Back
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white uppercase">Join Room</h2>
            </div>

            {error && (
              <div className="bg-[#DC143C]/20 border-2 border-[#DC143C] rounded-lg p-3 text-center">
                <p className="text-[#DC143C] text-sm font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Room Code"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError('');
                }}
                className="w-full px-4 py-3 bg-[#1A1F2E] border-2 border-[#016FB9] rounded-lg text-white text-center text-2xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#016FB9]/50 tracking-widest"
                maxLength={4}
              />

              <button
                onClick={joinRoom}
                disabled={roomCode.length !== 4}
                className="w-full bg-[#016FB9] text-white text-sm font-bold py-4 rounded hover:bg-[#004C8C] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LOBBY
  if (gameMode === 'lobby') {
    const currentPlayer = players.find(p => p.id === playerId);
    const allReady = players.length >= 3 && players.every(p => p.ready || p.id === hostId);

    const categoryNames: { [key: string]: string } = {
      'footballers': '⚽ Footballers',
      'clash-royale': '👑 Clash Royale',
      'celebrities': '⭐ Celebrities',
      'superheroes': '🦸 Superheroes',
      'objects': '📦 Objects',
    };

    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-6 border border-[#2A3F5F] animate-fadeIn">
            <div className="flex justify-between items-center">
              <button
                onClick={leaveRoom}
                className="text-[#DC143C] text-sm font-semibold uppercase tracking-wide hover:text-white transition-all"
              >
                Leave
              </button>
              <div className="bg-[#016FB9] px-4 py-2 rounded-lg">
                <p className="text-white text-xl font-bold tracking-widest">{roomCode}</p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white uppercase">Lobby</h2>
              <p className="text-[#016FB9] text-xs">
                {players.length} / 12 players
              </p>
            </div>

            {/* Host Settings */}
            {isHost && (
              <div className="space-y-4 pb-4 border-b border-[#2A3F5F]">
                <h3 className="text-xs font-bold text-[#016FB9] uppercase tracking-wider">
                  Game Settings
                </h3>
                
                {/* Category Selection */}
                <div>
                  <label className="text-[#016FB9] text-xs uppercase tracking-wider block mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(categoryNames) as Category[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                          selectedCategory === cat
                            ? 'bg-[#016FB9] text-white border-2 border-[#016FB9]'
                            : 'bg-[#1A1F2E] text-white border-2 border-[#2A3F5F] hover:border-[#016FB9]'
                        }`}
                      >
                        {categoryNames[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Imposter Count */}
                <div>
                  <label className="text-[#016FB9] text-xs uppercase tracking-wider block mb-2">
                    Imposters
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((count) => (
                      <button
                        key={count}
                        onClick={() => setImposterCount(count)}
                        disabled={count >= players.length}
                        className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                          imposterCount === count
                            ? 'bg-[#DC143C] text-white border-2 border-[#DC143C]'
                            : 'bg-[#1A1F2E] text-white border-2 border-[#2A3F5F] hover:border-[#DC143C]'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#016FB9] uppercase tracking-wider">
                Players
              </h3>
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                    player.ready
                      ? 'bg-[#016FB9]/20 border-[#016FB9]'
                      : 'bg-[#1A1F2E] border-[#2A3F5F]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">
                      {player.name}
                    </span>
                    {player.id === hostId && (
                      <span className="bg-[#016FB9] text-white text-xs px-2 py-0.5 rounded uppercase font-bold">
                        Host
                      </span>
                    )}
                  </div>
                  {player.ready && (
                    <span className="text-[#016FB9] text-xs font-bold uppercase">
                      ✓ Ready
                    </span>
                  )}
                </div>
              ))}
            </div>

            {!isHost ? (
              <button
                onClick={toggleReady}
                className={`w-full text-white text-sm font-bold py-4 rounded transition-all uppercase tracking-wide ${
                  currentPlayer?.ready
                    ? 'bg-[#DC143C] hover:bg-[#9A031E]'
                    : 'bg-[#016FB9] hover:bg-[#004C8C]'
                }`}
              >
                {currentPlayer?.ready ? 'Not Ready' : 'Ready'}
              </button>
            ) : (
              <button
                onClick={startGame}
                disabled={!allReady}
                className="w-full bg-[#016FB9] text-white text-sm font-bold py-4 rounded hover:bg-[#004C8C] transition-all uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {allReady ? 'Start Game' : `Waiting for players... (min 3)`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PLAYING
  if (gameMode === 'playing') {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-6 border border-[#2A3F5F] animate-fadeIn">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white uppercase">Your Role</h2>
              <div className="h-px bg-[#2A3F5F]"></div>
            </div>

            <div className={`rounded-2xl border-4 p-8 text-center ${
              gameData.role === 'imposter'
                ? 'bg-[#DC143C] border-[#DC143C]'
                : 'bg-[#016FB9] border-[#016FB9]'
            }`}>
              {gameData.role === 'imposter' && (
                <div className="w-24 h-24 mx-auto mb-4 bg-[#1A1F2E]/20 rounded-full border-4 border-white flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">I</span>
                </div>
              )}

              <h3 className="text-3xl font-bold text-white mb-4 uppercase">
                {gameData.role === 'imposter' ? 'IMPOSTER' : 'PLAYER'}
              </h3>

              {gameData.role === 'crewmate' ? (
                <div className="bg-[#1A1F2E]/95 rounded-xl p-5">
                  <p className="text-[#016FB9] text-xs font-semibold mb-2 uppercase">
                    Your topic
                  </p>
                  <p className="text-2xl text-white font-bold uppercase">
                    {gameData.theme?.name}
                  </p>
                </div>
              ) : (
                <div className="bg-[#1A1F2E]/95 rounded-xl p-5">
                  <p className="text-white text-xs font-semibold mb-2 uppercase">
                    Hint
                  </p>
                  <p className="text-sm text-white font-medium">
                    {gameData.theme?.hint}
                  </p>
                </div>
              )}
            </div>

            {gameData.startingPlayer && (
              <div className="bg-[#016FB9]/20 border-2 border-[#016FB9] rounded-lg p-4 text-center">
                <p className="text-[#016FB9] text-xs uppercase mb-1">Starting Player</p>
                <p className="text-white font-bold">{gameData.startingPlayer}</p>
              </div>
            )}

            <div className="bg-[#1A1F2E] border border-[#2A3F5F] rounded-lg p-4">
              <h3 className="text-xs font-bold text-[#016FB9] uppercase mb-3">
                Instructions
              </h3>
              <ul className="space-y-2 text-white text-sm">
                <li className="flex items-start">
                  <span className="text-[#016FB9] mr-2">→</span>
                  <span>Players: Ask questions about the topic</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#DC143C] mr-2">→</span>
                  <span>Imposters: Use your hint wisely</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#016FB9] mr-2">→</span>
                  <span>Vote who the imposter is!</span>
                </li>
              </ul>
            </div>

            {isHost && (
              <button
                onClick={endGame}
                className="w-full bg-[#DC143C] text-white text-sm font-bold py-4 rounded hover:bg-[#9A031E] transition-all uppercase tracking-wide"
              >
                End Game
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RESULTS
  if (gameMode === 'results') {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-6 border border-[#2A3F5F] animate-fadeIn">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white uppercase">Game Over!</h2>
              <div className="h-px bg-[#2A3F5F]"></div>
            </div>

            {gameData.theme && (
              <div className="bg-[#016FB9]/20 border-2 border-[#016FB9] rounded-xl p-6 text-center">
                <p className="text-[#016FB9] text-xs font-semibold mb-2 uppercase">
                  The topic was
                </p>
                <p className="text-3xl text-white font-bold uppercase">
                  {gameData.theme.name}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#016FB9] uppercase tracking-wider">
                Players in this game
              </h3>
              {players.map((player) => (
                <div
                  key={player.id}
                  className="p-3 rounded-lg border-2 border-[#2A3F5F] bg-[#1A1F2E] flex items-center justify-between"
                >
                  <span className="text-white font-bold text-sm">
                    {player.name}
                  </span>
                  {player.id === hostId && (
                    <span className="bg-[#016FB9] text-white text-xs px-2 py-0.5 rounded uppercase font-bold">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>

            {isHost ? (
              <div className="space-y-3">
                <button
                  onClick={restartGame}
                  className="w-full bg-[#016FB9] text-white text-sm font-bold py-4 rounded hover:bg-[#004C8C] transition-all uppercase tracking-wide"
                >
                  Play Again
                </button>
                <button
                  onClick={leaveRoom}
                  className="w-full bg-[#1A1F2E] border-2 border-[#DC143C] text-[#DC143C] text-sm font-bold py-4 rounded hover:bg-[#DC143C] hover:text-white transition-all uppercase tracking-wide"
                >
                  Leave Room
                </button>
              </div>
            ) : (
              <div className="bg-[#016FB9]/20 border-2 border-[#016FB9] rounded-lg p-4 text-center">
                <p className="text-white text-sm">
                  Waiting for host to start a new game or leave...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
