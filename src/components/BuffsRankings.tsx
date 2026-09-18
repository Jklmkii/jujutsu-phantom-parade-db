import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Search, 
  Target, 
  Layers, 
  ExternalLink,
  Filter
} from 'lucide-react';
import type { Character, BuffItem } from '../types';
import buffsRawData from '../data/buffs.json';
import { getAssetPath } from '../utils/assets';
import { useTranslation } from '../i18n';
import { playClick, playSelect } from '../utils/sound';

interface BuffsRankingsProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
}

type BuffCategory = 'buff' | 'debuff' | 'dmgUp';

export const BuffsRankings: React.FC<BuffsRankingsProps> = ({
  characters,
  onSelectCharacter
}) => {
  const { language } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<BuffCategory>('buff');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<string>('all');
  const [selectedStat, setSelectedStat] = useState<string>('all');
  const [selectedTarget, setSelectedTarget] = useState<string>('all');

  // Map of local characters by ID
  const charMap = useMemo(() => {
    const map = new Map<string, Character>();
    characters.forEach(c => map.set(c.id, c));
    return map;
  }, [characters]);

  // Current category data
  const currentList: BuffItem[] = useMemo(() => {
    if (activeCategory === 'buff') return buffsRawData.buff as BuffItem[];
    if (activeCategory === 'debuff') return buffsRawData.debuff as BuffItem[];
    return buffsRawData.dmgUp as BuffItem[];
  }, [activeCategory]);

  // Filtered list
  const filteredList = useMemo(() => {
    return currentList.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchNotes = item.notes.toLowerCase().includes(q);
        const matchBuff = item.buff.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchNotes && !matchBuff) return false;
      }

      // Element
      if (selectedElement !== 'all' && item.element.toLowerCase() !== selectedElement.toLowerCase()) {
        return false;
      }

      // Stat Type
      if (selectedStat !== 'all') {
        if (!item.statType || item.statType.toLowerCase() !== selectedStat.toLowerCase()) {
          return false;
        }
      }

      // Target
      if (selectedTarget !== 'all') {
        const itemTarget = (item.target || '').toLowerCase();
        if (selectedTarget === 'aoe' && !itemTarget.includes('aoe') && !itemTarget.includes('both')) return false;
        if (selectedTarget === 'st' && !itemTarget.includes('st') && !itemTarget.includes('both')) return false;
      }

      return true;
    });
  }, [currentList, searchQuery, selectedElement, selectedStat, selectedTarget]);

  const handleCardClick = (item: BuffItem) => {
    playSelect();
    const localChar = charMap.get(item.characterId);
    if (localChar) {
      onSelectCharacter(localChar);
    }
  };

  const getElementBadgeColor = (elem: string) => {
    switch (elem?.toLowerCase()) {
      case 'blue': return 'bg-blue-950/80 text-blue-400 border-blue-800/60';
      case 'red': return 'bg-red-950/80 text-red-400 border-red-800/60';
      case 'green': return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
      case 'yellow': return 'bg-amber-950/80 text-amber-400 border-amber-800/60';
      default: return 'bg-purple-950/80 text-purple-400 border-purple-800/60';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'SSR': return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'SR': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#140e28] via-[#1b1238] to-[#120a24] border border-purple-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                JJKPPDB Official Rankings
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Meta Analytics
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Zap className="w-8 h-8 text-amber-400 fill-amber-400/20" />
              {language === 'pt' ? 'Rankings de Buffs & Debuffs' : 'Buffs & Debuffs Rankings'}
            </h1>
            <p className="text-gray-400 text-sm mt-1 max-w-2xl">
              {language === 'pt'
                ? 'Tabelas analíticas dos maiores amplificadores de dano, quebras de defesa e acumuladores de atributos (Max Stacks) para otimização máxima de DPS em combates de alto nível.'
                : 'Analytical rankings of top damage boosters, defense breaks and attribute multipliers (Max Stacks) for DPS optimization in high-level combat.'}
            </p>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-3 bg-[#0c0916]/80 border border-[#201833] rounded-xl px-4 py-3">
            <div className="text-right">
              <div className="text-2xl font-black text-purple-300">{filteredList.length}</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                {language === 'pt' ? 'Feiticeiros Listados' : 'Listed Sorcerers'}
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-purple-900/30">
          <button
            onClick={() => {
              playClick();
              setActiveCategory('buff');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeCategory === 'buff'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30 ring-2 ring-emerald-400/50'
                : 'bg-[#1a1233] text-gray-400 hover:text-white hover:bg-[#231945]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {language === 'pt' ? 'Stat Buffs (+Taijutsu / +Jujutsu)' : 'Stat Buffs (+Taijutsu / +Jujutsu)'}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/30">
              {buffsRawData.buff.length}
            </span>
          </button>

          <button
            onClick={() => {
              playClick();
              setActiveCategory('debuff');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeCategory === 'debuff'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-900/30 ring-2 ring-rose-400/50'
                : 'bg-[#1a1233] text-gray-400 hover:text-white hover:bg-[#231945]'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            {language === 'pt' ? 'Stat Debuffs (-Defesa / -Atributos)' : 'Stat Debuffs (-Defense / -Stats)'}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/30">
              {buffsRawData.debuff.length}
            </span>
          </button>

          <button
            onClick={() => {
              playClick();
              setActiveCategory('dmgUp');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeCategory === 'dmgUp'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30 ring-2 ring-purple-400/50'
                : 'bg-[#1a1233] text-gray-400 hover:text-white hover:bg-[#231945]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {language === 'pt' ? 'Damage Up (Aumento Direto de Dano)' : 'Damage Up (Direct Damage Increase)'}
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-black/30">
              {buffsRawData.dmgUp.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#120d24] border border-[#231a40] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'pt' ? 'Buscar por nome, habilidade ou efeito...' : 'Search by name, skill or effect...'}
            className="w-full pl-9 pr-3 py-2 bg-[#0c0916] border border-[#2a1e4d] rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Element Filter */}
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            {language === 'pt' ? 'Elemento:' : 'Element:'}
          </div>
          {['all', 'Blue', 'Red', 'Green', 'Yellow'].map(el => (
            <button
              key={el}
              onClick={() => {
                playClick();
                setSelectedElement(el);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedElement === el
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-[#191233] text-gray-400 hover:text-gray-200 hover:bg-[#211842]'
              }`}
            >
              {el === 'all' ? (language === 'pt' ? 'Todos' : 'All') : el}
            </button>
          ))}

          {/* Stat Filter */}
          {activeCategory !== 'dmgUp' && (
            <>
              <div className="h-4 w-px bg-gray-700 mx-1"></div>
              {['all', 'Taijutsu', 'Jujutsu', 'Both'].map(st => (
                <button
                  key={st}
                  onClick={() => {
                    playClick();
                    setSelectedStat(st);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedStat === st
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#191233] text-gray-400 hover:text-gray-200 hover:bg-[#211842]'
                  }`}
                >
                  {st === 'all' ? (language === 'pt' ? 'Todos Stats' : 'All Stats') : st}
                </button>
              ))}
            </>
          )}

          {/* Target Filter */}
          <div className="h-4 w-px bg-gray-700 mx-1"></div>
          {['all', 'aoe', 'st'].map(tg => (
            <button
              key={tg}
              onClick={() => {
                playClick();
                setSelectedTarget(tg);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTarget === tg
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-[#191233] text-gray-400 hover:text-gray-200 hover:bg-[#211842]'
              }`}
            >
              {tg === 'all' ? (language === 'pt' ? 'Todos Alvos' : 'All Targets') : tg.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredList.map((item, idx) => {
          const localChar = charMap.get(item.characterId);
          const thumbUrl = localChar
            ? getAssetPath(`assets/static_thumbs/${localChar.id}.webp`)
            : getAssetPath(`assets/${item.image}`);

          return (
            <div
              key={item.id || idx}
              onClick={() => handleCardClick(item)}
              className="bg-gradient-to-b from-[#130e26] to-[#0c0819] border border-[#231a40] hover:border-purple-500/60 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/30 group cursor-pointer relative overflow-hidden flex flex-col justify-between"
            >
              {/* Background Ambient Glow on Hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 group-hover:bg-purple-600/15 rounded-full blur-2xl transition-all pointer-events-none"></div>

              <div>
                {/* Card Top: Rank Number & Badges */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#1c1438] border border-[#30235b] text-purple-300 text-xs font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${getRarityBadgeColor(item.rarity)}`}>
                      {item.rarity}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getElementBadgeColor(item.element)}`}>
                      {item.element}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#1b1536] text-purple-300 border border-purple-900/40 flex items-center gap-1">
                      <Target className="w-3 h-3 text-purple-400" />
                      {item.target}
                    </span>
                    {item.statType && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#14232c] text-teal-300 border border-teal-900/40">
                        {item.statType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Character Profile Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#090712] border-2 border-[#2b1f4c] group-hover:border-purple-400 transition-colors shrink-0 shadow-md relative">
                    <img
                      src={thumbUrl}
                      alt={item.title}
                      className="w-full h-full object-cover object-top transform group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to direct image
                        (e.target as HTMLImageElement).src = getAssetPath(`assets/${item.image}`);
                      }}
                    />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-white font-bold text-base leading-snug group-hover:text-purple-300 transition-colors truncate">
                      {item.name}
                    </div>
                    <div className="text-gray-400 text-xs truncate mt-0.5" title={item.title}>
                      {item.title}
                    </div>
                  </div>
                </div>

                {/* Buff Metrics Highlight Box */}
                <div className="bg-[#0b0817] border border-[#20173b] rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      {language === 'pt' ? 'Efeito Base:' : 'Base Effect:'}
                    </span>
                    <span className="text-xs font-bold text-gray-300">
                      {item.buff}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-[#1e1538]">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      {language === 'pt' ? 'Stack Máximo:' : 'Max Stack:'}
                    </span>
                    <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                      {item.maxStack}
                    </span>
                  </div>
                </div>

                {/* Notes / Activation Breakdown */}
                {item.notes && (
                  <div className="text-xs text-gray-400 bg-[#120d24]/60 border border-[#20183b] rounded-lg p-2.5 leading-relaxed">
                    <span className="font-semibold text-gray-300 block mb-0.5">
                      {language === 'pt' ? 'Detalhe de Ativação:' : 'Activation Details:'}
                    </span>
                    {item.notes}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-[#1b1433] flex items-center justify-between text-[11px] text-gray-500 group-hover:text-purple-300 transition-colors">
                <span>{language === 'pt' ? 'Clique para abrir ficha técnica' : 'Click to view full profile'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredList.length === 0 && (
        <div className="text-center py-16 bg-[#100b22] border border-[#221740] rounded-2xl">
          <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <div className="text-lg font-bold text-gray-300">
            {language === 'pt' ? 'Nenhum feiticeiro encontrado' : 'No sorcerers found'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {language === 'pt'
              ? 'Tente ajustar o termo de pesquisa ou redefinir os filtros selecionados.'
              : 'Try adjusting your search query or reset selected filters.'}
          </div>
        </div>
      )}
    </div>
  );
};
