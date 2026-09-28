import { useState, useEffect, lazy, Suspense } from 'react';
import { TopHeaderBar } from './components/TopHeaderBar';
import { HomePage } from './components/HomePage';
import { UpdateBanner } from './components/UpdateBanner';
import { useJjkStore } from './store/useJjkStore';

// Code-Splitting: Lazy loading dinâmico de abas e modais pesados
const CharactersList = lazy(() => import('./components/CharactersList').then(m => ({ default: m.CharactersList })));
const CharacterDetail = lazy(() => import('./components/CharacterDetail').then(m => ({ default: m.CharacterDetail })));
const MemoriesList = lazy(() => import('./components/MemoriesList').then(m => ({ default: m.MemoriesList })));
const TimelineView = lazy(() => import('./components/TimelineView').then(m => ({ default: m.TimelineView })));
const TierlistMaker = lazy(() => import('./components/TierlistMaker').then(m => ({ default: m.TierlistMaker })));
const BestTeams = lazy(() => import('./components/BestTeams').then(m => ({ default: m.BestTeams })));
const CharacterCompare = lazy(() => import('./components/CharacterCompare').then(m => ({ default: m.CharacterCompare })));
const GachaSimulator = lazy(() => import('./components/GachaSimulator').then(m => ({ default: m.GachaSimulator })));
const DpsCalculator = lazy(() => import('./components/DpsCalculator').then(m => ({ default: m.DpsCalculator })));
const BuffsRankings = lazy(() => import('./components/BuffsRankings').then(m => ({ default: m.BuffsRankings })));
const RaidBossGuide = lazy(() => import('./components/RaidBossGuide').then(m => ({ default: m.RaidBossGuide })));
const Jujutsudle = lazy(() => import('./components/Jujutsudle').then(m => ({ default: m.Jujutsudle })));
const StaminaTracker = lazy(() => import('./components/StaminaTracker').then(m => ({ default: m.StaminaTracker })));
const AscensionPlanner = lazy(() => import('./components/AscensionPlanner').then(m => ({ default: m.AscensionPlanner })));
const TacticalScratchpad = lazy(() => import('./components/TacticalScratchpad').then(m => ({ default: m.TacticalScratchpad })));
const TacticalSoundboardModal = lazy(() => import('./components/TacticalSoundboardModal').then(m => ({ default: m.TacticalSoundboardModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));

function TabLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-4 animate-pulse">
      <div 
        className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40 animate-spin" 
        style={{ animationDuration: '3s' }}
      >
        <div className="w-6 h-6 rounded-lg bg-[#06070c]" />
      </div>
      <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold font-mono">
        Manipulando Energia Amaldiçoada...
      </p>
    </div>
  );
}

import charactersData from './data/characters.json';
import memoriesData from './data/memories.json';
import timelineData from './data/timeline.json';

import { playCubeSummonChime } from './utils/sound';

import type { ActiveTab, Character, Memory, TimelineEvent } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [charactersSearch, setCharactersSearch] = useState<string>('');

  const { 
    isSettingsOpen, 
    closeSettings,
    isSoundboardOpen, 
    closeSoundboard,
    checkAndApplyDailySavings 
  } = useJjkStore();

  // Garante que o aplicativo sempre inicie na Home/Catálogo com todos os modais de UI fechados
  useEffect(() => {
    useJjkStore.setState({ isSettingsOpen: false, isSoundboardOpen: false });
  }, []);

  // Monitor de virada de dia em tempo real: verifica no mount, a cada 30s e ao focar/retornar à janela
  useEffect(() => {
    const handleCheck = () => {
      const res = checkAndApplyDailySavings();
      if (res.applied) {
        playCubeSummonChime();
      }
    };

    handleCheck();

    const interval = setInterval(handleCheck, 30000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleCheck();
      }
    };
    const onFocus = () => handleCheck();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkAndApplyDailySavings]);
  const characters = charactersData as Character[];
  const memories = memoriesData as Memory[];
  const timeline = timelineData as TimelineEvent[];

  const handleSelectCharacter = (char: Character) => {
    setSelectedCharacter(char);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (tab: ActiveTab, search?: string) => {
    setSelectedCharacter(null);
    setActiveTab(tab);
    if (search) {
      setCharactersSearch(search);
    } else {
      setCharactersSearch('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#06070c] text-slate-100 flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Holographic Navigation Header Bar */}
      <TopHeaderBar 
        activeTab={activeTab} 
        setActiveTab={handleNavigate}
        selectedCharacter={selectedCharacter}
        onBackToHub={() => {
          setSelectedCharacter(null);
          handleNavigate('home');
        }}
      />

      {/* Main Full-Width Content Area */}
      <main className="flex-1 w-full min-h-screen p-3 sm:p-5 md:p-8 overflow-y-auto pb-24">
        {/* Auto-Updater Toast Banner */}
        <UpdateBanner />

        <Suspense fallback={<TabLoadingFallback />}>
          {selectedCharacter ? (
            <CharacterDetail
              key={selectedCharacter.id}
              character={selectedCharacter}
              memories={memories}
              onBack={() => setSelectedCharacter(null)}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomePage 
                  characters={characters}
                  onSelectCharacter={handleSelectCharacter}
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === 'characters' && (
                <CharactersList 
                  characters={characters}
                  onSelectCharacter={handleSelectCharacter}
                  initialSearch={charactersSearch}
                />
              )}

              {activeTab === 'compare' && (
                <CharacterCompare 
                  characters={characters}
                  onSelectCharacter={handleSelectCharacter}
                />
              )}

              {activeTab === 'memories' && (
                <MemoriesList 
                  memories={memories}
                />
              )}

              {activeTab === 'tierlist' && (
                <TierlistMaker 
                  characters={characters}
                  onSelectCharacter={handleSelectCharacter}
                />
              )}

              {activeTab === 'teams' && (
                <BestTeams 
                  characters={characters}
                  memories={memories}
                  onSelectCharacter={handleSelectCharacter}
                />
              )}

              {activeTab === 'buffs' && (
                <BuffsRankings 
                  characters={characters}
                  onSelectCharacter={handleSelectCharacter}
                />
              )}

              {activeTab === 'timeline' && (
                <TimelineView 
                  events={timeline}
                />
              )}

              {activeTab === 'gacha' && (
                <GachaSimulator 
                  characters={characters}
                  memories={memories}
                  onSelectCharacter={handleSelectCharacter}
                />
              )}

              {activeTab === 'dps' && (
                <DpsCalculator 
                  characters={characters}
                  memories={memories}
                  onSelectCharacter={handleSelectCharacter}
                />
              )}

              {activeTab === 'raids' && (
                <RaidBossGuide 
                  characters={characters}
                  onSelectCharacter={handleSelectCharacter}
                />
              )}

              {activeTab === 'jujutsudle' && (
                <Jujutsudle 
                  onSelectCharacter={handleSelectCharacter}
                />
              )}

              {activeTab === 'stamina' && (
                <StaminaTracker />
              )}

              {activeTab === 'planner' && (
                <AscensionPlanner 
                  onSelectCharacter={handleSelectCharacter}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Tactical Floating Scratchpad & Modals */}
      <Suspense fallback={null}>
        <TacticalScratchpad />

        <TacticalSoundboardModal 
          isOpen={isSoundboardOpen} 
          onClose={closeSoundboard} 
        />

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={closeSettings} 
        />
      </Suspense>
    </div>
  );
}

export default App;
