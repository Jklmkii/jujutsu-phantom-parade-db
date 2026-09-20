import React, { useState, useMemo } from 'react';
import type { Character } from '../types';
import { ElementBadge, RarityBadge } from './Badges';
import { 
  ArrowLeftRight, 
  Shuffle, 
  Search, 
  Swords, 
  Shield, 
  Sparkles, 
  Zap, 
  Heart, 
  ExternalLink,
  X,
  Scale
} from 'lucide-react';
import { useTranslation, translateRole, translateFocus } from '../i18n';
import { 
  playClick, 
  playSelect, 
  playTabSwitch, 
  playLevelUp, 
  playElementalTone 
} from '../utils/sound';
import { getAssetUrl, getSkillIconUrl } from '../utils/assets';
import { StatRadarChart } from './StatRadarChart';

interface CharacterCompareProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
}

// Elemental advantage calculation: Blue > Red > Green > Blue. Yellow is neutral.
function getElementalAdvantage(elemA: string, elemB: string): 'advantage' | 'disadvantage' | 'neutral' {
  const normalize = (el: string) => {
    const s = el.toLowerCase();
    if (s.includes('blue') || s.includes('幻') || s.includes('azul')) return 'blue';
    if (s.includes('red') || s.includes('夜') || s.includes('vermelho')) return 'red';
    if (s.includes('green') || s.includes('影') || s.includes('verde')) return 'green';
    if (s.includes('yellow') || s.includes('行') || s.includes('amarelo')) return 'yellow';
    return 'other';
  };
  const a = normalize(elemA);
  const b = normalize(elemB);
  if (a === b || a === 'yellow' || b === 'yellow' || a === 'other' || b === 'other') {
    return 'neutral';
  }
  if (
    (a === 'blue' && b === 'red') ||
    (a === 'red' && b === 'green') ||
    (a === 'green' && b === 'blue')
  ) {
    return 'advantage';
  }
  return 'disadvantage';
}

function parseStatNumber(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/[^\d]/g, '');
  return parseInt(clean, 10) || 0;
}

function formatNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}

// Format skill scaling text between Lv 1 and Lv 10
function formatSkillDesc(desc1?: string, desc10?: string, level: 1 | 10 = 10): string {
  if (level === 10 && desc10) return desc10;
  if (level === 1 && desc1) return desc1;
  const text = desc10 || desc1 || '';
  if (!text) return '';
  if (level === 1) {
    return text.replace(/(\d+(?:\.\d+)?%?)\s*\(Lv 1\)\s*→\s*(\d+(?:\.\d+)?%?)\s*\(Lv 10\)/g, '$1');
  } else {
    return text.replace(/(\d+(?:\.\d+)?%?)\s*\(Lv 1\)\s*→\s*(\d+(?:\.\d+)?%?)\s*\(Lv 10\)/g, '$2');
  }
}

