'use client';

import { useState } from 'react';
import SearchInterface from "@/components/SearchInterface";
import Settings from "@/components/Settings";
import Clock from "@/components/Clock";

export default function Home() {
  const [currentView, setCurrentView] = useState<'search' | 'settings'>('search');

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-[#00ff41] phosphor-glow-strong mb-1 tracking-wider">
              JURISFTP
            </h1>
            <p className="text-xs text-[#00ff41] opacity-70 tracking-widest">
              BUILDING BETTER WORLDS
            </p>
          </div>
          <div className="text-right">
            <Clock />
            <p className="text-xs text-[#00ff41] opacity-60 tracking-wider mt-1">
              MISSION: JURIDICAL_FPT
            </p>
          </div>
        </header>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setCurrentView('search')}
            className={`terminal-button px-6 py-2 text-sm font-bold tracking-wider ${currentView === 'search' ? 'active' : ''}`}
          >
            SEARCH
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`terminal-button px-6 py-2 text-sm font-bold tracking-wider ${currentView === 'settings' ? 'active' : ''}`}
          >
            SETTINGS
          </button>
        </div>

        <div className="h-px bg-[#00ff41] opacity-30 mb-8"></div>

        {currentView === 'search' ? <SearchInterface /> : <Settings />}
      </div>
    </main>
  );
}
