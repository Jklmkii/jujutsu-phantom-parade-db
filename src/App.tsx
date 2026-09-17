import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { CharactersList } from './components/CharactersList';
import { CharacterDetail } from './components/CharacterDetail';
import { MemoriesList } from './components/MemoriesList';
import { TimelineView } from './components/TimelineView';
import { TierlistMaker } from './components/TierlistMaker';
import { BestTeams } from './components/BestTeams';
import { TacticalScratchpad } from './components/TacticalScratchpad';
import { SettingsModal } from './components/SettingsModal';
import { useJjkStore } from './store/useJjkStore';

import charactersData from './data/characters.json';
import memoriesData from './data/memories.json';
import timelineData from './data/timeline.json';

import type { ActiveTab, Character, Memory, TimelineEvent } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [charactersSearch, setCharactersSearch] = useState<string>('');

  const { isSettingsOpen, toggleSettings } = useJjkStore();
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
        {selectedCharacter ? (
          <CharacterDetail
            key={selectedCharacter.id}
            character={selectedCharacter}
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

            {(activeTab === 'releases' || activeTab === 'timeline') && (
              <TimelineView 
                events={timeline}
              />
            )}
          </>
        )}
      </main>

      {/* Tactical Floating Scratchpad */}
      <TacticalScratchpad />

      {/* Settings & Backup Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={toggleSettings} 
      />
    </div>
  );
}

export default App;
