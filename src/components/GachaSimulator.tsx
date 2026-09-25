import React, { useState, useMemo } from 'react';
import type { Character, Memory, Rarity } from '../types';
import { ElementBadge, RarityBadge } from './Badges';
import { 
  Sparkles, 
  Coins, 
  RotateCcw, 
  History, 
  Info, 
  X, 
  Check, 
  Layers, 
  PlusCircle, 
  Search,
  Award,
  Calculator
} from 'lucide-react';
import { GachaProbabilityMatrix } from './GachaProbabilityMatrix';
import { useJjkStore } from '../store/useJjkStore';
import { useTranslation, translateRole } from '../i18n';
import { 
  playClick, 
  playSelect, 
  playTabSwitch, 
  playCubeSummonChime, 
  playDomainExpansion, 
  playTransformSurge, 
  playSuccessFanfare,
  playStarToggle
} from '../utils/sound';
import { getAssetUrl } from '../utils/assets';

interface GachaSimulatorProps {
  characters: Character[];
  memories: Memory[];
  onSelectCharacter: (char: Character) => void;
}

export interface GachaItemResult {
  id: string;
  name: string;
  type: 'character' | 'memory';
  rarity: Rarity;
  image: string;
  element?: string;
  epithet?: string;
  isFeatured?: boolean;
  rawCharacter?: Character;
  rawMemory?: Memory;
}

