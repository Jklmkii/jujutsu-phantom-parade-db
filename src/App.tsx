import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { CharactersList } from './components/CharactersList';
import { CharacterDetail } from './components/CharacterDetail';
import { MemoriesList } from './components/MemoriesList';
import { TimelineView } from './components/TimelineView';
import { TierlistMaker } from './components/TierlistMaker';
import { BestTeams } from './components/BestTeams';
import { CharacterCompare } from './components/CharacterCompare';
import { GachaSimulator } from './components/GachaSimulator';
import { DpsCalculator } from './components/DpsCalculator';
import { BuffsRankings } from './components/BuffsRankings';
import { RaidBossGuide } from './components/RaidBossGuide';
import { Jujutsudle } from './components/Jujutsudle';
import { StaminaTracker } from './components/StaminaTracker';
import { AscensionPlanner } from './components/AscensionPlanner';
import { TacticalScratchpad } from './components/TacticalScratchpad';
import { TacticalSoundboardModal } from './components/TacticalSoundboardModal';
import { SettingsModal } from './components/SettingsModal';
import { UpdateBanner } from './components/UpdateBanner';
import { useJjkStore } from './store/useJjkStore';

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
    <div className="min-h-screen bg-[#090710] text-gray-100 flex relative">
      {/* Fixed Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleNavigate}
        selectedCharId={selectedCharacter?.id || null}
        onClearSelection={() => setSelectedCharacter(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-16 md:ml-64 min-h-screen p-4 md:p-8 overflow-y-auto pb-24">
        {/* Auto-Updater Toast Banner */}
        <UpdateBanner />

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
      </main>

      {/* Tactical Floating Scratchpad */}
      <TacticalScratchpad />

      {/* Tactical Soundboard Modal */}
      <TacticalSoundboardModal 
        isOpen={isSoundboardOpen} 
        onClose={closeSoundboard} 
      />

      {/* Settings & Backup Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={closeSettings} 
      />
    </div>
  );
}

export default App;
