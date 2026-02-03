'use client';

import { useState } from 'react';

type GameState = 'menu' | 'setup' | 'reveal' | 'playing' | 'results';
type Role = 'imposter' | 'crewmate';
type Category = 'footballers' | 'clash-royale' | 'celebrities' | 'superheroes' | 'objects' | 'custom';

interface Player {
  id: number;
  role: Role;
  revealed: boolean;
}

interface GameItem {
  name: string;
  hint: string;
}

const categories = {
  footballers: [] as GameItem[],
  'clash-royale': [] as GameItem[],
  celebrities: [] as GameItem[],
  superheroes: [] as GameItem[],
  objects: [] as GameItem[],
  custom: [] as GameItem[],
};

export default function ImposterGame() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [selectedCategory, setSelectedCategory] = useState<Category>('footballers');
  const [playerCount, setPlayerCount] = useState(5);
  const [imposterCount, setImposterCount] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [theme, setTheme] = useState<GameItem>({ name: '', hint: '' });
  const [showRole, setShowRole] = useState(false);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [footballers, setFootballers] = useState<GameItem[]>([]);
  const [clashRoyale, setClashRoyale] = useState<GameItem[]>([]);
  const [celebrities, setCelebrities] = useState<GameItem[]>([]);
  const [superheroes, setSuperheroes] = useState<GameItem[]>([]);
  const [objects, setObjects] = useState<GameItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [startingPlayer, setStartingPlayer] = useState<number | null>(null);

  const loadFootballers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/football.json');
      const data = await response.json();
      const footballersList: GameItem[] = data.items.map((item: any) => ({
        name: item.name,
        hint: item.hint
      }));
      setFootballers(footballersList);
    } catch (error) {
      console.error('Error loading footballers:', error);
    }
    setIsLoading(false);
  };

  const loadClashRoyale = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/clash.json');
      const data = await response.json();
      const clashRoyaleCards: GameItem[] = data.cards.map((card: any) => ({
        name: card.name,
        hint: card.hint
      }));
      setClashRoyale(clashRoyaleCards);
    } catch (error) {
      console.error('Error loading Clash Royale cards:', error);
    }
    setIsLoading(false);
  };

  const loadCelebrities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/celebs.json');
      const data = await response.json();
      const celebritiesList: GameItem[] = data.items.map((item: any) => ({
        name: item.name,
        hint: item.hint
      }));
      setCelebrities(celebritiesList);
    } catch (error) {
      console.error('Error loading celebrities:', error);
    }
    setIsLoading(false);
  };

  const loadSuperheroes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/superheroes.json');
      const data = await response.json();
      const superheroesList: GameItem[] = data.items.map((item: any) => ({
        name: item.name,
        hint: item.hint
      }));
      setSuperheroes(superheroesList);
    } catch (error) {
      console.error('Error loading superheroes:', error);
    }
    setIsLoading(false);
  };

  const loadObjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/objects.json');
      const data = await response.json();
      const objectsList: GameItem[] = data.items.map((item: any) => ({
        name: item.name,
        hint: item.hint
      }));
      setObjects(objectsList);
    } catch (error) {
      console.error('Error loading objects:', error);
    }
    setIsLoading(false);
  };

  const selectCategory = (category: Category) => {
    setSelectedCategory(category);
    if (category === 'footballers' && footballers.length === 0) {
      loadFootballers();
    } else if (category === 'clash-royale' && clashRoyale.length === 0) {
      loadClashRoyale();
    } else if (category === 'celebrities' && celebrities.length === 0) {
      loadCelebrities();
    } else if (category === 'superheroes' && superheroes.length === 0) {
      loadSuperheroes();
    } else if (category === 'objects' && objects.length === 0) {
      loadObjects();
    }
    setGameState('setup');
  };

  const addCustomWord = () => {
    if (customInput.trim()) {
      setCustomWords([...customWords, customInput.trim()]);
      setCustomInput('');
    }
  };

  const removeCustomWord = (index: number) => {
    setCustomWords(customWords.filter((_, i) => i !== index));
  };

  const getItemsForCategory = (): GameItem[] => {
    if (selectedCategory === 'footballers') return footballers;
    if (selectedCategory === 'clash-royale') return clashRoyale;
    if (selectedCategory === 'celebrities') return celebrities;
    if (selectedCategory === 'superheroes') return superheroes;
    if (selectedCategory === 'objects') return objects;
    return customWords.map(word => ({ name: word, hint: 'Denk goed na...' }));
  };

  const startGame = () => {
    const items = getItemsForCategory();
    if (items.length === 0) {
      alert('Voeg eerst items toe!');
      return;
    }
    
    const randomItem = items[Math.floor(Math.random() * items.length)];
    setTheme(randomItem);
    
    const newPlayers: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1,
      role: 'crewmate',
      revealed: false,
    }));

    const imposterIndices = new Set<number>();
    while (imposterIndices.size < imposterCount) {
      imposterIndices.add(Math.floor(Math.random() * playerCount));
    }
    
    imposterIndices.forEach(index => {
      newPlayers[index].role = 'imposter';
    });

    setPlayers(newPlayers);
    setCurrentPlayer(0);
    setGameState('reveal');
  };

  const showCurrentRole = () => {
    setShowRole(true);
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayer].revealed = true;
    setPlayers(updatedPlayers);
  };

  const handleCardPress = () => {
    setIsHolding(true);
    setIsCardFlipped(true);
    if (!showRole) {
      showCurrentRole();
    }
  };

  const handleCardRelease = () => {
    setIsHolding(false);
    setIsCardFlipped(false);
  };

  const nextPlayer = () => {
    setShowRole(false);
    setIsCardFlipped(false);
    setIsHolding(false);
    if (currentPlayer < playerCount - 1) {
      setCurrentPlayer(currentPlayer + 1);
    } else {
      // Kies random startspeler
      const randomStartPlayer = Math.floor(Math.random() * playerCount) + 1;
      setStartingPlayer(randomStartPlayer);
      setGameState('playing');
    }
  };

  const endGame = () => {
    setGameState('results');
  };

  const resetGame = () => {
    setGameState('menu');
    setCurrentPlayer(0);
    setPlayers([]);
    setTheme({ name: '', hint: '' });
    setShowRole(false);
    setStartingPlayer(null);
  };

  const backToMenu = () => {
    setGameState('menu');
  };

  const getCategoryTitle = () => {
    const titles = {
      footballers: 'VOETBALLERS',
      'clash-royale': 'CLASH ROYALE',
      celebrities: 'BEROEMDHEDEN',
      superheroes: 'SUPERHELDEN',
      objects: 'OBJECTEN',
      custom: 'CUSTOM',
    };
    return titles[selectedCategory];
  };

  const getLabel = () => {
    const labels = {
      footballers: 'Voetballer',
      'clash-royale': 'Card',
      celebrities: 'Beroemdheid',
      superheroes: 'Superheld',
      objects: 'Object',
      custom: 'Woord',
    };
    return labels[selectedCategory];
  };

  const getResultLabel = () => {
    const labels = {
      footballers: 'De voetballer was',
      'clash-royale': 'De card was',
      celebrities: 'De beroemdheid was',
      superheroes: 'De superheld was',
      objects: 'Het object was',
      custom: 'Het woord was',
    };
    return labels[selectedCategory];
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F1419]">
      <div className="w-full max-w-md">
        
        {/* MENU SCREEN */}
        {gameState === 'menu' && (
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-8 border border-[#2A3F5F] animate-fadeIn">
            <div className="space-y-2 animate-slideDown">
              <h1 className="text-5xl font-bold text-center text-white tracking-tight uppercase">
                IMPOSTER
              </h1>
              <p className="text-center text-[#016FB9] text-xs uppercase tracking-widest">
                Deception Game
              </p>
            </div>
            
            <div className="h-px bg-[#2A3F5F]"></div>
            
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-[#016FB9] uppercase tracking-wider mb-4">
                Selecteer Categorie
              </h2>
              {[
                { id: 'footballers', label: 'VOETBALLERS' },
                { id: 'clash-royale', label: 'CLASH ROYALE' },
                { id: 'celebrities', label: 'BEROEMDHEDEN' },
                { id: 'superheroes', label: 'SUPERHELDEN' },
                { id: 'objects', label: 'OBJECTEN' },
                { id: 'custom', label: 'CUSTOM' },
              ].map((cat, index) => (
                <button 
                  key={cat.id} 
                  onClick={() => selectCategory(cat.id as Category)} 
                  className="w-full bg-[#1A1F2E] border border-[#016FB9] text-white text-sm font-semibold py-4 px-6 rounded hover:bg-[#016FB9] hover:text-white hover:border-[#016FB9] hover:scale-105 hover:shadow-lg transition-all duration-200 uppercase tracking-wide shadow-sm animate-slideUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* SETUP SCREEN */}
        {gameState === 'setup' && (
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-6 border border-[#2A3F5F] animate-fadeIn">
            <button 
              onClick={backToMenu} 
              className="text-[#016FB9] text-sm font-semibold uppercase tracking-wide hover:text-white hover:-translate-x-1 transition-all"
            >
              ← Terug
            </button>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-center text-white tracking-tight uppercase">
                {getCategoryTitle()}
              </h1>
              <div className="h-px bg-[#2A3F5F]"></div>
            </div>

            {isLoading && (
              <div className="text-center py-8">
                <p className="text-[#016FB9] text-sm uppercase tracking-wider">Laden...</p>
              </div>
            )}

            {selectedCategory === 'custom' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={customInput} 
                    onChange={(e) => setCustomInput(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && addCustomWord()} 
                    placeholder="Woord toevoegen..." 
                    className="flex-1 px-4 py-3 bg-[#1A1F2E] border border-[#2A3F5F] rounded text-white placeholder-[#016FB9]/60 focus:outline-none focus:border-[#016FB9] text-sm"
                  />
                  <button 
                    onClick={addCustomWord} 
                    className="bg-[#016FB9] text-white px-6 py-3 rounded font-bold hover:bg-[#004C8C] transition-all uppercase text-sm shadow-sm"
                  >
                    Add
                  </button>
                </div>

                {customWords.length > 0 && (
                  <div className="bg-[#1A1F2E] rounded p-4 max-h-40 overflow-y-auto border border-[#2A3F5F]">
                    {customWords.map((word, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-[#1A1F2E] rounded px-4 py-2 mb-2 border border-[#2A3F5F] shadow-sm"
                      >
                        <span className="font-semibold text-white text-sm">{word}</span>
                        <button 
                          onClick={() => removeCustomWord(index)} 
                          className="text-[#DC143C] font-bold hover:text-[#9A031E] transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {customWords.length < 3 && (
                  <p className="text-xs text-[#DC143C] text-center font-semibold uppercase tracking-wide">
                    Minimaal 3 woorden vereist
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-6 pt-4">
              <div>
                <label className="block text-xs font-bold text-[#016FB9] uppercase tracking-wider mb-3">
                  Aantal Spelers (3-12)
                </label>
                <input 
                  type="number" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="3" 
                  max="12" 
                  value={playerCount} 
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    setPlayerCount(value as number);
                  }}
                  onBlur={(e) => {
                    let value = Number(e.target.value);
                    if (isNaN(value) || value < 3) value = 3;
                    if (value > 12) value = 12;
                    setPlayerCount(value);
                    // Pas imposterCount aan als het te hoog is
                    if (imposterCount > Math.floor(value / 2)) {
                      setImposterCount(Math.floor(value / 2));
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-6 py-4 bg-[#1A1F2E] border-2 border-[#016FB9] rounded-lg text-white text-center text-3xl font-bold focus:outline-none focus:border-[#016FB9] focus:ring-2 focus:ring-[#016FB9]/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#DC143C] uppercase tracking-wider mb-3">
                  Aantal Imposters (1-{Math.min(3, Math.floor(playerCount / 2))})
                </label>
                <input 
                  type="number" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="1" 
                  max={Math.min(3, Math.floor(playerCount / 2))} 
                  value={imposterCount} 
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    setImposterCount(value as number);
                  }}
                  onBlur={(e) => {
                    const maxImposters = Math.min(3, Math.floor(playerCount / 2));
                    let value = Number(e.target.value);
                    if (isNaN(value) || value < 1) value = 1;
                    if (value > maxImposters) value = maxImposters;
                    setImposterCount(value);
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-6 py-4 bg-[#1A1F2E] border-2 border-[#DC143C] rounded-lg text-white text-center text-3xl font-bold focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/50 transition-all"
                />
              </div>
            </div>

            <button 
              onClick={startGame} 
              className="w-full bg-[#016FB9] text-white text-sm font-bold py-4 rounded hover:bg-[#004C8C] transition-all uppercase tracking-wide shadow-sm"
            >
              Start Game
            </button>
          </div>
        )}
        
        {/* REVEAL SCREEN */}
        {gameState === 'reveal' && (
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-6 border border-[#2A3F5F] animate-fadeIn">
            <div className="text-center space-y-3 animate-slideDown">
              <div className="w-16 h-16 mx-auto bg-[#1A1F2E] rounded-full border-2 border-[#016FB9] flex items-center justify-center shadow-sm animate-pulse">
                <span className="text-2xl font-bold text-[#016FB9]">{currentPlayer + 1}</span>
              </div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-tight">
                SPELER {currentPlayer + 1}
              </h2>
              <p className="text-[#016FB9] text-xs uppercase tracking-widest">
                {currentPlayer + 1} van {playerCount}
              </p>
            </div>

            <div className="h-px bg-[#2A3F5F]"></div>

            <div className="space-y-4">
              <p className="text-center text-sm text-[#004C8C] uppercase tracking-wide">
                Houd de kaart ingedrukt om je rol te zien
              </p>
              
              {/* Flip Card Container */}
              <div 
                className="relative w-full h-[28rem] cursor-pointer select-none"
                style={{ perspective: '1000px' }}
              >
                <div 
                  className={`relative w-full h-full transition-all duration-700 ease-out`}
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                  onMouseDown={handleCardPress}
                  onMouseUp={handleCardRelease}
                  onMouseLeave={handleCardRelease}
                  onTouchStart={handleCardPress}
                  onTouchEnd={handleCardRelease}
                >
                  {/* Card Front */}
                  <div 
                    className="absolute w-full h-full rounded-2xl border-4 border-[#2A3F5F] bg-gradient-to-br from-[#016FB9] to-[#004C8C] flex items-center justify-center shadow-2xl"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  >
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-5 bg-[#1A1F2E]/20 rounded-full border-4 border-[#016FB9] flex items-center justify-center">
                        <span className="text-7xl font-bold text-white">?</span>
                      </div>
                      <p className="text-white text-xl font-bold uppercase tracking-wider">
                        Druk &amp; Houd
                      </p>
                    </div>
                  </div>

                  {/* Card Back */}
                  {showRole && (
              <div 
                className="absolute w-full h-full rounded-2xl border-4 text-center shadow-2xl p-6"
                style={{ 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className={`h-full rounded-2xl border-4 flex flex-col items-center justify-center p-6 ${
                  players[currentPlayer].role === 'imposter' 
                    ? 'bg-[#DC143C] border-[#DC143C]' 
                    : 'bg-[#016FB9] border-[#016FB9]'
                }`}>
                  {players[currentPlayer].role === 'imposter' && (
                    <div className="w-24 h-24 mx-auto mb-4 bg-[#1A1F2E]/20 rounded-full border-4 border-white flex items-center justify-center shadow-md">
                      <span className="text-5xl font-bold text-white">I</span>
                    </div>
                  )}
                  
                  <h3 className="text-3xl font-bold text-white mb-4 uppercase tracking-tight">
                    {players[currentPlayer].role === 'imposter' ? 'IMPOSTER' : 'PLAYER'}
                  </h3>
                  
                  {players[currentPlayer].role === 'crewmate' ? (
                    <div className="bg-[#1A1F2E]/95 rounded-xl p-5 shadow-md w-full">
                      <p className="text-[#016FB9] text-xs font-semibold mb-2 uppercase tracking-wider">
                        {getLabel()}
                      </p>
                      <p className="text-2xl text-white font-bold uppercase break-words">
                        {theme.name}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#1A1F2E]/95 rounded-xl p-5 shadow-md w-full">
                      <p className="text-white text-xs font-semibold mb-2 uppercase tracking-wider">
                        Hint
                      </p>
                      <p className="text-sm text-white font-medium leading-snug">
                        {theme.hint}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
                </div>
              </div>

              {showRole && (
              <button 
                onClick={nextPlayer} 
                className="w-full bg-[#016FB9] text-white text-sm font-bold py-4 rounded hover:bg-[#004C8C] transition-all uppercase tracking-wide shadow-sm"
              >
                {currentPlayer < playerCount - 1 ? 'Volgende Speler' : 'Start Game'}
              </button>
              )}
            </div>
          </div>
        )}
        
        {/* PLAYING SCREEN */}
        {gameState === 'playing' && (
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-6 border border-[#2A3F5F] animate-fadeIn">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-center text-white uppercase tracking-tight">
                IN GAME
              </h2>
              <div className="h-px bg-[#2A3F5F]"></div>
            </div>

            {/* Starting Player Announcement */}
            {startingPlayer && (
              <div className="bg-[#016FB9]/20 border-2 border-[#016FB9] rounded-lg p-6 text-center animate-pulse">
                <p className="text-xs text-[#016FB9] uppercase tracking-wider mb-2 font-bold">
                  Startspeler
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-[#016FB9] rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{startingPlayer}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white uppercase">
                      Speler {startingPlayer}
                    </p>
                    <p className="text-sm text-[#016FB9]">begint het spel</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-[#1A1F2E] border border-[#2A3F5F] rounded-lg p-6 shadow-sm">
              <h3 className="text-xs font-bold text-[#016FB9] uppercase tracking-wider mb-4">
                Spelregels
              </h3>
              <ul className="space-y-2 text-white text-sm">
                <li className="flex items-start">
                  <span className="text-[#016FB9] mr-2 font-bold">→</span>
                  <span>Crewmates: Stel vragen over het onderwerp</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#DC143C] mr-2 font-bold">→</span>
                  <span>Imposters: Gebruik de hint slim</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#016FB9] mr-2 font-bold">→</span>
                  <span>Stem wie de imposter is</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1A1F2E] border-2 border-[#016FB9] rounded-lg p-6 text-center shadow-sm">
                <div className="text-xs text-[#016FB9] uppercase tracking-wider mb-2 font-bold">
                  Crewmates
                </div>
                <div className="text-4xl font-bold text-[#016FB9]">
                  {playerCount - imposterCount}
                </div>
              </div>
              <div className="bg-[#1A1F2E] border-2 border-[#DC143C] rounded-lg p-6 text-center shadow-sm">
                <div className="text-xs text-[#DC143C] uppercase tracking-wider mb-2 font-bold">
                  Imposters
                </div>
                <div className="text-4xl font-bold text-[#DC143C]">
                  {imposterCount}
                </div>
              </div>
            </div>

            <button 
              onClick={endGame} 
              className="w-full bg-[#016FB9] text-white text-sm font-bold py-4 rounded hover:bg-[#004C8C] transition-all uppercase tracking-wide shadow-sm"
            >
              Toon Resultaten
            </button>
          </div>
        )}
        
        {/* RESULTS SCREEN */}
        {gameState === 'results' && (
          <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-6 space-y-4 border border-[#2A3F5F] animate-fadeIn">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-center text-white uppercase tracking-tight">
                RESULTATEN
              </h2>
              <div className="h-px bg-[#2A3F5F]"></div>
            </div>
            
            <div className="bg-[#1A1F2E] border-2 border-[#016FB9] rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-bold text-center text-[#016FB9] uppercase tracking-wider mb-2">
                {getResultLabel()}
              </h3>
              <p className="text-xl text-center font-bold text-white uppercase mb-2">
                {theme.name}
              </p>
              <p className="text-xs text-center text-[#004C8C]">
                {theme.hint}
              </p>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players.map((player) => (
                <div 
                  key={player.id} 
                  className={`p-3 rounded-lg flex items-center justify-between border-2 shadow-sm ${
                    player.role === 'imposter' 
                      ? 'bg-[#FFF5F5] border-[#DC143C]' 
                      : 'bg-[#1A1F2E] border-[#016FB9]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      player.role === 'imposter' 
                        ? 'border-[#DC143C] text-[#DC143C] bg-[#1A1F2E]' 
                        : 'border-[#016FB9] text-[#016FB9] bg-[#1A1F2E]'
                    }`}>
                      {player.id}
                    </div>
                    <span className="font-bold text-white text-xs uppercase tracking-wide">
                      Speler {player.id}
                    </span>
                  </div>
                  <span className={`font-bold text-xs uppercase tracking-wider ${
                    player.role === 'imposter' ? 'text-[#DC143C]' : 'text-[#016FB9]'
                  }`}>
                    {player.role === 'imposter' ? 'IMPOSTER' : 'PLAYER'}
                  </span>
                </div>
              ))}
            </div>

            <button 
              onClick={resetGame} 
              className="w-full bg-[#016FB9] text-white text-sm font-bold py-3 rounded hover:bg-[#004C8C] transition-all uppercase tracking-wide shadow-sm"
            >
              Nieuw Spel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
