'use client';

import { useState } from 'react';
import ImposterGame from '@/components/ImposterGame';
import MultiplayerGame from '@/components/MultiplayerGame';

export default function Home() {
  const [mode, setMode] = useState<'select' | 'local' | 'online'>('select');

  if (mode === 'local') {
    return (
      <main className="bg-[#0F1419]">
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setMode('select')}
            className="bg-[#016FB9] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#004C8C] transition-all"
          >
            ← Back
          </button>
        </div>
        <ImposterGame />
      </main>
    );
  }

  if (mode === 'online') {
    return (
      <main className="bg-[#0F1419]">
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setMode('select')}
            className="bg-[#016FB9] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#004C8C] transition-all"
          >
            ← Back
          </button>
        </div>
        <MultiplayerGame />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 space-y-8 border border-[#2A3F5F] animate-fadeIn">
          <div className="space-y-2 text-center animate-slideDown">
            <h1 className="text-5xl font-bold text-white tracking-tight uppercase">
              IMPOSTER
            </h1>
            <p className="text-[#016FB9] text-xs uppercase tracking-widest">
              Deception Game
            </p>
          </div>

          <div className="h-px bg-[#2A3F5F]"></div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold text-[#016FB9] uppercase tracking-wider mb-4 text-center">
              Select Game Mode
            </h2>

            <button
              onClick={() => setMode('local')}
              className="w-full bg-[#016FB9] border-2 border-[#016FB9] text-white text-sm font-semibold py-6 px-6 rounded-lg hover:bg-[#004C8C] hover:scale-105 hover:shadow-lg transition-all duration-200 uppercase tracking-wide shadow-sm"
            >
              <div className="text-left">
                <div className="text-lg font-bold mb-1">📱 Local Game</div>
                <div className="text-xs opacity-80">Pass phone around</div>
              </div>
            </button>

            <button
              onClick={() => setMode('online')}
              className="w-full bg-[#1A1F2E] border-2 border-[#016FB9] text-white text-sm font-semibold py-6 px-6 rounded-lg hover:bg-[#016FB9] hover:scale-105 hover:shadow-lg transition-all duration-200 uppercase tracking-wide shadow-sm"
            >
              <div className="text-left">
                <div className="text-lg font-bold mb-1">🌐 Online Game</div>
                <div className="text-xs opacity-80">Each player uses own phone</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
