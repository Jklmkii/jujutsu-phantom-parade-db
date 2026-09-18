import React, { useState } from 'react';
import type { Character, OfficialTierCategory } from '../types';
import { useJjkStore } from '../store/useJjkStore';
import { ElementBadge } from './Badges';
import { 
  Award, 
  RotateCcw, 
  Search, 
  X, 
  GripVertical, 
  Trash2, 
  Sparkles, 
  Sliders, 
  Copy, 
  Flame, 
  Moon, 
  Ghost, 
  Skull, 
  Sword, 
  ShieldCheck, 
  Star 
} from 'lucide-react';
import { playClick, playSelect, playTierDrop } from '../utils/sound';
import { getAssetPath, getStaticThumbUrl } from '../utils/assets';
import { useTranslation } from '../i18n';
import officialTierlistsData from '../data/tierlists.json';

interface TierlistMakerProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
}

type ViewMode = 'official' | 'custom';

export const TierlistMaker: React.FC<TierlistMakerProps> = ({ characters, onSelectCharacter }) => {
  const { t, language } = useTranslation();
  const { tierList, setTierForChar, removeTierForChar, resetTierList } = useJjkStore();
  const [viewMode, setViewMode] = useState<ViewMode>('official');
  const [selectedOfficialCat, setSelectedOfficialCat] = useState<string>('damage');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<string>('S+');
  const [draggedCharId, setDraggedCharId] = useState<string | null>(null);
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);
  const [isDragOverUnrank, setIsDragOverUnrank] = useState<boolean>(false);

  const officialCategories = officialTierlistsData as OfficialTierCategory[];
  const currentOfficial = officialCategories.find(c => c.id === selectedOfficialCat) || officialCategories[0];

  const TIERS = [
    { id: 'S+', label: 'S+', color: 'bg-red-600/20 border-red-500 text-red-300', badgeColor: 'bg-red-600' },
    { id: 'S', label: 'S', color: 'bg-amber-600/20 border-amber-500 text-amber-300', badgeColor: 'bg-amber-600' },
    { id: 'A', label: 'A', color: 'bg-purple-600/20 border-purple-500 text-purple-300', badgeColor: 'bg-purple-600' },
    { id: 'B', label: 'B', color: 'bg-blue-600/20 border-blue-500 text-blue-300', badgeColor: 'bg-blue-600' },
    { id: 'C', label: 'C', color: 'bg-emerald-600/20 border-emerald-500 text-emerald-300', badgeColor: 'bg-emerald-600' },
  ];

  const getRankBadgeStyle = (rank: string) => {
    switch (rank) {
      case 'S+': return 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-400';
      case 'S': return 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black border-amber-300';
      case 'A': return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400';
      case 'B': return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-400';
      case 'C': return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400';
      case 'D': return 'bg-gradient-to-r from-gray-600 to-slate-700 text-gray-200 border-gray-500';
      default: return 'bg-purple-900 text-purple-200 border-purple-700';
    }
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'damage': return <Sword className="w-4 h-4 text-rose-400" />;
      case 'support': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'sp': return <Star className="w-4 h-4 text-yellow-400" />;
      case 'blue': return <Moon className="w-4 h-4 text-blue-400" />;
      case 'red': return <Flame className="w-4 h-4 text-red-400" />;
      case 'green': return <Ghost className="w-4 h-4 text-emerald-400" />;
      case 'yellow': return <Skull className="w-4 h-4 text-amber-400" />;
      default: return <Award className="w-4 h-4 text-purple-400" />;
    }
  };

  // Seed default custom tierlist if empty
  React.useEffect(() => {
    if (Object.keys(tierList).length === 0) {
      characters.forEach((c) => {
        if (c.title.includes('0.2-Second') || c.title.includes('Hollow Purple') || c.title.includes('Queen of Curses') || c.title.includes('Zone')) {
          setTierForChar(c.id, 'S+');
        } else if (c.rarity === 'SSR') {
          setTierForChar(c.id, 'S');
        } else if (c.rarity === 'SR') {
          setTierForChar(c.id, 'A');
        } else {
          setTierForChar(c.id, 'B');
        }
      });
    }
  }, [characters, tierList, setTierForChar]);

  const cloneOfficialToCustom = (cat: OfficialTierCategory) => {
    playSelect();
    resetTierList();
    cat.tiers.forEach(rankObj => {
      const targetRank = rankObj.rank === 'D' ? 'C' : rankObj.rank;
      rankObj.slots.forEach(slot => {
        setTierForChar(slot.characterId, targetRank);
      });
    });
    setViewMode('custom');
  };

  const getCharactersInTier = (tierId: string) => {
    return characters.filter((c) => tierList[c.id] === tierId);
  };

  const unrankedCharacters = characters.filter((c) => {
    const isUnranked = !tierList[c.id];
    const matchSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.title.toLowerCase().includes(searchTerm.toLowerCase());
    return isUnranked && matchSearch;
  });

  const handleDragStart = (e: React.DragEvent, charId: string) => {
    e.dataTransfer.setData('text/plain', charId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCharId(charId);
  };

  const handleDragEnd = () => {
    setDraggedCharId(null);
    setDragOverTier(null);
    setIsDragOverUnrank(false);
  };

  const handleDropOnTier = (e: React.DragEvent, tierId: string) => {
    e.preventDefault();
    const charId = e.dataTransfer.getData('text/plain') || draggedCharId;
    if (charId) {
      setTierForChar(charId, tierId);
      playTierDrop();
    }
    setDraggedCharId(null);
    setDragOverTier(null);
  };

  const handleDropOnUnrank = (e: React.DragEvent) => {
    e.preventDefault();
    const charId = e.dataTransfer.getData('text/plain') || draggedCharId;
    if (charId) {
      removeTierForChar(charId);
      playClick();
    }
    setDraggedCharId(null);
    setIsDragOverUnrank(false);
  };

  const draggedChar = draggedCharId ? characters.find((c) => c.id === draggedCharId) : null;
  const isDraggedRanked = draggedCharId ? Boolean(tierList[draggedCharId]) : false;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              JJKPPDB Official Meta
            </span>
          </div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight flex items-center gap-3">
            <Award className="w-8 h-8 text-yellow-400" />
            {language === 'pt' ? 'TIER LISTS OFICIAIS & RANKINGS' : 'OFFICIAL TIER LISTS & RANKINGS'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {language === 'pt'
              ? 'Consulte os rankings oficiais do JJKPPDB por Categoria / Elemento ou monte sua própria classificação interativa.'
              : 'Browse official JJKPPDB meta rankings by Category / Element or build your own interactive tier list.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 bg-[#120d26] p-1.5 rounded-xl border border-[#2b1f4c]">
          <button
            onClick={() => {
              playClick();
              setViewMode('official');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'official'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {language === 'pt' ? 'Oficiais (JJKPPDB)' : 'Official (JJKPPDB)'}
          </button>
          <button
            onClick={() => {
              playClick();
              setViewMode('custom');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'custom'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            {language === 'pt' ? 'Criador Customizado' : 'Custom Builder'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: OFFICIAL JJKPPDB TIERLISTS                                        */}
      {/* ========================================================================= */}
      {viewMode === 'official' && (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {officialCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playClick();
                  setSelectedOfficialCat(cat.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedOfficialCat === cat.id
                    ? 'bg-[#221644] text-white border border-purple-500/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/40'
                    : 'bg-[#100b21] text-gray-400 hover:text-gray-200 border border-[#20183b]'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.title}</span>
              </button>
            ))}
          </div>

          {/* Active Category Description & Clone Action */}
          <div className="bg-[#120d24] border border-[#231a40] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {getCategoryIcon(currentOfficial.id)}
                {currentOfficial.title}
              </h2>
              <p className="text-sm text-gray-400 mt-1">{currentOfficial.description}</p>
            </div>
            <button
              onClick={() => cloneOfficialToCustom(currentOfficial)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-700/50 hover:border-purple-500 text-xs font-bold transition-all shrink-0"
              title={language === 'pt' ? 'Copiar esta lista para o Criador Customizado para editar à sua vontade' : 'Copy this tier list to Custom Builder to edit freely'}
            >
              <Copy className="w-4 h-4" />
              {language === 'pt' ? 'Editar no Criador Customizado' : 'Edit in Custom Builder'}
            </button>
          </div>

          {/* Official Tiers Display */}
          <div className="space-y-4">
            {currentOfficial.tiers.map((tier) => {
              // Deduplicate slots defensively in case json or previous state has redundant entries
              const seenIds = new Set<string>();
              const uniqueSlots = tier.slots.filter(slot => {
                const key = slot.characterId || slot.title;
                if (!key || seenIds.has(key)) return false;
                seenIds.add(key);
                return true;
              });

              return (
                <div
                  key={`${currentOfficial.id}-${tier.rank}`}
                  className="flex flex-col md:flex-row bg-[#110c22] border border-[#231a40] rounded-2xl overflow-hidden shadow-lg"
                >
                  {/* Tier Rank Header */}
                  <div className={`w-full md:w-28 p-4 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 border-b md:border-b-0 md:border-r border-[#231a40] shrink-0 ${
                    tier.rank === 'S' ? 'bg-amber-950/30' :
                    tier.rank === 'A' ? 'bg-purple-950/30' :
                    tier.rank === 'B' ? 'bg-blue-950/30' :
                    tier.rank === 'C' ? 'bg-emerald-950/30' : 'bg-gray-900/40'
                  }`}>
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-md border ${getRankBadgeStyle(tier.rank)}`}>
                      {tier.rank}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      {uniqueSlots.length} {language === 'pt' ? 'unidades' : 'units'}
                    </span>
                  </div>

                  {/* Character Slots Grid */}
                  <div className="p-4 flex-1 flex flex-wrap gap-3 items-center min-h-[90px]">
                    {uniqueSlots.map((slot, sIdx) => {
                      const localChar = characters.find(c => c.id === slot.characterId);
                      const thumbUrl = localChar
                        ? getStaticThumbUrl(localChar.id, localChar.image)
                        : getAssetPath(`assets/${slot.image}`);

                      return (
                        <div
                          key={`${currentOfficial.id}-${tier.rank}-${slot.characterId || sIdx}`}
                          onClick={() => {
                            playSelect();
                            if (localChar) onSelectCharacter(localChar);
                          }}
                          className="group relative flex flex-col items-center p-2 rounded-xl bg-[#171030] hover:bg-[#221848] border border-[#2c1f4e] hover:border-purple-400 transition-all duration-200 cursor-pointer w-24 text-center hover:scale-105 shadow-md"
                          title={`${slot.title}\n${language === 'pt' ? 'Clique para ver detalhes' : 'Click to view details'}`}
                        >
                          {/* Avatar */}
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-purple-900/60 group-hover:border-purple-400 relative mb-1.5 shadow">
                            <img
                              src={thumbUrl}
                              alt={slot.title}
                              className="w-full h-full object-cover object-top transform group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getAssetPath(`assets/${slot.image}`);
                              }}
                            />
                            {slot.hasDupeScaling && (
                              <span className="absolute bottom-0 right-0 bg-red-600/90 text-[9px] font-black text-white px-1 rounded-tl" title={language === 'pt' ? 'Escala com Duplicatas' : 'Scales with Duplicates'}>
                                ★
                              </span>
                            )}
                          </div>

                          {/* Name & Title */}
                          <div className="text-white text-[11px] font-bold truncate w-full group-hover:text-purple-300">
                            {slot.name}
                          </div>
                          <div className="text-gray-400 text-[9px] truncate w-full">
                            {slot.title.replace(`(${slot.name})`, '').trim() || slot.title}
                          </div>

                          {/* Element tag */}
                          <div className="mt-1">
                            <ElementBadge element={slot.element} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: CUSTOM INTERACTIVE DRAG & DROP TIERLIST                           */}
      {/* ========================================================================= */}
      {viewMode === 'custom' && (
        <div className="space-y-8">
          {/* Custom Action Bar */}
          <div className="flex items-center justify-between bg-[#120d24] border border-[#231a40] rounded-xl p-4">
            <div className="text-sm text-gray-300">
              <span className="font-bold text-white">{language === 'pt' ? 'Modo Criador:' : 'Builder Mode:'}</span>{' '}
              {language === 'pt'
                ? 'Arraste os feiticeiros entre os tiers ou solte na lixeira para desclassificar.'
                : 'Drag sorcerers between tiers or drop into the trash to unrank.'}
            </div>
            <button
              onClick={resetTierList}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1333] hover:bg-red-950 text-gray-300 hover:text-red-300 border border-[#2d2250] hover:border-red-500/40 text-xs font-bold transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.tierlist.resetDefault}</span>
            </button>
          </div>

          {/* Drop Zone to remove / unrank character (Shown while dragging an already ranked unit) */}
          {draggedCharId && isDraggedRanked && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!isDragOverUnrank) setIsDragOverUnrank(true);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setIsDragOverUnrank(false);
              }}
              onDrop={handleDropOnUnrank}
              className={`p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all duration-200 ${
                isDragOverUnrank
                  ? 'bg-red-950/60 border-red-500 text-red-200 scale-[1.01] shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'bg-red-950/20 border-red-500/40 text-red-300/80 hover:border-red-400'
              }`}
            >
              <Trash2 className="w-5 h-5 animate-pulse text-red-400" />
              <span className="text-sm font-bold tracking-wide">
                {language === 'pt'
                  ? `Solte aqui para remover "${draggedChar?.name}" do tier e mover para não classificados`
                  : `Drop here to remove "${draggedChar?.name}" from tier and unrank`}
              </span>
            </div>
          )}

          {/* Tier Rows */}
          <div className="space-y-4">
            {TIERS.map((tier) => {
              const charsInTier = getCharactersInTier(tier.id);
              const isOver = dragOverTier === tier.id;

              return (
                <div
                  key={tier.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverTier !== tier.id) setDragOverTier(tier.id);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverTier(null);
                  }}
                  onDrop={(e) => handleDropOnTier(e, tier.id)}
                  className={`flex flex-col md:flex-row bg-[#110c22] border rounded-2xl overflow-hidden shadow-lg transition-all duration-200 ${
                    isOver
                      ? 'border-purple-400 ring-2 ring-purple-400/50 bg-[#191136]'
                      : 'border-[#231a40]'
                  }`}
                >
                  {/* Tier Label */}
                  <div className={`w-full md:w-28 p-4 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 border-b md:border-b-0 md:border-r border-[#231a40] shrink-0 ${tier.color}`}>
                    <span className="text-2xl font-black">{tier.label}</span>
                    <span className="text-[11px] font-bold opacity-75">
                      {charsInTier.length} {language === 'pt' ? 'unidades' : 'units'}
                    </span>
                  </div>

                  {/* Character Slots Grid */}
                  <div className="p-4 flex-1 flex flex-wrap gap-2.5 items-center min-h-[90px]">
                    {charsInTier.map((c) => {
                      const isBeingDragged = draggedCharId === c.id;
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, c.id)}
                          onDragEnd={handleDragEnd}
                          onDoubleClick={() => onSelectCharacter(c)}
                          className={`group relative flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#160f2d] hover:bg-[#201642] border border-[#2c1f4e] hover:border-purple-400 transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                            isBeingDragged ? 'opacity-30 border-dashed border-purple-400' : ''
                          }`}
                          title={`${c.title}\n${language === 'pt' ? 'Arraste para mover ou dê duplo clique para abrir a ficha' : 'Drag to move or double-click to view details'}`}
                        >
                          <GripVertical className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-300 -mr-1" />
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-purple-900/50 group-hover:border-purple-400 shrink-0 relative">
                            <img
                              src={getStaticThumbUrl(c.id, c.image)}
                              alt={c.title}
                              className="w-full h-full object-cover object-top pointer-events-none"
                            />
                          </div>
                          <div className="flex flex-col max-w-[110px]">
                            <span className="text-xs font-bold text-white truncate group-hover:text-purple-300">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate">
                              {c.title}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTierForChar(c.id);
                            }}
                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 ml-0.5"
                            title={language === 'pt' ? 'Remover deste tier' : 'Remove from this tier'}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {charsInTier.length === 0 && (
                      <div className="text-xs font-medium text-gray-500 italic flex items-center gap-2 p-2">
                        <span>
                          {language === 'pt'
                            ? `Arraste os feiticeiros aqui para ranquear em ${tier.label}`
                            : `Drag sorcerers here to rank in ${tier.label}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unranked Pool */}
          <div className="bg-[#120d24] border border-[#231a40] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{t.tierlist.unranked}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/40">
                    {unrankedCharacters.length}
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {language === 'pt'
                    ? 'Arraste qualquer feiticeiro diretamente para os tiers acima ou selecione um tier de destino rápido.'
                    : 'Drag any sorcerer directly to tiers above or select a quick rank destination.'}
                </p>
              </div>

              {/* Quick Destination Select & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#0a0714] p-1 rounded-xl border border-[#251a44]">
                  <span className="text-[11px] font-semibold text-gray-400 px-2">
                    {language === 'pt' ? 'Destino Rápido:' : 'Quick Rank:'}
                  </span>
                  {TIERS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTier(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeTier === t.id
                          ? `${t.badgeColor} text-white shadow-md`
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t.id}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === 'pt' ? 'Filtrar feiticeiros...' : 'Filter sorcerers...'}
                    className="w-full pl-9 pr-4 py-1.5 bg-[#0a0714] border border-[#251a44] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Unranked Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[420px] overflow-y-auto p-1 pr-2 custom-scrollbar">
              {unrankedCharacters.map((c) => {
                const isBeingDragged = draggedCharId === c.id;
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      setTierForChar(c.id, activeTier);
                      playClick();
                    }}
                    onDoubleClick={() => onSelectCharacter(c)}
                    className={`group relative flex flex-col items-center p-2 rounded-xl bg-[#0e0a1c] hover:bg-[#191136] border border-[#20183b] hover:border-purple-400 transition-all duration-200 cursor-grab active:cursor-grabbing text-center hover:scale-[1.02] shadow-sm select-none ${
                      isBeingDragged ? 'opacity-30 border-dashed border-purple-400' : ''
                    }`}
                    title={`${c.title}\n${language === 'pt' ? `Clique para adicionar ao tier ${activeTier} ou arraste até a linha desejada` : `Click to add to tier ${activeTier} or drag to desired tier`}`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#2b1f4c] group-hover:border-purple-400 relative mb-1.5 shrink-0 shadow">
                      <img
                        src={getStaticThumbUrl(c.id, c.image)}
                        alt={c.title}
                        className="w-full h-full object-cover object-top pointer-events-none"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-gray-200 group-hover:text-purple-300 truncate w-full">
                      {c.name}
                    </span>
                    <span className="text-[9px] text-gray-500 truncate w-full">
                      {c.title}
                    </span>
                    <div className="mt-1">
                      <ElementBadge element={c.element} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