export const GachaSimulator: React.FC<GachaSimulatorProps> = ({ 
  characters, 
  memories, 
  onSelectCharacter 
}) => {
  const { t, language } = useTranslation();
  const { 
    savingsPlan, 
    updateSavingsPlan, 
    ownedCharacterIds, 
    toggleOwnedCharacter,
    ownedMemoryIds,
    toggleOwnedMemory
  } = useJjkStore();

  // Sandbox or Real savings mode
  const [sandboxMode, setSandboxMode] = useState<boolean>(true);
  const [sandboxCubes, setSandboxCubes] = useState<number>(45000);

  // Sub-tab: Simulator or Probability Matrix
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'matrix'>('simulator');

  // Available pools by rarity
  const pool = useMemo(() => {
    return {
      ssrChars: characters.filter(c => c.rarity === 'SSR'),
      srChars: characters.filter(c => c.rarity === 'SR'),
      rChars: characters.filter(c => c.rarity === 'R'),
      ssrMems: memories.filter(m => m.rarity === 'SSR'),
      srMems: memories.filter(m => m.rarity === 'SR'),
      rMems: memories.filter(m => m.rarity === 'R'),
    };
  }, [characters, memories]);

  // Featured Character for Rate-Up Banner (defaults to Satoru Gojo SSR)
  const [featuredCharId, setFeaturedCharId] = useState<string>(() => {
    const gojo = characters.find(c => c.name.includes('Gojo') && c.rarity === 'SSR');
    return gojo?.id || pool.ssrChars[0]?.id || characters[0]?.id || '';
  });

  const featuredChar = useMemo(() => {
    return characters.find(c => c.id === featuredCharId) || pool.ssrChars[0] || characters[0];
  }, [characters, featuredCharId, pool.ssrChars]);

  // Pity counter (0 to 250)
  const [pityPoints, setPityPoints] = useState<number>(0);

  // Pull results state
  const [currentResults, setCurrentResults] = useState<GachaItemResult[]>([]);
  const [highestRarityInPull, setHighestRarityInPull] = useState<Rarity>('R');
  const [animationStep, setAnimationStep] = useState<'idle' | 'summoning' | 'revealed'>('idle');

  // Session Statistics & Pull History
  const [pullHistory, setPullHistory] = useState<GachaItemResult[]>([]);
  const [totalPullsCount, setTotalPullsCount] = useState<number>(0);
  const [totalCubesSpent, setTotalCubesSpent] = useState<number>(0);

  // Modals
  const [isRatesModalOpen, setIsRatesModalOpen] = useState<boolean>(false);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');

  // Calculate session SSR rate
  const ssrObtainedCount = useMemo(() => {
    return pullHistory.filter(i => i.rarity === 'SSR').length;
  }, [pullHistory]);

  const observedSsrRate = useMemo(() => {
    if (totalPullsCount === 0) return '0.0%';
    return `${((ssrObtainedCount / totalPullsCount) * 100).toFixed(1)}%`;
  }, [ssrObtainedCount, totalPullsCount]);

  // Current balance based on mode
  const currentBalance = sandboxMode ? sandboxCubes : savingsPlan.currentCubes;

  // Single pull generator (Official JJKPP rates: SSR Char 2.5%, SSR Mem 5.0%, SR Char 10%, SR Mem 20%, R Char 25%, R Mem 37.5%)
  const generateSinglePull = (isGuaranteedSrOrHigher = false): GachaItemResult => {
    const r = Math.random() * 100;

    if (isGuaranteedSrOrHigher) {
      // Slot 10 of a 10-pull: At least SR guaranteed!
      // In JJKPP: SSR 7.5% (Char 2.5%, Mem 5.0%), SR 92.5% (Char 30.8%, Mem 61.7%)
      const g = Math.random() * 100;
      if (g < 0.7 && featuredChar) {
        return {
          id: `${featuredChar.id}-${Date.now()}-${Math.random()}`,
          name: featuredChar.name,
          type: 'character',
          rarity: 'SSR',
          image: featuredChar.image,
          element: featuredChar.element,
          epithet: featuredChar.epithet,
          isFeatured: true,
          rawCharacter: featuredChar,
        };
      } else if (g < 2.5 && pool.ssrChars.length > 0) {
        const char = pool.ssrChars[Math.floor(Math.random() * pool.ssrChars.length)];
        return {
          id: `${char.id}-${Date.now()}-${Math.random()}`,
          name: char.name,
          type: 'character',
          rarity: 'SSR',
          image: char.image,
          element: char.element,
          epithet: char.epithet,
          isFeatured: char.id === featuredChar?.id,
          rawCharacter: char,
        };
      } else if (g < 7.5 && pool.ssrMems.length > 0) {
        const mem = pool.ssrMems[Math.floor(Math.random() * pool.ssrMems.length)];
        return {
          id: `${mem.id}-${Date.now()}-${Math.random()}`,
          name: mem.title,
          type: 'memory',
          rarity: 'SSR',
          image: mem.image,
          rawMemory: mem,
        };
      } else if (g < 37.5 && pool.srChars.length > 0) {
        const char = pool.srChars[Math.floor(Math.random() * pool.srChars.length)];
        return {
          id: `${char.id}-${Date.now()}-${Math.random()}`,
          name: char.name,
          type: 'character',
          rarity: 'SR',
          image: char.image,
          element: char.element,
          epithet: char.epithet,
          rawCharacter: char,
        };
      } else {
        const mem = pool.srMems[Math.floor(Math.random() * pool.srMems.length)] || pool.ssrMems[0];
        return {
          id: `${mem.id}-${Date.now()}-${Math.random()}`,
          name: mem.title,
          type: 'memory',
          rarity: 'SR',
          image: mem.image,
          rawMemory: mem,
        };
      }
    }

    // Standard Rates:
    // 0.0 - 0.7: Featured SSR Char
    if (r < 0.7 && featuredChar) {
      return {
        id: `${featuredChar.id}-${Date.now()}-${Math.random()}`,
        name: featuredChar.name,
        type: 'character',
        rarity: 'SSR',
        image: featuredChar.image,
        element: featuredChar.element,
        epithet: featuredChar.epithet,
        isFeatured: true,
        rawCharacter: featuredChar,
      };
    }
    // 0.7 - 2.5: Non-featured SSR Char
    if (r < 2.5 && pool.ssrChars.length > 0) {
      const char = pool.ssrChars[Math.floor(Math.random() * pool.ssrChars.length)];
      return {
        id: `${char.id}-${Date.now()}-${Math.random()}`,
        name: char.name,
        type: 'character',
        rarity: 'SSR',
        image: char.image,
        element: char.element,
        epithet: char.epithet,
        isFeatured: char.id === featuredChar?.id,
        rawCharacter: char,
      };
    }
    // 2.5 - 7.5: SSR Memory
    if (r < 7.5 && pool.ssrMems.length > 0) {
      const mem = pool.ssrMems[Math.floor(Math.random() * pool.ssrMems.length)];
      return {
        id: `${mem.id}-${Date.now()}-${Math.random()}`,
        name: mem.title,
        type: 'memory',
        rarity: 'SSR',
        image: mem.image,
        rawMemory: mem,
      };
    }
    // 7.5 - 17.5: SR Character
    if (r < 17.5 && pool.srChars.length > 0) {
      const char = pool.srChars[Math.floor(Math.random() * pool.srChars.length)];
      return {
        id: `${char.id}-${Date.now()}-${Math.random()}`,
        name: char.name,
        type: 'character',
        rarity: 'SR',
        image: char.image,
        element: char.element,
        epithet: char.epithet,
        rawCharacter: char,
      };
    }
    // 17.5 - 37.5: SR Memory
    if (r < 37.5 && pool.srMems.length > 0) {
      const mem = pool.srMems[Math.floor(Math.random() * pool.srMems.length)];
      return {
        id: `${mem.id}-${Date.now()}-${Math.random()}`,
        name: mem.title,
        type: 'memory',
        rarity: 'SR',
        image: mem.image,
        rawMemory: mem,
      };
    }
    // 37.5 - 62.5: R Character
    if (r < 62.5 && pool.rChars.length > 0) {
      const char = pool.rChars[Math.floor(Math.random() * pool.rChars.length)];
      return {
        id: `${char.id}-${Date.now()}-${Math.random()}`,
        name: char.name,
        type: 'character',
        rarity: 'R',
        image: char.image,
        element: char.element,
        epithet: char.epithet,
        rawCharacter: char,
      };
    }
    // 62.5 - 100.0: R Memory
    const mem = pool.rMems[Math.floor(Math.random() * pool.rMems.length)] || pool.srMems[0] || pool.ssrMems[0];
    return {
      id: `${mem.id}-${Date.now()}-${Math.random()}`,
      name: mem.title,
      type: 'memory',
      rarity: 'R',
      image: mem.image,
      rawMemory: mem,
    };
  };

  // Perform Pulls (1x or 10x)
  const handleSummon = (count: 1 | 10) => {
    const cost = count === 1 ? 300 : 3000;
    if (currentBalance < cost) {
      alert(t.gacha.notEnoughCubes);
      return;
    }

    // Deduct cubes
    if (sandboxMode) {
      setSandboxCubes(prev => prev - cost);
    } else {
      updateSavingsPlan({ currentCubes: savingsPlan.currentCubes - cost });
    }

    setTotalCubesSpent(prev => prev + cost);
    setTotalPullsCount(prev => prev + count);

    // Generate items
    const newItems: GachaItemResult[] = [];
    let hasSrOrHigher = false;

    for (let i = 0; i < count; i++) {
      const isSlot10 = count === 10 && i === 9 && !hasSrOrHigher;
      const item = generateSinglePull(isSlot10);
      if (item.rarity === 'SR' || item.rarity === 'SSR') {
        hasSrOrHigher = true;
      }
      newItems.push(item);
    }

    // Determine highest rarity for animation
    const hasSsr = newItems.some(i => i.rarity === 'SSR');
    const hasSr = newItems.some(i => i.rarity === 'SR');
    const topRarity: Rarity = hasSsr ? 'SSR' : hasSr ? 'SR' : 'R';
    setHighestRarityInPull(topRarity);

    // Update pity
    setPityPoints(prev => Math.min(250, prev + count));

    // Update history
    setPullHistory(prev => [...newItems, ...prev]);

    // Start Summoning Animation
    setCurrentResults(newItems);
    setAnimationStep('summoning');

    // Procedural sound
    playCubeSummonChime();

    // Auto reveal after animation
    const timer = setTimeout(() => {
      setAnimationStep('revealed');
      if (hasSsr) {
        playDomainExpansion();
        playSuccessFanfare();
      } else if (hasSr) {
        playTransformSurge();
      }
    }, 1800);

    return () => clearTimeout(timer);
  };

  // Skip animation immediately
  const handleSkipAnimation = () => {
    playSelect();
    setAnimationStep('revealed');
    if (highestRarityInPull === 'SSR') {
      playSuccessFanfare();
    }
  };

  // Claim pity exchange (250 pulls)
  const handleClaimPity = () => {
    if (pityPoints < 250 || !featuredChar) return;
    playDomainExpansion();
    playSuccessFanfare();

    const claimedItem: GachaItemResult = {
      id: `${featuredChar.id}-pity-${Date.now()}`,
      name: featuredChar.name,
      type: 'character',
      rarity: 'SSR',
      image: featuredChar.image,
      element: featuredChar.element,
      epithet: featuredChar.epithet,
      isFeatured: true,
      rawCharacter: featuredChar,
    };

    setCurrentResults([claimedItem]);
    setPullHistory(prev => [claimedItem, ...prev]);
    setPityPoints(0);
    setAnimationStep('revealed');
    alert(t.gacha.pityClaimed);
  };

  // Add quick cubes
  const handleAddQuickCubes = () => {
    playClick();
    if (sandboxMode) {
      setSandboxCubes(prev => prev + 30000);
    } else {
      updateSavingsPlan({ currentCubes: savingsPlan.currentCubes + 30000 });
    }
  };

  // Filtered SSR list for picker modal
  const filteredFeaturedCandidates = useMemo(() => {
    const q = pickerSearch.toLowerCase();
    return pool.ssrChars.filter(c => {
      return !q || c.name.toLowerCase().includes(q) || (c.epithet && c.epithet.toLowerCase().includes(q));
    });
  }, [pool.ssrChars, pickerSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-600/40 text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300">
              {t.gacha.title}
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {t.gacha.subtitle}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Currency Balance Badge */}
          <div className="flex items-center gap-2 bg-[#120d24] border border-purple-900/60 px-3.5 py-1.5 rounded-xl shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-semibold uppercase leading-tight">
                {sandboxMode ? t.gacha.unlimitedMode : t.gacha.realBalanceMode}
              </span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {currentBalance.toLocaleString('pt-BR')} Cubos
              </span>
            </div>
          </div>

          {/* Quick Add Cubes */}
          <button
            onClick={handleAddQuickCubes}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-950/60 border border-amber-500/50 text-amber-300 hover:bg-amber-900/60 hover:text-white transition-all cursor-pointer"
            title={t.gacha.addCubesQuick}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.gacha.addCubesQuick}</span>
          </button>

          {/* Mode Switcher */}
          <button
            onClick={() => {
              playTabSwitch();
              setSandboxMode(prev => !prev);
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#181133] border border-purple-900/60 text-purple-300 hover:text-white transition-all cursor-pointer"
          >
            {sandboxMode ? 'Modo Real' : 'Modo Sandbox'}
          </button>

          {/* Rates Info Button */}
          <button
            onClick={() => {
              playClick();
              setIsRatesModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-[#181133] border border-purple-900/60 text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <Info className="w-4 h-4 text-purple-400" />
            <span>{t.gacha.ratesModal}</span>
          </button>

          {/* Session History Button */}
          <button
            onClick={() => {
              playClick();
              setIsHistoryModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-[#181133] border border-purple-900/60 text-purple-300 hover:text-white transition-all cursor-pointer"
          >
            <History className="w-4 h-4" />
            <span>{t.gacha.summonHistory} ({pullHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation: Summon Simulator vs Probability Matrix */}
      <div className="flex items-center gap-2 border-b border-[#251b40] pb-3">
        <button
          onClick={() => {
            playTabSwitch();
            setActiveSubTab('simulator');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'simulator'
              ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/40 text-purple-200 border border-purple-500/60 shadow-lg shadow-purple-950/50'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#181133]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{t.probabilityMatrix.tabSimulator}</span>
        </button>

        <button
          onClick={() => {
            playTabSwitch();
            setActiveSubTab('matrix');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'bg-gradient-to-r from-purple-900/80 to-cyan-900/40 text-cyan-200 border border-cyan-500/60 shadow-lg shadow-cyan-950/50'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#181133]'
          }`}
        >
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span>{t.probabilityMatrix.tabMatrix}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
            Binomial
          </span>
        </button>
      </div>

      {activeSubTab === 'matrix' ? (
        <GachaProbabilityMatrix />
      ) : (
        <>
          {/* Main Banner Viewport or Summon Animation */}
          {animationStep === 'summoning' ? (
        /* Cinematic Summoning Animation Screen */
        <div className="relative min-h-[460px] rounded-3xl bg-gradient-to-b from-[#140b2b] via-[#090514] to-[#120a26] border-2 border-purple-500/60 p-8 flex flex-col items-center justify-center text-center overflow-hidden shadow-2xl">
          {/* Cursed Aura Lights */}
          <div 
            className={`absolute w-96 h-96 rounded-full blur-[100px] transition-all duration-700 animate-pulse pointer-events-none ${
              highestRarityInPull === 'SSR' 
                ? 'bg-gradient-to-r from-red-600 via-amber-500 to-purple-600 opacity-60' 
                : highestRarityInPull === 'SR'
                ? 'bg-purple-600/40 opacity-50'
                : 'bg-blue-600/30 opacity-40'
            }`}
          />

          {/* Spinning Cursed Energy Cube */}
          <div className="relative z-10 space-y-6 flex flex-col items-center">
            <div className="relative group">
              <div 
                className={`w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-4 flex items-center justify-center shadow-2xl animate-spin transition-all duration-1000 ${
                  highestRarityInPull === 'SSR'
                    ? 'border-amber-400 bg-gradient-to-tr from-amber-600 via-purple-700 to-red-600 shadow-[0_0_50px_rgba(245,158,11,0.8)]'
                    : highestRarityInPull === 'SR'
                    ? 'border-purple-400 bg-gradient-to-tr from-purple-800 to-indigo-900 shadow-[0_0_30px_rgba(168,85,247,0.6)]'
                    : 'border-blue-400 bg-gradient-to-tr from-blue-900 to-indigo-950 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                }`}
                style={{ animationDuration: '3s' }}
              >
                <Sparkles className="w-16 h-16 text-white animate-bounce" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase">
                {language === 'pt' ? 'INVOCANDO TÉCNICA AMALDIÇOADA...' : 'SUMMONING CURSED TECHNIQUE...'}
              </h2>
              <p className="text-xs text-purple-300">
                {highestRarityInPull === 'SSR' ? '⚡ RESSONÂNCIA DE ENERGIA MÁXIMA DETECTADA!' : 'Canalizando fluxo de energia...'}
              </p>
            </div>

            {/* Skip Button */}
            <button
              onClick={handleSkipAnimation}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer"
            >
              {t.gacha.skipAnimation} ⏩
            </button>
          </div>
        </div>
      ) : animationStep === 'revealed' && currentResults.length > 0 ? (
        /* Results Screen Grid */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#120d24] border border-[#271d44] rounded-2xl p-5">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {t.gacha.congratulations}
              </span>
              <h2 className="text-xl font-black text-white">
                {currentResults.length === 1 ? 'Resultado da Invocação 1x' : 'Resultados da Invocação 10x'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSummon(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-900/60 hover:bg-purple-800 border border-purple-600/50 text-white transition-all cursor-pointer"
              >
                {t.gacha.summonAgain1x} (300)
              </button>
              <button
                onClick={() => handleSummon(10)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/50 transition-all cursor-pointer"
              >
                {t.gacha.summonAgain10x} (3.000)
              </button>
              <button
                onClick={() => {
                  playClick();
                  setAnimationStep('idle');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a1236] border border-purple-900/50 text-gray-300 hover:text-white transition-all cursor-pointer"
              >
                {language === 'pt' ? 'Voltar ao Banner' : 'Back to Banner'}
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className={`grid gap-4 ${
            currentResults.length === 1 
              ? 'grid-cols-1 max-w-sm mx-auto' 
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
          }`}>
            {currentResults.map((item) => {
              const isOwned = item.type === 'character' 
                ? (item.rawCharacter ? ownedCharacterIds.includes(item.rawCharacter.id) : false)
                : (item.rawMemory ? ownedMemoryIds.includes(item.rawMemory.id) : false);

              const handleToggleCollection = (e: React.MouseEvent) => {
                e.stopPropagation();
                playStarToggle(!isOwned);
                if (item.type === 'character' && item.rawCharacter) {
                  toggleOwnedCharacter(item.rawCharacter.id);
                } else if (item.type === 'memory' && item.rawMemory) {
                  toggleOwnedMemory(item.rawMemory.id);
                }
              };

              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    if (item.rawCharacter) {
                      onSelectCharacter(item.rawCharacter);
                    }
                  }}
                  className={`relative group bg-[#110a24] rounded-2xl p-3 border-2 transition-all duration-300 hover:-translate-y-1.5 shadow-xl flex flex-col justify-between cursor-pointer ${
                    item.rarity === 'SSR' 
                      ? 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.35)] bg-gradient-to-b from-[#221338] to-[#120a22]' 
                      : item.rarity === 'SR'
                      ? 'border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                      : 'border-blue-950/80 hover:border-blue-500/40'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <RarityBadge rarity={item.rarity} className="text-[10px] px-2 py-0.5" />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.type === 'character' 
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40' 
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                    }`}>
                      {item.type === 'character' ? t.gacha.character : t.gacha.memory}
                    </span>
                  </div>

                  {/* Artwork Thumbnail */}
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#070412] border border-purple-900/40 mb-2 relative">
                    <img 
                      src={getAssetUrl(item.image)} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.isFeatured && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white shadow-md">
                        RATE-UP!
                      </span>
                    )}
                  </div>

                  {/* Name & Epithet */}
                  <div className="space-y-1 text-center">
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {item.name}
                    </h4>
                    {item.epithet && (
                      <p className="text-[10px] text-purple-300/80 line-clamp-1 italic">
                        {item.epithet}
                      </p>
                    )}
                  </div>

                  {/* Collection Toggle Action */}
                  <div className="mt-2.5 pt-2 border-t border-[#1d1436] flex items-center justify-between">
                    <button
                      onClick={handleToggleCollection}
                      className={`w-full py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                        isOwned 
                          ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300' 
                          : 'bg-[#1b1236] hover:bg-purple-800/40 border border-purple-800/40 text-gray-300 hover:text-white'
                      }`}
                    >
                      {isOwned ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{t.gacha.inCollection}</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3 h-3 text-purple-400" />
                          <span>{t.gacha.addToCollection}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Banner Card Display */
        <div className="relative rounded-3xl bg-gradient-to-r from-[#170e30] via-[#100824] to-[#1a0f36] border-2 border-purple-500/40 p-6 sm:p-8 shadow-2xl overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left: Featured Character Artwork & Epithet */}
            <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
              <div className="relative group">
                <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-3xl overflow-hidden border-4 border-amber-400/80 bg-[#090514] shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                  <img 
                    src={getAssetUrl(featuredChar.image)} 
                    alt={featuredChar.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute -bottom-3 -right-3">
                  <RarityBadge rarity={featuredChar.rarity} className="text-sm px-3 py-1 shadow-lg" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <ElementBadge element={featuredChar.element} />
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white tracking-wider uppercase">
                    0.7% RATE-UP
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {featuredChar.name}
                </h2>
                {featuredChar.epithet && (
                  <p className="text-sm text-purple-300 font-medium italic">
                    {featuredChar.epithet}
                  </p>
                )}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-gray-400">
                  <span>{translateRole(featuredChar.role, language)}</span>
                  <span>•</span>
                  <span>{featuredChar.affiliation || 'Jujutsu High'}</span>
                </div>
              </div>

              {/* Change Featured Button */}
              <button
                onClick={() => {
                  playClick();
                  setIsPickerModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a1236] hover:bg-purple-900/50 border border-purple-800/60 text-purple-200 transition-all cursor-pointer shadow-md"
              >
                {t.gacha.changeFeatured}
              </button>
            </div>

            {/* Right: Summon Actions & Pity System */}
            <div className="lg:col-span-7 space-y-6">
              {/* Pity Progress Widget */}
              <div className="bg-[#120d24]/90 border border-[#2b1f4c] rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span className="text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Pity de Resgate Garantido</span>
                  </span>
                  <span className="text-amber-300 font-mono">
                    {pityPoints} / 250
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-[#080512] rounded-full overflow-hidden border border-purple-950 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 via-amber-500 to-yellow-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: `${Math.min(100, (pityPoints / 250) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {pityPoints >= 250 
                      ? '🎉 Pity alcançado! Você pode resgatar o feiticeiro agora.' 
                      : `Faltam ${250 - pityPoints} invocações para o resgate direto.`}
                  </span>
                  {pityPoints >= 250 && (
                    <button
                      onClick={handleClaimPity}
                      className="px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:scale-105 transition-transform cursor-pointer shadow-lg"
                    >
                      {t.gacha.pityClaim}
                    </button>
                  )}
                </div>
              </div>

              {/* Official Rates Quick Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-gray-300 font-medium">
                <div className="bg-[#140e29] border border-purple-900/40 p-2.5 rounded-xl text-center">
                  <span className="text-amber-300 font-bold block">2.5% SSR Feiticeiro</span>
                  <span className="text-[10px] text-gray-400">(0.7% Destaque)</span>
                </div>
                <div className="bg-[#140e29] border border-purple-900/40 p-2.5 rounded-xl text-center">
                  <span className="text-amber-300 font-bold block">5.0% SSR Memória</span>
                  <span className="text-[10px] text-gray-400">Pool Geral</span>
                </div>
                <div className="bg-[#140e29] border border-purple-900/40 p-2.5 rounded-xl text-center">
                  <span className="text-purple-300 font-bold block">10.0% SR Feiticeiro</span>
                  <span className="text-[10px] text-gray-400">20.0% Memória</span>
                </div>
              </div>

              {/* Big Summon Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* 1x Summon */}
                <button
                  onClick={() => handleSummon(1)}
                  className="group bg-gradient-to-b from-[#1f153a] to-[#120a26] hover:from-purple-800 hover:to-indigo-900 border-2 border-purple-500/50 hover:border-purple-400 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col items-center text-center space-y-1.5"
                >
                  <span className="text-xs uppercase font-extrabold tracking-widest text-purple-300 group-hover:text-white">
                    {t.gacha.singleSummon}
                  </span>
                  <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold text-lg">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span>300 Cubos</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    1 item aleatório
                  </span>
                </button>

                {/* 10x Summon */}
                <button
                  onClick={() => handleSummon(10)}
                  className="group bg-gradient-to-b from-purple-700 via-purple-600 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 border-2 border-purple-400 rounded-2xl p-5 shadow-2xl shadow-purple-900/60 transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col items-center text-center space-y-1.5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-amber-400 text-black font-black text-[9px] px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    SR+ GARANTIDO
                  </div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-white">
                    {t.gacha.multiSummon}
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-mono font-bold text-lg">
                    <Coins className="w-5 h-5 text-yellow-300" />
                    <span>3.000 Cubos</span>
                  </div>
                  <span className="text-[10px] text-purple-200">
                    10 itens • Garantia de SR ou superior
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Analytics Dashboard */}
      <div className="bg-[#120d24] border border-[#271d44] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#201838] pb-3">
          <h3 className="text-base font-black text-purple-200 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Estatísticas da Sessão Atual</span>
          </h3>
          {pullHistory.length > 0 && (
            <button
              onClick={() => {
                playClick();
                setPullHistory([]);
                setTotalPullsCount(0);
                setTotalCubesSpent(0);
              }}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.gacha.clearHistory}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0b0819] border border-purple-900/40 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">{t.gacha.statsTotalPulls}</span>
            <p className="font-mono font-extrabold text-base text-white">{totalPullsCount}</p>
          </div>
          <div className="bg-[#0b0819] border border-purple-900/40 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">{t.gacha.statsCubesSpent}</span>
            <p className="font-mono font-extrabold text-base text-amber-300">{totalCubesSpent.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-[#0b0819] border border-purple-900/40 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">{t.gacha.statsSsrTotal}</span>
            <p className="font-mono font-extrabold text-base text-emerald-400">{ssrObtainedCount}</p>
          </div>
          <div className="bg-[#0b0819] border border-purple-900/40 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">{t.gacha.statsRealRate}</span>
            <p className="font-mono font-extrabold text-base text-purple-300">{observedSsrRate}</p>
          </div>
        </div>
      </div>
    </>
  )}

    {/* Official Rates Modal */}
      {isRatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120c24] border-2 border-purple-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#251b40] pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-purple-400" />
                <span>{t.gacha.officialRatesTitle}</span>
              </h3>
              <button
                onClick={() => setIsRatesModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm text-gray-300">
              <div className="flex justify-between py-1.5 border-b border-[#1f1737]">
                <span className="text-amber-300 font-bold">{t.gacha.ssrCharacterRate}</span>
                <span className="font-mono font-bold text-white">2.5%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1f1737]">
                <span className="text-amber-300 font-bold">{t.gacha.ssrMemoryRate}</span>
                <span className="font-mono font-bold text-white">5.0%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1f1737]">
                <span className="text-purple-300 font-semibold">{t.gacha.srCharacterRate}</span>
                <span className="font-mono font-bold text-white">10.0%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1f1737]">
                <span className="text-purple-300 font-semibold">{t.gacha.srMemoryRate}</span>
                <span className="font-mono font-bold text-white">20.0%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1f1737]">
                <span className="text-blue-300">{t.gacha.rCharacterRate}</span>
                <span className="font-mono font-bold text-white">25.0%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1f1737]">
                <span className="text-blue-300">{t.gacha.rMemoryRate}</span>
                <span className="font-mono font-bold text-white">37.5%</span>
              </div>
            </div>

            <div className="bg-[#0b0717] p-3.5 rounded-xl border border-purple-900/40 text-xs text-purple-200/90 leading-relaxed">
              ⭐ {t.gacha.tenPullGuarantee}
              <br />
              🎯 <strong>Sistema de Pity Oficial:</strong> 250 invocações (75.000 Cubos) concedem 100% de garantia na troca direta do Feiticeiro em Destaque.
            </div>
          </div>
        </div>
      )}

      {/* Featured Character Picker Modal */}
      {isPickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120c24] border-2 border-purple-500/50 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-[#251b40] flex items-center justify-between">
              <h3 className="text-lg font-black text-white">
                {t.gacha.selectFeaturedTitle}
              </h3>
              <button
                onClick={() => setIsPickerModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-[#251b40] bg-[#0c0819]">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Filtrar feiticeiro SSR por nome ou epíteto..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#17102e] border border-purple-900/60 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredFeaturedCandidates.map((char) => (
                <button
                  key={char.id}
                  onClick={() => {
                    playSelect();
                    setFeaturedCharId(char.id);
                    setIsPickerModalOpen(false);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-xl border transition-all text-left cursor-pointer group ${
                    char.id === featuredCharId 
                      ? 'bg-purple-900/50 border-purple-400' 
                      : 'bg-[#150f2a] border-purple-950 hover:border-purple-500 hover:bg-[#1f153a]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#070412] border border-purple-800/40 shrink-0">
                    <img 
                      src={getAssetUrl(char.image)} 
                      alt={char.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <RarityBadge rarity={char.rarity} className="text-[9px] px-1.5 py-0" />
                      <span className="text-[10px] text-gray-400 truncate">{char.element}</span>
                    </div>
                    <div className="text-sm font-bold text-white truncate">
                      {char.name}
                    </div>
                    {char.epithet && (
                      <div className="text-[10px] text-purple-300/80 truncate italic">
                        {char.epithet}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pull History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120c24] border-2 border-purple-500/50 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-[#251b40] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  {t.gacha.summonHistory}
                </h3>
                <p className="text-xs text-gray-400">
                  {pullHistory.length} itens invocados nesta sessão
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {pullHistory.length === 0 ? (
                <p className="text-center py-10 text-gray-500 text-sm">
                  Nenhuma invocação realizada nesta sessão ainda.
                </p>
              ) : (
                pullHistory.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#16102d] border border-purple-950 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#070412] shrink-0 border border-purple-900/50">
                        <img src={getAssetUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[10px] text-gray-400">
                          {item.type === 'character' ? t.gacha.character : t.gacha.memory}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.isFeatured && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white">
                          RATE-UP
                        </span>
                      )}
                      <RarityBadge rarity={item.rarity} className="text-[9px] px-2 py-0.5" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
