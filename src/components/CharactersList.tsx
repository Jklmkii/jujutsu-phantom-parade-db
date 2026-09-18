import React, { useState, useMemo } from 'react';
import type { Character } from '../types';
import { ElementBadge, RarityBadge } from './Badges';
import { Search, Filter, X, Star, ChevronDown, ChevronUp, RotateCcw, Check } from 'lucide-react';
import { useJjkStore } from '../store/useJjkStore';
import { playClick } from '../utils/sound';
import { getAssetUrl } from '../utils/assets';

interface CharactersListProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
  initialSearch?: string;
}

// 24 official tags from JJKPPDB
const ALL_TAGS = [
  'Counter',
  'Taunt',
  'Stat Debuffer',
  'Stat Buffer',
  'DMG Buffer',
  'DMG Debuffer',
  'Domain',
  'Black Flash',
  'Crit Buffer',
  'Crit RES Down',
  'Break Buffer',
  'Break Debuffer',
  'Revival',
  'ULT Charge',
  'DoT',
  'Stun',
  'ATK Down',
  'Energy Recovery',
  'Crit DMG Up',
  'Heal',
  'BF Rate Up',
  'DMG Reduction',
  'ULT Count Down',
  'DMG Dealt Down',
];

export const CharactersList: React.FC<CharactersListProps> = ({ 
  characters, 
  onSelectCharacter,
  initialSearch = ""
}) => {
  const { isFavoriteChar, isCharacterOwned, toggleOwnedCharacter, ownedCharacterIds } = useJjkStore();
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Collection Filter: 'ALL' | 'OWNED' | 'NOT_OWNED'
  const [collectionFilter, setCollectionFilter] = useState<'ALL' | 'OWNED' | 'NOT_OWNED'>('ALL');

  // Filters State
  const [selectedElement, setSelectedElement] = useState<string>('ALL');
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL');
  const [selectedFocus, setSelectedFocus] = useState<string>('ALL');
  
  // Special: SP & Limited
  const [filterSP, setFilterSP] = useState<boolean>(false);
  const [filterLimited, setFilterLimited] = useState<boolean>(false);

  // Standard Pool: 'ALL' | 'IN_POOL' | 'WAITING' | 'NOT_IN_POOL'
  const [poolFilter, setPoolFilter] = useState<'ALL' | 'IN_POOL' | 'WAITING' | 'NOT_IN_POOL'>('ALL');

  // Tags: Multi-select
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsExpanded, setIsTagsExpanded] = useState<boolean>(false);

  // Favorites
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  // Toggle Tag in Multi-select
  const toggleTag = (tag: string) => {
    playClick();
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      // 1. Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = char.name.toLowerCase().includes(q) ||
          char.title.toLowerCase().includes(q) ||
          char.epithet.toLowerCase().includes(q);
        const matchesTag = char.tags && char.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesTag) return false;
      }

      // 2. Element filter
      if (selectedElement !== 'ALL') {
        if (!char.element.toLowerCase().includes(selectedElement.toLowerCase())) {
          return false;
        }
      }

      // 3. Rarity filter
      if (selectedRarity !== 'ALL') {
        if (char.rarity !== selectedRarity) return false;
      }

      // 4. Focus (Damage Type) filter
      if (selectedFocus !== 'ALL') {
        if (!char.focus || !char.focus.toLowerCase().includes(selectedFocus.toLowerCase())) {
          return false;
        }
      }

      // 5. Special: SP
      if (filterSP && !char.sp) {
        return false;
      }

      // 6. Special: Limited
      if (filterLimited && !char.limited) {
        return false;
      }

      // 7. Standard Pool
      if (poolFilter === 'IN_POOL' && !char.in_pool) {
        return false;
      }
      if (poolFilter === 'WAITING' && char.pool_status !== 'waiting') {
        return false;
      }
      if (poolFilter === 'NOT_IN_POOL' && char.in_pool) {
        return false;
      }

      // 8. Tags filter (must match all selected tags)
      if (selectedTags.length > 0) {
        const charTags = char.tags || [];
        const hasAllTags = selectedTags.every(t => charTags.includes(t));
        if (!hasAllTags) return false;
      }

      // 9. Favorites filter
      if (onlyFavorites && !isFavoriteChar(char.id)) {
        return false;
      }

      // 10. Collection filter (Minha Coleção)
      if (collectionFilter === 'OWNED' && !isCharacterOwned(char.id)) {
        return false;
      }
      if (collectionFilter === 'NOT_OWNED' && isCharacterOwned(char.id)) {
        return false;
      }

      return true;
    });
  }, [characters, searchTerm, selectedElement, selectedRarity, selectedFocus, filterSP, filterLimited, poolFilter, selectedTags, onlyFavorites, isFavoriteChar, collectionFilter, isCharacterOwned]);

  const resetFilters = () => {
    playClick();
    setSearchTerm('');
    setSelectedElement('ALL');
    setSelectedRarity('ALL');
    setSelectedFocus('ALL');
    setFilterSP(false);
    setFilterLimited(false);
    setPoolFilter('ALL');
    setSelectedTags([]);
    setOnlyFavorites(false);
    setCollectionFilter('ALL');
  };

  const hasActiveFilters = searchTerm || 
    selectedElement !== 'ALL' || 
    selectedRarity !== 'ALL' || 
    selectedFocus !== 'ALL' || 
    filterSP || 
    filterLimited || 
    poolFilter !== 'ALL' || 
    selectedTags.length > 0 || 
    onlyFavorites ||
    collectionFilter !== 'ALL';

  const visibleTags = isTagsExpanded ? ALL_TAGS : ALL_TAGS.slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight">
            CATÁLOGO DE PERSONAGENS
          </h1>
          <p className="text-sm text-gray-400">
            Fichas completas com estatísticas, habilidades escaláveis, variantes de SP e tags de combate.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Buscar por nome, epíteto ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#120e24] border border-[#2d2250] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Filters Panel Left (1/4), Grid Right (3/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filter Panel (JJKPPDB Design) */}
        <div className="space-y-5 bg-[#0e0a1d] border border-[#261942] rounded-2xl p-4 sm:p-5 h-fit shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#201538] pb-3">
            <span className="text-sm font-black tracking-wider text-purple-300 flex items-center gap-1.5 uppercase">
              <Filter className="w-4 h-4 text-purple-400" />
              FILTERS
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-gray-400">
                {filteredCharacters.length} / {characters.length}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  title="Resetar todos os filtros"
                  className="p-1 rounded-md text-gray-400 hover:text-purple-300 hover:bg-[#1a1233] transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 1. Element Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 block tracking-wide">
              Element
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'Blue', label: '幻', name: 'Blue', border: 'border-blue-500/40 text-blue-400 bg-blue-950/20 hover:border-blue-400', active: 'bg-blue-600/30 border-blue-400 text-blue-200 ring-2 ring-blue-500/50 shadow-md shadow-blue-500/20' },
                { id: 'Red', label: '夜', name: 'Red', border: 'border-red-500/40 text-red-400 bg-red-950/20 hover:border-red-400', active: 'bg-red-600/30 border-red-400 text-red-200 ring-2 ring-red-500/50 shadow-md shadow-red-500/20' },
                { id: 'Green', label: '影', name: 'Green', border: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:border-emerald-400', active: 'bg-emerald-600/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/20' },
                { id: 'Yellow', label: '行', name: 'Yellow', border: 'border-amber-500/40 text-amber-400 bg-amber-950/20 hover:border-amber-400', active: 'bg-amber-600/30 border-amber-400 text-amber-200 ring-2 ring-amber-500/50 shadow-md shadow-amber-500/20' },
              ].map((el) => {
                const isSelected = selectedElement === el.id;
                return (
                  <button
                    key={el.id}
                    onClick={() => {
                      playClick();
                      setSelectedElement(isSelected ? 'ALL' : el.id);
                    }}
                    title={el.name}
                    className={`h-11 rounded-xl flex items-center justify-center font-serif text-lg font-black border transition-all cursor-pointer ${
                      isSelected ? el.active : `${el.border} opacity-80 hover:opacity-100`
                    }`}
                  >
                    {el.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Rarity Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 block tracking-wide">
              Rarity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'SSR', label: 'SSR', active: 'bg-gradient-to-r from-purple-900/60 to-pink-900/60 border-purple-400 text-white ring-2 ring-purple-500/40 shadow-md shadow-purple-500/20' },
                { id: 'SR', label: 'SR', active: 'bg-amber-950/60 border-amber-400 text-amber-200 ring-2 ring-amber-500/40 shadow-md shadow-amber-500/20' },
                { id: 'R', label: 'R', active: 'bg-slate-800/80 border-slate-300 text-white ring-2 ring-slate-400/40 shadow-md' },
              ].map((r) => {
                const isSelected = selectedRarity === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      playClick();
                      setSelectedRarity(isSelected ? 'ALL' : r.id);
                    }}
                    className={`py-2 rounded-xl text-xs font-black tracking-wider border transition-all cursor-pointer ${
                      isSelected
                        ? r.active
                        : 'bg-[#140f29] border-[#291e4a] text-gray-400 hover:text-white hover:border-purple-500/40'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Damage Type (Focus) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 block tracking-wide">
              Damage Type
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {['Taijutsu', 'Jujutsu', 'Hybrid'].map((f) => {
                const isSelected = selectedFocus === f;
                return (
                  <button
                    key={f}
                    onClick={() => {
                      playClick();
                      setSelectedFocus(isSelected ? 'ALL' : f);
                    }}
                    className={`py-1.5 rounded-full text-xs font-bold border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/40 border-purple-400 text-white ring-1 ring-purple-400 shadow-sm'
                        : 'bg-[#140f29] border-[#251b40] text-gray-400 hover:text-white hover:border-purple-500/40'
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Special: SP & Limited */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 block tracking-wide">
              Special
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  playClick();
                  setFilterSP(!filterSP);
                }}
                className={`py-1.5 rounded-full text-xs font-black border transition-all cursor-pointer ${
                  filterSP
                    ? 'bg-amber-950/70 border-amber-400 text-amber-300 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                    : 'bg-[#140f29] border-amber-900/30 text-amber-400/70 hover:border-amber-500/50'
                }`}
              >
                SP
              </button>
              <button
                onClick={() => {
                  playClick();
                  setFilterLimited(!filterLimited);
                }}
                className={`py-1.5 rounded-full text-xs font-black border transition-all cursor-pointer ${
                  filterLimited
                    ? 'bg-red-950/70 border-red-400 text-red-300 ring-2 ring-red-500/40 shadow-sm shadow-red-500/20'
                    : 'bg-[#140f29] border-red-900/30 text-red-400/70 hover:border-red-500/50'
                }`}
              >
                Limited
              </button>
            </div>
          </div>

          {/* 5. Standard Pool */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 block tracking-wide">
                Standard Pool
              </label>
              {poolFilter !== 'ALL' && (
                <span className="text-[10px] font-mono text-purple-300">
                  {poolFilter === 'IN_POOL' ? '72 no pool' : poolFilter === 'WAITING' ? '16 aguardando' : '37 fora'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  playClick();
                  setPoolFilter(poolFilter === 'IN_POOL' ? 'ALL' : 'IN_POOL');
                }}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  poolFilter === 'IN_POOL'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#140f29] border-[#251b40] text-gray-400 hover:text-white hover:border-cyan-500/40'
                }`}
                title="Personagens que já entraram oficialmente na rotação permanente do banner padrão"
              >
                In Pool
              </button>
              <button
                onClick={() => {
                  playClick();
                  setPoolFilter(poolFilter === 'WAITING' ? 'ALL' : 'WAITING');
                }}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  poolFilter === 'WAITING'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 ring-2 ring-amber-500/40 shadow-sm shadow-amber-500/20'
                    : 'bg-[#140f29] border-[#251b40] text-gray-400 hover:text-white hover:border-amber-500/40'
                }`}
                title="Banner padrão mas que ainda não entraram no pool permanente (Kenjaku, Kusakabe, Megumi Coelho, etc.)"
              >
                Aguardando
              </button>
              <button
                onClick={() => {
                  playClick();
                  setPoolFilter(poolFilter === 'NOT_IN_POOL' ? 'ALL' : 'NOT_IN_POOL');
                }}
                className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  poolFilter === 'NOT_IN_POOL'
                    ? 'bg-pink-950/80 border-pink-400 text-pink-300 ring-2 ring-pink-500/40 shadow-sm shadow-pink-500/20'
                    : 'bg-[#140f29] border-[#251b40] text-gray-400 hover:text-white hover:border-pink-500/40'
                }`}
                title="Todos os personagens que atualmente não estão no pool permanente (Aguardando + Limitados)"
              >
                Fora Pool
              </button>
            </div>
          </div>

          {/* 6. Tags (Multi-select) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 block tracking-wide">
                Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
              </label>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                >
                  Limpar tags
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {visibleTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/50 border-purple-400 text-purple-200 ring-1 ring-purple-400 shadow-sm'
                        : 'bg-[#140f29] border-[#251b40] text-gray-400 hover:text-white hover:border-purple-500/40'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Show more / Show less toggle */}
            <button
              onClick={() => setIsTagsExpanded(!isTagsExpanded)}
              className="w-full pt-1.5 flex items-center justify-center gap-1 text-[11px] font-bold text-gray-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              <span>{isTagsExpanded ? 'Show less' : 'Show more'}</span>
              {isTagsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* 7. Special Toggles: Favorites */}
          <div className="pt-2 border-t border-[#201538] space-y-2">
            <button
              onClick={() => {
                playClick();
                setOnlyFavorites(!onlyFavorites);
              }}
              className={`w-full py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                onlyFavorites
                  ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-md shadow-amber-950/50'
                  : 'bg-[#140f29] border-[#251b40] text-gray-400 hover:text-white hover:border-amber-500/40'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{onlyFavorites ? '✓ Apenas Favoritos' : 'Filtrar Favoritos'}</span>
            </button>
          </div>

          {/* 8. Collection Filter: Minha Coleção */}
          <div className="pt-2 border-t border-[#201538] space-y-2">
            <label className="text-xs font-bold text-gray-400 block tracking-wide">
              Minha Coleção ({ownedCharacterIds.length}/{characters.length})
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  playClick();
                  setCollectionFilter('ALL');
                }}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  collectionFilter === 'ALL'
                    ? 'bg-purple-600/40 border-purple-400 text-white ring-1 ring-purple-400 shadow-sm'
                    : 'bg-[#140f29] border-[#251b40] text-gray-400 hover:text-white hover:border-purple-500/40'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => {
                  playClick();
                  setCollectionFilter(collectionFilter === 'OWNED' ? 'ALL' : 'OWNED');
                }}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  collectionFilter === 'OWNED'
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-[#140f29] border-[#251b40] text-gray-400 hover:text-white hover:border-emerald-500/40'
                }`}
              >
                ✓ Tenho
              </button>
              <button
                onClick={() => {
                  playClick();
                  setCollectionFilter(collectionFilter === 'NOT_OWNED' ? 'ALL' : 'NOT_OWNED');
                }}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  collectionFilter === 'NOT_OWNED'
                    ? 'bg-rose-950/80 border-rose-400 text-rose-300 ring-2 ring-rose-500/40 shadow-sm shadow-rose-500/20'
                    : 'bg-[#140f29] border-[#251b40] text-gray-400 hover:text-white hover:border-rose-500/40'
                }`}
              >
                ✗ Faltam
              </button>
            </div>
          </div>

          <div className="pt-1 space-y-2">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full py-2 text-xs font-bold text-purple-400 hover:text-purple-300 underline text-center cursor-pointer block"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        </div>

        {/* Right Character Grid */}
        <div className="lg:col-span-3">
          {filteredCharacters.length === 0 ? (
            <div className="bg-[#120e24] border border-[#251b40] rounded-2xl p-12 text-center space-y-3">
              <p className="text-gray-400 text-base">
                Nenhum personagem encontrado para os filtros selecionados.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors cursor-pointer"
              >
                Resetar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filteredCharacters.map((char) => {
                const imgUrl = getAssetUrl(char.image);
                const isSSR = char.rarity === 'SSR';
                const isSR = char.rarity === 'SR';

                const borderClass = isSSR
                  ? 'border-amber-500/60 hover:border-yellow-400 shadow-sm shadow-amber-950/40 hover:shadow-yellow-500/30'
                  : isSR
                  ? 'border-sky-500/50 hover:border-sky-300 shadow-sm shadow-sky-950/30'
                  : 'border-slate-700 hover:border-slate-500';

                return (
                  <div
                    key={char.id}
                    onClick={() => onSelectCharacter(char)}
                    className={`group relative rounded-xl overflow-hidden border-2 bg-[#120e22] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] flex flex-col ${borderClass}`}
                  >
                    {/* Portrait Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-[#0a0714]">
                      <img
                        src={imgUrl}
                        alt={char.title}
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getAssetUrl();
                        }}
                      />

                      {/* Element Badge (Top Right) */}
                      <div className="absolute top-1.5 right-1.5 pointer-events-none">
                        <ElementBadge element={char.element} showLabel={false} className="scale-90 shadow-md" />
                      </div>

                      {/* Collection Owned Toggle (Top Left) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playClick();
                          toggleOwnedCharacter(char.id);
                        }}
                        className={`absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer ${
                          isCharacterOwned(char.id)
                            ? 'bg-emerald-500 border-2 border-emerald-300 shadow-md shadow-emerald-500/50'
                            : 'bg-black/50 border-2 border-gray-500/50 hover:border-gray-300/70'
                        }`}
                        title={isCharacterOwned(char.id) ? 'Remover da coleção' : 'Adicionar à coleção'}
                      >
                        {isCharacterOwned(char.id) && (
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        )}
                      </button>

                      {/* Rarity, Limited & SP Pills (Bottom Left) */}
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 pointer-events-none">
                        <RarityBadge rarity={char.rarity} className="text-[10px] px-1.5 py-0" />
                        {char.limited && (
                          <span className="px-1.5 py-0 rounded text-[9px] font-extrabold bg-red-950/90 text-red-300 border border-red-500/50">
                            LIM
                          </span>
                        )}
                        {char.pool_status === 'waiting' && (
                          <span className="px-1.5 py-0 rounded text-[9px] font-extrabold bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow-sm" title="Aguardando inclusão no Pool Padrão">
                            WAIT
                          </span>
                        )}
                        {char.sp && (
                          <span className="px-1.5 py-0 rounded text-[9px] font-black bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-sm">
                            SP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Info */}
                    <div className="p-2.5 bg-gradient-to-b from-[#151028] to-[#0d091a] flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        {char.epithet && (
                          <p className="text-[10px] text-gray-400 truncate leading-tight mb-0.5">
                            {char.epithet}
                          </p>
                        )}
                        <h3 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                          {char.name}
                        </h3>
                      </div>

                      {/* Tags chips on card (if any) */}
                      {char.tags && char.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 overflow-hidden h-4">
                          {char.tags.slice(0, 2).map((tag) => (
                            <span 
                              key={tag} 
                              className="text-[9px] px-1 py-0 rounded bg-[#1f1738] text-purple-300 border border-purple-800/30 truncate"
                            >
                              {tag}
                            </span>
                          ))}
                          {char.tags.length > 2 && (
                            <span className="text-[8px] text-gray-500 self-center">
                              +{char.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-[#201838]">
                        <span>{char.focus}</span>
                        <span>{char.role}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
