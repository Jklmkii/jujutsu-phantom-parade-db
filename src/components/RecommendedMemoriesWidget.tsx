import React, { useMemo } from 'react';
import type { Character, Memory } from '../types';
import { getRecommendedMemories } from '../utils/buildOptimizer';
import { getAssetUrl } from '../utils/assets';
import { Sparkles, Trophy, Award, Star } from 'lucide-react';
import { RarityBadge } from './Badges';
import { playClick } from '../utils/sound';

interface RecommendedMemoriesWidgetProps {
  character: Character;
  memories: Memory[];
  language?: string;
  onSelectMemory?: (mem: Memory) => void;
}

export const RecommendedMemoriesWidget: React.FC<RecommendedMemoriesWidgetProps> = ({
  character,
  memories,
  language = 'pt',
  onSelectMemory,
}) => {
  const recommendations = useMemo(() => {
    return getRecommendedMemories(character, memories);
  }, [character, memories]);

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-[#120e24] border border-[#291f47] rounded-xl p-5 shadow-lg space-y-3.5">
      <div className="flex items-center justify-between border-b border-[#251b40] pb-2.5">
        <h2 className="text-sm font-black tracking-wider uppercase text-amber-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {language === 'pt' ? 'MELHORES LEMBRANÇAS (BiS)' : 'BEST IN SLOT MEMORIES (BiS)'}
        </h2>
        <span className="text-[11px] font-bold text-gray-400">
          {language === 'pt' ? 'Top 3 Otimizadas' : 'Top 3 Optimized'}
        </span>
      </div>

      <div className="space-y-2.5">
        {recommendations.map((rec) => {
          const isBiS = rec.rank === 1;
          const badgeText = language === 'pt' ? rec.badge : rec.badgeEn;
          const reasons = language === 'pt' ? rec.reasonsPt : rec.reasonsEn;
          const memImg = getAssetUrl(rec.memory.image);

          return (
            <div
              key={rec.memory.id}
              onClick={() => {
                playClick();
                if (onSelectMemory) onSelectMemory(rec.memory);
              }}
              className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                isBiS
                  ? 'bg-gradient-to-r from-amber-950/40 via-[#18112e] to-[#120e24] border-amber-500/50 shadow-md shadow-amber-950/30 hover:border-amber-400'
                  : 'bg-[#150f2b] border-[#291e48] hover:border-purple-500/40 hover:bg-[#1a1334]'
              }`}
            >
              {/* Rank Icon / Badge */}
              <div className="shrink-0 flex flex-col items-center justify-center w-7">
                {rec.rank === 1 ? (
                  <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                ) : rec.rank === 2 ? (
                  <Award className="w-5 h-5 text-purple-300" />
                ) : (
                  <Star className="w-5 h-5 text-cyan-400" />
                )}
                <span className="text-[10px] font-black text-gray-400 mt-0.5">
                  #{rec.rank}
                </span>
              </div>

              {/* Memory Art */}
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#090614] border border-purple-500/40 shrink-0 relative">
                <img
                  src={memImg}
                  alt={rec.memory.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getAssetUrl();
                  }}
                />
              </div>

              {/* Title & Reasons */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <RarityBadge rarity={rec.memory.rarity} />
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                      isBiS
                        ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                        : 'bg-[#1c1339] border-purple-800/50 text-purple-300'
                    }`}
                  >
                    {badgeText}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-1" title={rec.memory.title}>
                  {rec.memory.title}
                </h4>

                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {reasons.map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-gray-300 bg-[#0c081d] px-2 py-0.5 rounded border border-[#23173d] truncate max-w-full"
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 leading-normal pt-1">
        {language === 'pt'
          ? 'Calculado por sinergia de atributos (Taijutsu/Jujutsu), passivas de dano, buffs de equipe e gatilhos de Kokusen.'
          : 'Calculated via stat scaling (Taijutsu/Jujutsu), damage passives, team buffs, and Black Flash triggers.'}
      </p>
    </div>
  );
};
