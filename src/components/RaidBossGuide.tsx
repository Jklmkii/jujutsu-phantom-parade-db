import React, { useState, useMemo } from 'react';
import type { Character } from '../types';
import raidsData from '../data/raids.json';
import { getAssetUrl } from '../utils/assets';
import { ElementBadge } from './Badges';
import { useTranslation } from '../i18n';
import { useJjkStore } from '../store/useJjkStore';
import { 
  playClick, 
  playSelect, 
  playCursedEnergyCharge, 
  playElementalTone,
  playDomainExpansion
} from '../utils/sound';
import { 
  Skull, 
  ShieldAlert, 
  Swords, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Flame,
  Info
} from 'lucide-react';

interface RaidBossGuideProps {
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
}

export interface RaidBoss {
  id: string;
  name: string;
  shortName: string;
  shortNameEn: string;
  japaneseName: string;
  element: string;
  recommendedElements: string[];
  image: string;
  difficulty: string;
  difficultyEn: string;
  description: string;
  descriptionEn: string;
  gimmick: {
    title: string;
    titleEn: string;
    effect: string;
    effectEn: string;
  };
  wipeCondition: {
    turn: number;
    name: string;
    nameEn: string;
    detail: string;
    detailEn: string;
  };
  turnPatterns: {
    turn: number;
    action: string;
    actionEn: string;
    danger: 'low' | 'medium' | 'high' | 'critical' | 'wipe';
    note: string;
  }[];
  tacticalTips: string[];
  tacticalTipsEn: string[];
  recommendedCounterIds: string[];
}

