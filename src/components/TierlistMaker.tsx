import React, { useState } from 'react';
import type { Character } from '../types';
import { useJjkStore } from '../store/useJjkStore';
import { ElementBadge } from './Badges';
import { Award, RotateCcw, Search, X } from 'lucide-react';
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
            Classifique seus personagens em tiers com salvamento automático local no seu computador.
          </p>
        </div>

        <button
          onClick={resetTierList}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1333] hover:bg-red-950 text-gray-300 hover:text-red-300 border border-[#2d2250] hover:border-red-500/40 text-xs font-bold transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Resetar Tier List</span>
        </button>
      </div>

      {/* Tier Rows */}
      <div className="space-y-4">
        {TIERS.map((tier) => {
          const charsInTier = getCharactersInTier(tier.id);

          return (
            <div
              key={tier.id}
              className={`rounded-2xl border-2 flex flex-col md:flex-row overflow-hidden bg-[#120e24] ${tier.color}`}
            >
              {/* Tier Header / Badge */}
              <div className={`w-full md:w-28 min-h-[90px] ${tier.badgeColor} flex items-center justify-center p-4 text-center shadow-lg`}>
                <span className="text-3xl font-black text-white font-mono drop-shadow">
                  {tier.label}
                </span>
              </div>

              {/* Characters inside this tier */}
              <div className="flex-1 p-3 flex flex-wrap gap-2.5 items-center min-h-[90px] bg-[#0c0818]/60">
                {charsInTier.length === 0 ? (
                  <span className="text-xs text-gray-500 italic pl-3">
                    Nenhum personagem neste tier. Selecione abaixo para adicionar.
                  </span>
                ) : (
                  charsInTier.map((c) => (
                    <div
                      key={c.id}
                      className="group relative w-16 h-16 rounded-xl overflow-hidden border border-purple-500/40 bg-[#090612] cursor-pointer hover:scale-105 transition-transform"
                      title={`${c.title} (Clique duas vezes para abrir, ou clique no X para remover)`}
                    >
                      <img
                        src={getStaticThumbUrl(c.image)}
                        alt={c.title}
                        onClick={() => onSelectCharacter(c)}
                        className="w-full h-full object-cover"
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTierForChar(c.id);
                        }}
                        className="absolute top-0.5 left-0.5 p-0.5 rounded-full bg-black/80 hover:bg-red-600 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div className="bg-[#120e24] border border-[#271d44] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#201838] pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">
                Personagens sem Tier ({unrankedCharacters.length})
              </h3>
              <p className="text-xs text-gray-400">
                Escolha o tier alvo e clique no personagem para adicioná-lo.
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
                onClick={() => setTierForChar(c.id, activeTier)}
                className="group relative w-16 h-16 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-400 bg-[#090612] cursor-pointer hover:scale-105 transition-all"
                title={`Clique para mover para o Tier ${activeTier}`}
              >
                <img
                  src={getStaticThumbUrl(c.image)}
                  alt={c.title}
                  className="w-full h-full object-cover"
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