export const CharacterCompare: React.FC<CharacterCompareProps> = ({ 
  characters, 
  onSelectCharacter 
}) => {
  const { t, language } = useTranslation();

  // Find default characters (e.g. Satoru Gojo and Yuji Itadori, or first two SSRs)
  const defaultA = useMemo(() => {
    return (
      characters.find(c => c.name.includes('Gojo') && c.rarity === 'SSR') ||
      characters.find(c => c.rarity === 'SSR') ||
      characters[0]
    );
  }, [characters]);

  const defaultB = useMemo(() => {
    return (
      characters.find(c => c.name.includes('Itadori') && c.rarity === 'SSR') ||
      characters.find(c => c.rarity === 'SSR' && c.id !== defaultA?.id) ||
      characters[1] ||
      characters[0]
    );
  }, [characters, defaultA]);

  const [charAId, setCharAId] = useState<string>(defaultA?.id || '');
  const [charBId, setCharBId] = useState<string>(defaultB?.id || '');
  const [skillLevel, setSkillLevel] = useState<1 | 10>(10);

  // Picker modal state
  const [modalSlot, setModalSlot] = useState<'A' | 'B' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterElement, setFilterElement] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');

  const charA = useMemo(() => characters.find(c => c.id === charAId) || defaultA, [characters, charAId, defaultA]);
  const charB = useMemo(() => characters.find(c => c.id === charBId) || defaultB, [characters, charBId, defaultB]);

  // Swapper
  const handleSwap = () => {
    playTabSwitch();
    const temp = charAId;
    setCharAId(charBId);
    setCharBId(temp);
  };

  // Randomizer
  const handleRandom = () => {
    playSelect();
    if (characters.length < 2) return;
    const idxA = Math.floor(Math.random() * characters.length);
    let idxB = Math.floor(Math.random() * characters.length);
    while (idxB === idxA) {
      idxB = Math.floor(Math.random() * characters.length);
    }
    setCharAId(characters[idxA].id);
    setCharBId(characters[idxB].id);
  };

  // Open modal
  const openPicker = (slot: 'A' | 'B') => {
    playClick();
    setModalSlot(slot);
    setSearchQuery('');
    setFilterElement('all');
    setFilterRarity('all');
  };

  const handleSelectSlotChar = (char: Character) => {
    playSelect();
    if (char.element) {
      playElementalTone(char.element);
    }
    if (modalSlot === 'A') {
      setCharAId(char.id);
    } else if (modalSlot === 'B') {
      setCharBId(char.id);
    }
    setModalSlot(null);
  };

  // Filtered list for picker modal
  const filteredChars = useMemo(() => {
    return characters.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        c.name.toLowerCase().includes(q) || 
        (c.epithet && c.epithet.toLowerCase().includes(q)) ||
        (c.card_name && c.card_name.toLowerCase().includes(q));
      
      const matchesElement = filterElement === 'all' || c.element.toLowerCase().includes(filterElement.toLowerCase());
      const matchesRarity = filterRarity === 'all' || c.rarity === filterRarity;

      return matchesSearch && matchesElement && matchesRarity;
    });
  }, [characters, searchQuery, filterElement, filterRarity]);

  // Stat computations
  const statsA = useMemo(() => {
    if (!charA) return { hp: 0, taijutsu: 0, jujutsu: 0, initialEnergy: 0, maxEnergy: 0, specialGauge: 0, total: 0 };
    const hp = parseStatNumber(charA.stats?.hp);
    const taijutsu = parseStatNumber(charA.stats?.attack);
    const jujutsu = parseStatNumber(charA.stats?.jujutsu);
    const initialEnergy = parseStatNumber(charA.stats?.initial_energy);
    const maxEnergy = parseStatNumber(charA.stats?.max_energy);
    const specialGauge = parseStatNumber(charA.stats?.special_gauge);
    const total = Math.round(hp / 3) + taijutsu + jujutsu;
    return { hp, taijutsu, jujutsu, initialEnergy, maxEnergy, specialGauge, total };
  }, [charA]);

  const statsB = useMemo(() => {
    if (!charB) return { hp: 0, taijutsu: 0, jujutsu: 0, initialEnergy: 0, maxEnergy: 0, specialGauge: 0, total: 0 };
    const hp = parseStatNumber(charB.stats?.hp);
    const taijutsu = parseStatNumber(charB.stats?.attack);
    const jujutsu = parseStatNumber(charB.stats?.jujutsu);
    const initialEnergy = parseStatNumber(charB.stats?.initial_energy);
    const maxEnergy = parseStatNumber(charB.stats?.max_energy);
    const specialGauge = parseStatNumber(charB.stats?.special_gauge);
    const total = Math.round(hp / 3) + taijutsu + jujutsu;
    return { hp, taijutsu, jujutsu, initialEnergy, maxEnergy, specialGauge, total };
  }, [charB]);

  // Elemental matchup
  const matchup = useMemo(() => {
    if (!charA || !charB) return 'neutral';
    return getElementalAdvantage(charA.element, charB.element);
  }, [charA, charB]);

  // Render comparative stat bar
  const renderStatBar = (
    label: string, 
    valA: number, 
    valB: number, 
    isLowerBetter = false, 
    suffix = ''
  ) => {
    const maxVal = Math.max(valA, valB, 1);
    const diff = Math.abs(valA - valB);
    const pctDiff = valB > 0 ? Math.round((diff / Math.min(valA, valB)) * 100) : 0;

    const aWins = isLowerBetter ? valA < valB : valA > valB;
    const bWins = isLowerBetter ? valB < valA : valB > valA;
    const isTie = valA === valB;

    const widthA = Math.round((valA / maxVal) * 100);
    const widthB = Math.round((valB / maxVal) * 100);

    return (
      <div className="bg-[#120d24] border border-[#261c42] rounded-xl p-4 space-y-2.5 hover:border-purple-500/40 transition-colors">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-300">
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${aWins ? 'text-emerald-400 font-extrabold text-base' : 'text-gray-300'}`}>
              {formatNumber(valA)}{suffix}
            </span>
            {aWins && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                +{formatNumber(diff)} ({pctDiff}%)
              </span>
            )}
          </div>

          <span className="text-purple-300 font-bold tracking-wider uppercase text-xs px-2 py-0.5 rounded bg-[#1a1334] border border-purple-900/50">
            {label}
          </span>

          <div className="flex items-center gap-2">
            {bWins && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-950/80 border border-emerald-500/60 text-emerald-300">
                +{formatNumber(diff)} ({pctDiff}%)
              </span>
            )}
            <span className={`font-mono font-bold ${bWins ? 'text-emerald-400 font-extrabold text-base' : 'text-gray-300'}`}>
              {formatNumber(valB)}{suffix}
            </span>
          </div>
        </div>

        {/* Dual Progress Bars */}
        <div className="grid grid-cols-2 gap-2">
          {/* Side A Bar (right-aligned) */}
          <div className="h-2.5 bg-[#090614] rounded-full overflow-hidden flex justify-end border border-purple-950">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                aWins 
                  ? 'bg-gradient-to-l from-emerald-400 to-teal-600 shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
                  : isTie
                  ? 'bg-purple-600'
                  : 'bg-purple-900/60'
              }`}
              style={{ width: `${widthA}%` }}
            />
          </div>

          {/* Side B Bar (left-aligned) */}
          <div className="h-2.5 bg-[#090614] rounded-full overflow-hidden flex justify-start border border-purple-950">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                bWins 
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-600 shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
                  : isTie
                  ? 'bg-purple-600'
                  : 'bg-purple-900/60'
              }`}
              style={{ width: `${widthB}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-600/40 text-purple-400">
              <Scale className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300">
              {t.compare.title}
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {t.compare.subtitle}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Level Switcher */}
          <div className="flex items-center bg-[#130f24] p-1 rounded-xl border border-[#2c224c]">
            <button
              onClick={() => {
                playLevelUp();
                setSkillLevel(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                skillLevel === 1 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.compare.levelToggle1}
            </button>
            <button
              onClick={() => {
                playLevelUp();
                setSkillLevel(10);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                skillLevel === 10 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.compare.levelToggle10}
            </button>
          </div>

          {/* Swap Sides Button */}
          <button
            onClick={handleSwap}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#17112c] border border-purple-900/60 text-purple-300 hover:text-white hover:border-purple-500 transition-all cursor-pointer"
            title={t.compare.swapPositions}
          >
            <ArrowLeftRight className="w-4 h-4 text-purple-400" />
            <span>{t.compare.swapPositions}</span>
          </button>

          {/* Randomizer Button */}
          <button
            onClick={handleRandom}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#17112c] border border-purple-900/60 text-amber-300 hover:text-white hover:border-amber-500 transition-all cursor-pointer"
            title={t.compare.randomPicker}
          >
            <Shuffle className="w-4 h-4 text-amber-400" />
            <span>{t.compare.randomPicker}</span>
          </button>
        </div>
      </div>

      {/* Main Comparison Column / Cards */}
      {charA && charB ? (
        <div className="space-y-8">
          {/* Hero Headers: Side-by-Side Character Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Slot A Card */}
            <div className="bg-gradient-to-b from-[#181133] to-[#0f0a21] border-2 border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Character Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-purple-500/60 bg-[#0a0718] shadow-lg">
                    <img 
                      src={getAssetUrl(charA.image)} 
                      alt={charA.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    <RarityBadge rarity={charA.rarity} />
                  </div>
                </div>

                {/* Info & Pick Button */}
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-between gap-2">
                    <ElementBadge element={charA.element} />
                    <span className="text-[11px] text-gray-400 font-medium px-2 py-0.5 rounded bg-black/40 border border-purple-950">
                      {charA.affiliation || 'Jujutsu High'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white leading-tight">
                    {charA.name}
                  </h3>
                  {charA.epithet && (
                    <p className="text-xs text-purple-300/90 italic">
                      {charA.epithet}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/70 border border-purple-800/40 text-purple-200">
                      {translateRole(charA.role, language)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/70 border border-indigo-800/40 text-indigo-200">
                      {translateFocus(charA.focus, language)}
                    </span>
                    {charA.sp && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-600/50 text-amber-300">
                        SP
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                    <button
                      onClick={() => openPicker('A')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md"
                    >
                      {t.compare.changeCharacter}
                    </button>
                    <button
                      onClick={() => onSelectCharacter(charA)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1236] hover:bg-purple-900/40 text-gray-300 hover:text-white border border-purple-900/50 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{language === 'pt' ? 'Ver Ficha' : 'View Profile'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* VS Badge in Center */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-[#1e153b] border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] items-center justify-center font-black text-sm text-white tracking-widest pointer-events-none">
              VS
            </div>

            {/* Slot B Card */}
            <div className="bg-gradient-to-b from-[#181133] to-[#0f0a21] border-2 border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Character Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-purple-500/60 bg-[#0a0718] shadow-lg">
                    <img 
                      src={getAssetUrl(charB.image)} 
                      alt={charB.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    <RarityBadge rarity={charB.rarity} />
                  </div>
                </div>

                {/* Info & Pick Button */}
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex items-center justify-center sm:justify-between gap-2">
                    <ElementBadge element={charB.element} />
                    <span className="text-[11px] text-gray-400 font-medium px-2 py-0.5 rounded bg-black/40 border border-purple-950">
                      {charB.affiliation || 'Jujutsu High'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white leading-tight">
                    {charB.name}
                  </h3>
                  {charB.epithet && (
                    <p className="text-xs text-purple-300/90 italic">
                      {charB.epithet}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950/70 border border-purple-800/40 text-purple-200">
                      {translateRole(charB.role, language)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/70 border border-indigo-800/40 text-indigo-200">
                      {translateFocus(charB.focus, language)}
                    </span>
                    {charB.sp && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 border border-amber-600/50 text-amber-300">
                        SP
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                    <button
                      onClick={() => openPicker('B')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md"
                    >
                      {t.compare.changeCharacter}
                    </button>
                    <button
                      onClick={() => onSelectCharacter(charB)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1236] hover:bg-purple-900/40 text-gray-300 hover:text-white border border-purple-900/50 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{language === 'pt' ? 'Ver Ficha' : 'View Profile'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Elemental Matchup Banner */}
          <div className="bg-[#120d24] border border-[#271d44] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  {language === 'pt' ? 'AFINIDADE ELEMENTAL DO CONFRONTO' : 'ELEMENTAL MATCHUP AFFINITY'}
                </span>
                <p className="text-sm font-semibold text-white">
                  {charA.element} vs {charB.element}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {matchup === 'advantage' && (
                <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-950/90 border border-emerald-500 text-emerald-300 shadow-sm">
                  ⚔️ {charA.name} {t.compare.elementalAdvantage} (+50% Dano)
                </span>
              )}
              {matchup === 'disadvantage' && (
                <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-950/90 border border-emerald-500 text-emerald-300 shadow-sm">
                  ⚔️ {charB.name} {t.compare.elementalAdvantage} (+50% Dano)
                </span>
              )}
              {matchup === 'neutral' && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#1a1334] border border-purple-900/60 text-gray-300">
                  ⚖️ {t.compare.elementalNeutral} (Sem Bônus de Vantagem)
                </span>
              )}
            </div>
          </div>

          {/* Stat Comparison Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#251b40] pb-2">
              <h2 className="text-lg font-bold text-purple-200 flex items-center gap-2">
                <Heart className="w-5 h-5 text-purple-400" />
                <span>{t.compare.baseStats}</span>
              </h2>
              <span className="text-xs text-gray-400">
                {language === 'pt' ? 'Radar Pentagonal & Barras Proporcionais' : 'Pentagonal Radar & Proportional Bars'}
              </span>
            </div>

            {/* Radar Comparison Chart */}
            <div className="flex justify-center py-2">
              <StatRadarChart characterA={charA} characterB={charB} size={330} language={language} showLegend={true} />
            </div>

            <div className="space-y-3">
              {renderStatBar(t.compare.hp, statsA.hp, statsB.hp)}
              {renderStatBar(t.compare.taijutsu, statsA.taijutsu, statsB.taijutsu)}
              {renderStatBar(t.compare.jujutsu, statsA.jujutsu, statsB.jujutsu)}
              {renderStatBar(t.compare.totalPower, statsA.total, statsB.total)}
              {renderStatBar(t.compare.initialEnergy, statsA.initialEnergy, statsB.initialEnergy, false, ' CE')}
              {renderStatBar(t.compare.maxEnergy, statsA.maxEnergy, statsB.maxEnergy, false, ' CE')}
              {renderStatBar(t.compare.specialGauge, statsA.specialGauge, statsB.specialGauge, true)}
            </div>
          </div>

          {/* Skill Comparison Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#251b40] pb-2">
              <h2 className="text-lg font-bold text-purple-200 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <span>{t.compare.skillsComparison} ({skillLevel === 1 ? 'Lv. 1' : 'Lv. 10'})</span>
              </h2>
            </div>

            {/* Skill Comparison Rows */}
            <div className="space-y-4">
              {/* Row 1: Normal Attack */}
              <div className="bg-[#120d24] border border-[#271d44] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="text-center font-bold text-xs uppercase tracking-wider text-purple-300 border-b border-[#201838] pb-2">
                  {t.compare.normalAttack}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Skill A */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0718] border border-purple-500/40 shrink-0 flex items-center justify-center">
                        <img 
                          src={getSkillIconUrl(charA.normal_attack?.icon || charA.normal_attack?.image_key)} 
                          alt={charA.normal_attack?.name || 'Skill 1'} 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{charA.normal_attack?.name || 'Ataque Básico'}</h4>
                        <span className="text-[11px] text-purple-400 font-mono">0 CE</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0818] p-3 rounded-lg border border-[#1f1738] whitespace-pre-line">
                      {formatSkillDesc(charA.normal_attack?.description, charA.normal_attack?.description_10, skillLevel)}
                    </p>
                  </div>

                  {/* Skill B */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0718] border border-purple-500/40 shrink-0 flex items-center justify-center">
                        <img 
                          src={getSkillIconUrl(charB.normal_attack?.icon || charB.normal_attack?.image_key)} 
                          alt={charB.normal_attack?.name || 'Skill 1'} 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{charB.normal_attack?.name || 'Ataque Básico'}</h4>
                        <span className="text-[11px] text-purple-400 font-mono">0 CE</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0818] p-3 rounded-lg border border-[#1f1738] whitespace-pre-line">
                      {formatSkillDesc(charB.normal_attack?.description, charB.normal_attack?.description_10, skillLevel)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Skill 2 */}
              <div className="bg-[#120d24] border border-[#271d44] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="text-center font-bold text-xs uppercase tracking-wider text-purple-300 border-b border-[#201838] pb-2">
                  {t.compare.skill2}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Skill A */}
                  {(() => {
                    const sk = charA.skills?.[0];
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0718] border border-purple-500/40 shrink-0 flex items-center justify-center">
                            <img 
                              src={getSkillIconUrl(sk?.icon || sk?.image_key)} 
                              alt={sk?.name || 'Skill 2'} 
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{sk?.name || 'Skill 2'}</h4>
                            <span className="text-[11px] text-purple-400 font-mono">{sk?.cost || '0'} CE</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0818] p-3 rounded-lg border border-[#1f1738] whitespace-pre-line">
                          {formatSkillDesc(sk?.description, sk?.description_10, skillLevel)}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Skill B */}
                  {(() => {
                    const sk = charB.skills?.[0];
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0718] border border-purple-500/40 shrink-0 flex items-center justify-center">
                            <img 
                              src={getSkillIconUrl(sk?.icon || sk?.image_key)} 
                              alt={sk?.name || 'Skill 2'} 
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{sk?.name || 'Skill 2'}</h4>
                            <span className="text-[11px] text-purple-400 font-mono">{sk?.cost || '0'} CE</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0818] p-3 rounded-lg border border-[#1f1738] whitespace-pre-line">
                          {formatSkillDesc(sk?.description, sk?.description_10, skillLevel)}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Row 3: Skill 3 */}
              <div className="bg-[#120d24] border border-[#271d44] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="text-center font-bold text-xs uppercase tracking-wider text-purple-300 border-b border-[#201838] pb-2">
                  {t.compare.skill3}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Skill A */}
                  {(() => {
                    const sk = charA.skills?.[1];
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0718] border border-purple-500/40 shrink-0 flex items-center justify-center">
                            <img 
                              src={getSkillIconUrl(sk?.icon || sk?.image_key)} 
                              alt={sk?.name || 'Skill 3'} 
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{sk?.name || 'Skill 3'}</h4>
                            <span className="text-[11px] text-purple-400 font-mono">{sk?.cost || '0'} CE</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0818] p-3 rounded-lg border border-[#1f1738] whitespace-pre-line">
                          {formatSkillDesc(sk?.description, sk?.description_10, skillLevel)}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Skill B */}
                  {(() => {
                    const sk = charB.skills?.[1];
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0718] border border-purple-500/40 shrink-0 flex items-center justify-center">
                            <img 
                              src={getSkillIconUrl(sk?.icon || sk?.image_key)} 
                              alt={sk?.name || 'Skill 3'} 
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{sk?.name || 'Skill 3'}</h4>
                            <span className="text-[11px] text-purple-400 font-mono">{sk?.cost || '0'} CE</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0818] p-3 rounded-lg border border-[#1f1738] whitespace-pre-line">
                          {formatSkillDesc(sk?.description, sk?.description_10, skillLevel)}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Row 4: Ultimate Skill */}
              <div className="bg-[#120d24] border-2 border-amber-500/30 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="text-center font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5 border-b border-[#251b40] pb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t.compare.ultimate}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ult A */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0a0718] border-2 border-amber-500/50 shrink-0 flex items-center justify-center">
                        <img 
                          src={getSkillIconUrl(charA.ultimate?.icon || charA.ultimate?.image_key)} 
                          alt={charA.ultimate?.name || 'Ultimate'} 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-white">{charA.ultimate?.name || 'Técnica Suprema'}</h4>
                        <span className="text-[11px] text-amber-300 font-mono">Gauge: {charA.stats?.special_gauge || '1000'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0818] p-3 rounded-lg border border-[#1f1738] whitespace-pre-line">
                      {formatSkillDesc(charA.ultimate?.description, charA.ultimate?.description_10, skillLevel)}
                    </p>
                  </div>

                  {/* Ult B */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0a0718] border-2 border-amber-500/50 shrink-0 flex items-center justify-center">
                        <img 
                          src={getSkillIconUrl(charB.ultimate?.icon || charB.ultimate?.image_key)} 
                          alt={charB.ultimate?.name || 'Ultimate'} 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-white">{charB.ultimate?.name || 'Técnica Suprema'}</h4>
                        <span className="text-[11px] text-amber-300 font-mono">Gauge: {charB.stats?.special_gauge || '1000'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#0b0818] p-3 rounded-lg border border-[#1f1738] whitespace-pre-line">
                      {formatSkillDesc(charB.ultimate?.description, charB.ultimate?.description_10, skillLevel)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Verdict Summary Box */}
          <div className="bg-gradient-to-r from-[#170e30] via-[#130b24] to-[#170e30] border-2 border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-purple-200 uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span>{t.compare.tacticalVerdict}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Taijutsu Winner */}
              <div className="bg-[#0b0819] border border-purple-900/40 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  {language === 'pt' ? '💥 Maior Dano Físico (Taijutsu)' : '💥 Highest Physical ATK'}
                </span>
                <p className="font-extrabold text-sm text-red-400">
                  {statsA.taijutsu > statsB.taijutsu ? charA.name : statsB.taijutsu > statsA.taijutsu ? charB.name : 'Empate'}
                </p>
              </div>

              {/* Jujutsu Winner */}
              <div className="bg-[#0b0819] border border-purple-900/40 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  {language === 'pt' ? '🔮 Maior Dano Mágico (Jujutsu)' : '🔮 Highest Cursed ATK'}
                </span>
                <p className="font-extrabold text-sm text-blue-400">
                  {statsA.jujutsu > statsB.jujutsu ? charA.name : statsB.jujutsu > statsA.jujutsu ? charB.name : 'Empate'}
                </p>
              </div>

              {/* HP Winner */}
              <div className="bg-[#0b0819] border border-purple-900/40 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  {language === 'pt' ? '🛡️ Maior Sobrevivência (HP)' : '🛡️ Highest Durability (HP)'}
                </span>
                <p className="font-extrabold text-sm text-emerald-400">
                  {statsA.hp > statsB.hp ? charA.name : statsB.hp > statsA.hp ? charB.name : 'Empate'}
                </p>
              </div>

              {/* Faster Ultimate Gauge */}
              <div className="bg-[#0b0819] border border-purple-900/40 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">
                  {language === 'pt' ? '⚡ Suprema Mais Veloz' : '⚡ Faster Ultimate Gauge'}
                </span>
                <p className="font-extrabold text-sm text-amber-400">
                  {statsA.specialGauge < statsB.specialGauge ? charA.name : statsB.specialGauge < statsA.specialGauge ? charB.name : 'Empate'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 bg-[#120d24] border border-[#271d44] rounded-2xl">
          <p className="text-base font-semibold">{t.compare.selectToCompare}</p>
        </div>
      )}

      {/* Character Selection Modal */}
      {modalSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120c24] border-2 border-purple-500/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#251b40] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  {modalSlot === 'A' ? t.compare.selectCharacterA : t.compare.selectCharacterB}
                </h3>
                <p className="text-xs text-gray-400">
                  {language === 'pt' ? 'Escolha um feiticeiro da base offline' : 'Select a sorcerer from the offline database'}
                </p>
              </div>
              <button
                onClick={() => setModalSlot(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 border-b border-[#251b40] space-y-3 bg-[#0d081c]">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.compare.searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#17102e] border border-purple-900/60 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Element Filter */}
                <select
                  value={filterElement}
                  onChange={(e) => setFilterElement(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#17102e] border border-purple-900/60 text-xs text-gray-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">{t.compare.allElements}</option>
                  <option value="Blue">Blue (蒼/幻)</option>
                  <option value="Red">Red (夜/幻)</option>
                  <option value="Green">Green (夜/影)</option>
                  <option value="Yellow">Yellow (行)</option>
                </select>

                {/* Rarity Filter */}
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[#17102e] border border-purple-900/60 text-xs text-gray-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">{t.compare.allRarities}</option>
                  <option value="SSR">SSR</option>
                  <option value="SR">SR</option>
                  <option value="R">R</option>
                </select>

                <span className="text-xs text-gray-500 ml-auto">
                  {filteredChars.length} {language === 'pt' ? 'feiticeiros' : 'sorcerers'}
                </span>
              </div>
            </div>

            {/* Character Scrollable Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredChars.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleSelectSlotChar(char)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#16102d] border border-purple-950 hover:border-purple-500 hover:bg-[#201540] transition-all text-left cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0a0718] border border-purple-800/40 shrink-0">
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
    </div>
  );
};