export const RaidBossGuide: React.FC<RaidBossGuideProps> = ({
  characters,
  onSelectCharacter,
}) => {
  const { language } = useTranslation();
  const { isCharacterOwned } = useJjkStore();
  const raids = raidsData as RaidBoss[];

  const [selectedBossId, setSelectedBossId] = useState<string>(raids[0]?.id || 'mahoraga');
  const [selectedTurn, setSelectedTurn] = useState<number>(1);

  const activeBoss = useMemo(() => {
    return raids.find(r => r.id === selectedBossId) || raids[0];
  }, [raids, selectedBossId]);

  // Find recommended counter characters from database
  const counterCharacters = useMemo(() => {
    if (!activeBoss) return [];
    return activeBoss.recommendedCounterIds
      .map(id => characters.find(c => c.id.includes(id) || c.id === id))
      .filter((c): c is Character => !!c);
  }, [activeBoss, characters]);

  const activeTurnData = useMemo(() => {
    return activeBoss.turnPatterns.find(p => p.turn === selectedTurn) || activeBoss.turnPatterns[0];
  }, [activeBoss, selectedTurn]);

  const getDangerBadge = (danger: string) => {
    switch (danger) {
      case 'wipe':
        return {
          bg: 'bg-red-950 border-red-500 text-red-300 animate-pulse',
          label: language === 'pt' ? 'WIPE TOTAL' : 'TOTAL WIPE',
          icon: <Skull className="w-3.5 h-3.5" />,
        };
      case 'critical':
        return {
          bg: 'bg-rose-950/80 border-rose-500 text-rose-300',
          label: language === 'pt' ? 'CRÍTICO' : 'CRITICAL',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case 'high':
        return {
          bg: 'bg-orange-950/80 border-orange-500 text-orange-300',
          label: language === 'pt' ? 'PERIGO ALTO' : 'HIGH DANGER',
          icon: <Flame className="w-3.5 h-3.5" />,
        };
      case 'medium':
        return {
          bg: 'bg-amber-950/80 border-amber-500 text-amber-300',
          label: language === 'pt' ? 'MÉDIO' : 'MEDIUM',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
        };
      default:
        return {
          bg: 'bg-emerald-950/80 border-emerald-500 text-emerald-300',
          label: language === 'pt' ? 'NORMAL' : 'NORMAL',
          icon: <Info className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#251b40] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-950/60 border border-red-600/40 text-red-400 shadow-md">
              <Skull className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-red-400 font-serif">
              {language === 'pt' ? 'GUIA TÁTICO DE CHEFES & RAIDS' : 'BOSS RAIDS & DOMAIN BATTLES'}
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {language === 'pt'
              ? 'Mapeamento de padrões por turno, gatilhos de Wipe, fraquezas elementais e escalações de contra-ataque.'
              : 'Turn-by-turn pattern tracking, Wipe mechanics, elemental weaknesses, and optimal counter lineups.'}
          </p>
        </div>

        {/* Boss Quick Switcher Pill Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {raids.map((boss) => {
            const isSelected = boss.id === selectedBossId;
            const bossTitle = language === 'pt' ? boss.shortName : boss.shortNameEn;
            return (
              <button
                key={boss.id}
                onClick={() => {
                  playSelect();
                  setSelectedBossId(boss.id);
                  setSelectedTurn(1);
                }}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-950/90 to-purple-950/90 border-red-500 text-white shadow-lg shadow-red-950/50 ring-2 ring-red-500/40'
                    : 'bg-[#120d24] border-[#251b40] text-gray-400 hover:text-white hover:border-purple-500/50'
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-black border border-purple-800/40 shrink-0">
                  <img
                    src={getAssetUrl(boss.image)}
                    alt={bossTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAssetUrl();
                    }}
                  />
                </div>
                <span>{bossTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Boss Profile Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#120a1f] via-[#1a0f2e] to-[#0d0718] border border-red-950/60 p-6 lg:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          {/* Boss Portrait Art */}
          <div className="relative w-full max-w-xs aspect-[4/3] rounded-2xl overflow-hidden border-2 border-red-500/50 shadow-2xl shadow-red-950/80 bg-black shrink-0 group">
            <img
              src={getAssetUrl(activeBoss.image)}
              alt={activeBoss.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getAssetUrl();
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {activeBoss.element !== 'None' && (
                <div
                  className="cursor-pointer"
                  onClick={() => playElementalTone(activeBoss.element)}
                >
                  <ElementBadge element={activeBoss.element} />
                </div>
              )}
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-950 border border-red-500/70 text-red-200">
                {language === 'pt' ? activeBoss.difficulty : activeBoss.difficultyEn}
              </span>
            </div>
          </div>

          {/* Boss Lore & Gimmicks */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">
                {activeBoss.japaneseName}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-serif mt-1">
                {language === 'pt' ? activeBoss.name : activeBoss.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mt-2 max-w-3xl">
                {language === 'pt' ? activeBoss.description : activeBoss.descriptionEn}
              </p>
            </div>

            {/* Combat Gimmick Box */}
            <div className="bg-[#0b0716] border border-amber-500/30 rounded-xl p-4 space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wide text-amber-300">
                  {language === 'pt' ? activeBoss.gimmick.title : activeBoss.gimmick.titleEn}
                </h3>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                {language === 'pt' ? activeBoss.gimmick.effect : activeBoss.gimmick.effectEn}
              </p>
            </div>

            {/* Wipe Condition Banner */}
            <div className="bg-gradient-to-r from-red-950/80 to-[#1e0a16] border border-red-500/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => playDomainExpansion()}
                  className="p-2.5 rounded-xl bg-red-900/60 text-red-300 border border-red-500/50 shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                  title="Ouvir alerta de Wipe / Domínio"
                >
                  <Skull className="w-5 h-5 text-red-400 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block">
                    ⚠️ {language === 'pt' ? `GATILHO DE WIPE: TURNO ${activeBoss.wipeCondition.turn}` : `WIPE TRIGGER: TURN ${activeBoss.wipeCondition.turn}`}
                  </span>
                  <p className="text-xs font-bold text-white">
                    {language === 'pt' ? activeBoss.wipeCondition.name : activeBoss.wipeCondition.nameEn}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {language === 'pt' ? activeBoss.wipeCondition.detail : activeBoss.wipeCondition.detailEn}
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-red-950 border border-red-500/50 text-red-300 text-xs font-black shrink-0">
                {language === 'pt' ? `Limite: ${activeBoss.wipeCondition.turn} Turnos` : `Cap: ${activeBoss.wipeCondition.turn} Turns`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Turn Simulator & Phase Tracker */}
      <div className="bg-[#100b21] border border-[#271d44] rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#201738] pb-4">
          <div>
            <h3 className="text-base font-black text-purple-200 uppercase tracking-wider flex items-center gap-2">
              <Swords className="w-4 h-4 text-purple-400" />
              {language === 'pt' ? 'ROTAÇÃO DE ATAQUES POR TURNO' : 'TURN-BY-TURN ATTACK ROTATION'}
            </h3>
            <p className="text-xs text-gray-400">
              {language === 'pt'
                ? 'Selecione um turno para inspecionar a ação do chefe e preparar suas barreiras defensivas.'
                : 'Select a turn to inspect the boss action and prime defensive countermeasures.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {activeBoss.turnPatterns.map((p) => {
              const isTurnSelected = p.turn === selectedTurn;
              const isWipe = p.danger === 'wipe';
              return (
                <button
                  key={p.turn}
                  onClick={() => {
                    playClick();
                    setSelectedTurn(p.turn);
                  }}
                  className={`w-10 h-10 rounded-xl font-mono text-sm font-black transition-all cursor-pointer flex flex-col items-center justify-center border ${
                    isTurnSelected
                      ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-500/60 shadow-lg scale-105'
                      : isWipe
                      ? 'bg-red-950/60 border-red-500/50 text-red-300 hover:border-red-400'
                      : 'bg-[#150f2c] border-[#251b40] text-gray-400 hover:text-white hover:border-purple-500/40'
                  }`}
                >
                  <span className="text-[10px] font-sans font-bold leading-none">T</span>
                  <span className="leading-none">{p.turn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Turn Detail Card */}
        {activeTurnData && (() => {
          const badge = getDangerBadge(activeTurnData.danger);
          return (
            <div className="bg-[#140e2b] border border-[#2b1f4c] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-600/50 text-purple-300 font-mono font-black text-xs">
                    {language === 'pt' ? `Turno ${activeTurnData.turn}` : `Turn ${activeTurnData.turn}`}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black border flex items-center gap-1.5 ${badge.bg}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-black text-white">
                  {language === 'pt' ? activeTurnData.action : activeTurnData.actionEn}
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                  💡 <strong>{language === 'pt' ? 'Recomendação Tática:' : 'Tactical Advice:'}</strong> {activeTurnData.note}
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Two Column Layout: Recommended Counters (Left) & Battle Checklist (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recommended Counters */}
        <div className="bg-[#100b21] border border-[#271d44] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#201738] pb-3">
            <h3 className="text-base font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {language === 'pt' ? 'FEITICEIROS RECOMENDADOS (COUNTERS)' : 'RECOMMENDED COUNTER SORCERERS'}
            </h3>
            <span className="text-xs font-bold text-gray-400">
              {counterCharacters.length} {language === 'pt' ? 'unidades' : 'units'}
            </span>
          </div>

          <div className="space-y-3">
            {counterCharacters.map((char) => {
              const owned = isCharacterOwned(char.id);
              const imgUrl = getAssetUrl(char.image);

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    playCursedEnergyCharge();
                    onSelectCharacter(char);
                  }}
                  className="p-3 rounded-xl bg-[#140e2b] border border-[#271d44] hover:border-emerald-500/50 hover:bg-[#1a1236] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-purple-800/40 shrink-0 relative">
                      <img
                        src={imgUrl}
                        alt={char.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getAssetUrl();
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <ElementBadge element={char.element} />
                        {char.sp && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-950 border border-amber-600/50 text-amber-300">
                            SP
                          </span>
                        )}
                        {owned && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                            ✓ {language === 'pt' ? 'Na Coleção' : 'Owned'}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white truncate mt-0.5" title={char.name}>
                        {char.name}
                      </h4>
                      {char.epithet && (
                        <p className="text-[11px] text-purple-300 truncate">
                          {char.epithet}
                        </p>
                      )}
                    </div>
                  </div>

                  <button className="shrink-0 p-2 rounded-lg bg-[#0c0819] text-gray-400 group-hover:text-white group-hover:bg-purple-600 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Strategy Checklist */}
        <div className="bg-[#100b21] border border-[#271d44] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#201738] pb-3">
            <h3 className="text-base font-black text-purple-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              {language === 'pt' ? 'CHECKLIST DE SOBREVIVÊNCIA' : 'SURVIVAL CHECKLIST'}
            </h3>
          </div>

          <div className="space-y-3">
            {(language === 'pt' ? activeBoss.tacticalTips : activeBoss.tacticalTipsEn).map((tip, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#140e2b] border border-[#271d44] flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-purple-950 border border-purple-600/50 text-purple-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                  {tip}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#201738]">
            <p className="text-xs text-yellow-300/80 leading-relaxed bg-yellow-950/20 border border-yellow-800/30 p-3 rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span>
                {language === 'pt'
                  ? 'As mecânicas de chefes são 100% calibradas de acordo com as instâncias oficiais de Raid e Batalhas de Domínio de Jujutsu Kaisen: Phantom Parade.'
                  : 'Boss mechanics are calibrated according to official Phantom Parade Raid instances and Domain Expansion encounters.'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
