import React, { useState, useMemo } from 'react';
import type { Memory } from '../types';
import { RarityBadge } from './Badges';
import { Search, Sparkles, Clock, Shield } from 'lucide-react';
import { getAssetUrl } from '../utils/assets';

interface MemoriesListProps {
  memories: Memory[];
}

export const MemoriesList: React.FC<MemoriesListProps> = ({ memories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('ALL');

  const filteredMemories = useMemo(() => {
    return memories.filter((mem) => {
      const matchSearch = !searchTerm || mem.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRarity = selectedRarity === 'ALL' || mem.rarity === selectedRarity;
      return matchSearch && matchRarity;
    });
  }, [memories, searchTerm, selectedRarity]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white font-serif tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-amber-400" />
            CARTAS DE MEMÓRIA (REC. BITS)
          </h1>
          <p className="text-sm text-gray-400">
            Catálogo com 241 memórias, aumentos percentuais de atributos, tempos de recarga e passivas.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Buscar memória..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#120e24] border border-[#2d2250] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Rarity Buttons & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['ALL', 'SSR', 'SR', 'R'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRarity(r)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase border transition-all ${
                selectedRarity === r
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                  : 'bg-[#120e24] border-[#291f47] text-gray-400 hover:text-white'
              }`}
            >
              {r === 'ALL' ? 'Todas' : r}
            </button>
          ))}
        </div>
        <div className="text-xs font-mono text-gray-400">
          Exibindo <span className="text-white font-bold">{filteredMemories.length}</span> de {memories.length} memórias
        </div>
      </div>

      {/* Memories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMemories.map((mem) => {
          const imgUrl = getAssetUrl(mem.image);
          const isSSR = mem.rarity === 'SSR';
          const isSR = mem.rarity === 'SR';

          const borderClass = isSSR
            ? 'border-amber-500/50 hover:border-amber-400 shadow-sm shadow-amber-950/30'
            : isSR
            ? 'border-sky-500/40 hover:border-sky-300 shadow-sm shadow-sky-950/20'
            : 'border-slate-700 hover:border-slate-500';

          return (
            <div
              key={mem.id}
              className={`bg-[#120e24] border-2 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${borderClass}`}
            >
              <div>
                {/* Header Image */}
                <div className="relative aspect-[16/9] w-full bg-[#0a0714] overflow-hidden group">
                  <img
                    src={imgUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAssetUrl();
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <RarityBadge rarity={mem.rarity} />
                  </div>
                  {mem.active_cooldown && mem.active_cooldown !== '0' && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[11px] font-bold bg-black/70 border border-purple-500/40 text-purple-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>CD: {mem.active_cooldown}T</span>
                    </div>
                  )}
                </div>

                {/* Title and Stats */}
                <div className="p-5 space-y-4">
                  <h3 className="text-base font-bold text-white leading-snug">
                    {mem.title}
                  </h3>

                  {/* Status Pills */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-[#18122d] border border-purple-900/30 p-2 rounded-lg">
                      <span className="block text-[10px] text-gray-400 font-bold uppercase">HP</span>
                      <span className="font-mono font-bold text-emerald-400">{mem.stats.hp}</span>
                    </div>
                    <div className="bg-[#18122d] border border-purple-900/30 p-2 rounded-lg">
                      <span className="block text-[10px] text-gray-400 font-bold uppercase">Taijutsu</span>
                      <span className="font-mono font-bold text-red-400">{mem.stats.taijutsu}</span>
                    </div>
                    <div className="bg-[#18122d] border border-purple-900/30 p-2 rounded-lg">
                      <span className="block text-[10px] text-gray-400 font-bold uppercase">Jujutsu</span>
                      <span className="font-mono font-bold text-blue-400">{mem.stats.jujutsu}</span>
                    </div>
                  </div>

                  {/* Active Skill */}
                  {mem.active_skill && mem.active_skill.description && (
                    <div className="bg-[#0b0817] p-3.5 rounded-xl border border-[#22183d] space-y-1">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Habilidade de Comando
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                        {mem.active_skill.description}
                      </p>
                    </div>
                  )}

                  {/* Passive Skill */}
                  {mem.passive_skill && mem.passive_skill.description && mem.passive_skill.description !== 'N/A' && (
                    <div className="bg-[#0b0817] p-3.5 rounded-xl border border-[#22183d] space-y-1">
                      <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        Habilidade Automática (Passiva)
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                        {mem.passive_skill.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Release date */}
              <div className="px-5 py-2.5 bg-[#0e0a1d] border-t border-[#201738] text-[11px] text-gray-500">
                Lançamento: {mem.release_date}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
