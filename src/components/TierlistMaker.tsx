import React, { useState } from 'react';
import type { Character } from '../types';
import { useJjkStore } from '../store/useJjkStore';
import { ElementBadge } from './Badges';
import { Award, RotateCcw, Search, X, GripVertical, Trash2 } from 'lucide-react';
import { playClick } from '../utils/sound';
import { getAssetUrl, getStaticThumbUrl } from '../utils/assets';

interface TierlistMakerProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
}

export const TierlistMaker: React.FC<TierlistMakerProps> = ({ characters, onSelectCharacter }) => {
  const { tierList, setTierForChar, removeTierForChar, resetTierList } = useJjkStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<string>('S+');
  const [draggedCharId, setDraggedCharId] = useState<string | null>(null);
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);
  const [isDragOverUnrank, setIsDragOverUnrank] = useState<boolean>(false);

  const TIERS = [
    { id: 'S+', label: 'S+', color: 'bg-red-600/20 border-red-500 text-red-300', badgeColor: 'bg-red-600' },
    { id: 'S', label: 'S', color: 'bg-amber-600/20 border-amber-500 text-amber-300', badgeColor: 'bg-amber-600' },
    { id: 'A', label: 'A', color: 'bg-purple-600/20 border-purple-500 text-purple-300', badgeColor: 'bg-purple-600' },
    { id: 'B', label: 'B', color: 'bg-blue-600/20 border-blue-500 text-blue-300', badgeColor: 'bg-blue-600' },
    { id: 'C', label: 'C', color: 'bg-emerald-600/20 border-emerald-500 text-emerald-300', badgeColor: 'bg-emerald-600' },
  ];

  // Default pre-filled meta tierlist if empty
  React.useEffect(() => {
    if (Object.keys(tierList).length === 0) {
      // Seed some meta units
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
      playClick();
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight flex items-center gap-3">
            <Award className="w-7 h-7 text-yellow-400" />
            TIER LIST INTERATIVA (RANKING DE FEITICEIROS)
          </h1>
          <p className="text-sm text-gray-400">
            Arraste e solte os personagens livremente entre as linhas de tier ou clique para adicionar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetTierList}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1333] hover:bg-red-950 text-gray-300 hover:text-red-300 border border-[#2d2250] hover:border-red-500/40 text-xs font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Resetar Tier List</span>
          </button>
        </div>
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
            Solte aqui para remover "{draggedChar?.name}" do tier e mover para não classificados
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
                if (dragOverTier === tier.id) setDragOverTier(null);
              }}
              onDrop={(e) => handleDropOnTier(e, tier.id)}
              className={`rounded-2xl border-2 flex flex-col md:flex-row overflow-hidden bg-[#120e24] ${tier.color} transition-all duration-200 ${
                isOver ? 'ring-2 ring-purple-400 border-purple-400 bg-purple-950/40 shadow-[0_0_25px_rgba(168,85,247,0.35)] scale-[1.008]' : ''
              }`}
            >
              {/* Tier Header / Badge */}
              <div className={`w-full md:w-28 min-h-[90px] ${tier.badgeColor} flex flex-col items-center justify-center p-4 text-center shadow-lg select-none`}>
                <span className="text-3xl font-black text-white font-mono drop-shadow">
                  {tier.label}
                </span>
                <span className="text-[10px] font-bold text-white/80 mt-0.5">
                  ({charsInTier.length})
                </span>
              </div>

              {/* Characters inside this tier */}
              <div className="flex-1 p-3 flex flex-wrap gap-2.5 items-center min-h-[90px] bg-[#0c0818]/60 relative">
                {charsInTier.length === 0 ? (
                  <div className="w-full flex items-center justify-center py-4 text-xs text-gray-500 italic">
                    {isOver ? (
                      <span className="text-purple-300 font-bold animate-pulse">
                        Solte o personagem para adicionar ao Tier {tier.label}
                      </span>
                    ) : (
                      <span>Arraste personagens para cá ou selecione na lista abaixo</span>
                    )}
                  </div>
                ) : (
                  charsInTier.map((c) => (
                    <div
                      key={c.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onDragEnd={handleDragEnd}
                      className={`group relative w-16 h-16 rounded-xl overflow-hidden border border-purple-500/40 bg-[#090612] cursor-grab active:cursor-grabbing hover:scale-105 transition-all select-none ${
                        draggedCharId === c.id ? 'opacity-30 scale-95 border-dashed border-purple-300' : ''
                      }`}
                      title={`${c.title} (Arraste para mudar de tier, clique duas vezes para ver detalhes)`}
                    >
                      <img
                        src={getStaticThumbUrl(c.image)}
                        alt={c.title}
                        onClick={() => onSelectCharacter(c)}
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = 'true';
                            target.src = getAssetUrl(c.image);
                          } else {
                            target.src = getAssetUrl();
                          }
                        }}
                      />
                      <div className="absolute top-0.5 right-0.5 pointer-events-none">
                        <ElementBadge element={c.element} showLabel={false} className="scale-[0.65]" />
                      </div>

                      {/* Grip indicator on hover */}
                      <div className="absolute bottom-0.5 left-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded p-0.5">
                        <GripVertical className="w-2.5 h-2.5 text-white/80" />
                      </div>

                      {/* Quick delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTierForChar(c.id);
                          playClick();
                        }}
                        className="absolute top-0.5 left-0.5 p-0.5 rounded-full bg-black/80 hover:bg-red-600 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Remover do tier"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unranked Roster Selector */}
      {unrankedCharacters.length > 0 && (
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
          className={`bg-[#120e24] border rounded-2xl p-6 space-y-4 shadow-xl transition-all duration-200 ${
            isDragOverUnrank
              ? 'border-purple-500 ring-2 ring-purple-500/40 bg-[#160f2f]'
              : 'border-[#271d44]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#201838] pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <span>Personagens sem Tier ({unrankedCharacters.length})</span>
                {draggedCharId && isDraggedRanked && (
                  <span className="text-xs font-normal text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-md">
                    (Solte aqui para desclassificar)
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400">
                Arraste o feiticeiro para qualquer tier acima, ou clique para adicionar ao tier ativo.
              </p>
            </div>

            {/* Target Tier Selector & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar feiticeiro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0b0817] border border-[#251b40] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0b0817] p-1 rounded-xl border border-[#251b40]">
                <span className="text-[11px] font-bold text-gray-400 px-2">Adicionar ao:</span>
                {TIERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      playClick();
                      setActiveTier(t.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTier === t.id
                        ? `${t.badgeColor} text-white shadow-md`
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 max-h-72 overflow-y-auto pr-1">
            {unrankedCharacters.map((c) => (
              <div
                key={c.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, c.id)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  setTierForChar(c.id, activeTier);
                  playClick();
                }}
                className={`group relative w-16 h-16 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-400 bg-[#090612] cursor-grab active:cursor-grabbing hover:scale-105 transition-all select-none ${
                  draggedCharId === c.id ? 'opacity-30 scale-95 border-dashed border-purple-300' : ''
                }`}
                title={`Arraste para um tier ou clique para mover para o Tier ${activeTier}`}
              >
                <img
                  src={getStaticThumbUrl(c.image)}
                  alt={c.title}
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = 'true';
                      target.src = getAssetUrl(c.image);
                    } else {
                      target.src = getAssetUrl();
                    }
                  }}
                />
                <div className="absolute top-0.5 right-0.5 pointer-events-none">
                  <ElementBadge element={c.element} showLabel={false} className="scale-[0.65]" />
                </div>
                <div className="absolute bottom-0.5 left-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded p-0.5">
                  <GripVertical className="w-2.5 h-2.5 text-white/80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
