import React, { useState, useMemo } from 'react';
import type { Character, Memory } from '../types';
import { ElementBadge, RarityBadge } from './Badges';
import { getAssetUrl } from '../utils/assets';
import { getBestInSlotMemory } from '../utils/buildOptimizer';
import { useTranslation } from '../i18n';
import { 
  playClick, 
  playSelect, 
  playBlackFlash, 
  playUltimateSkill, 
  playElementalTone 
} from '../utils/sound';
import { 
  Users, 
  Sparkles, 
  Flame, 
  Search, 
  X, 
  Zap, 
  TrendingUp, 
  CheckSquare, 
  Square 
} from 'lucide-react';

interface TeamDpsSimulatorProps {
  characters: Character[];
  memories: Memory[];
  onSelectCharacter: (char: Character) => void;
}

interface TeamSlotState {
  characterId: string;
  memoryId: string | null;
  selectedAction: 'na' | 'skill2' | 'skill3' | 'ult';
  skillLevel: 1 | 10;
}

function parseStatNum(val: string | number | undefined): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/[^\d]/g, '');
  return parseInt(clean, 10) || 0;
}

function parseStatPercent(str?: string): number {
  if (!str) return 0;
  const match = str.match(/(\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
}

function getElementalFactor(charElem: string, targetElem: string): number {
  const norm = (el: string) => {
    const s = el.toLowerCase();
    if (s.includes('blue') || s.includes('幻') || s.includes('azul')) return 'blue';
    if (s.includes('red') || s.includes('夜') || s.includes('vermelho')) return 'red';
    if (s.includes('green') || s.includes('影') || s.includes('verde')) return 'green';
    if (s.includes('yellow') || s.includes('行') || s.includes('amarelo')) return 'yellow';
    return 'other';
  };
  const a = norm(charElem);
  const b = norm(targetElem);
  if (a === b || a === 'yellow' || b === 'yellow' || a === 'other' || b === 'other') return 1.0;
  if ((a === 'blue' && b === 'red') || (a === 'red' && b === 'green') || (a === 'green' && b === 'blue')) return 1.5;
  return 0.7;
}

export const TeamDpsSimulator: React.FC<TeamDpsSimulatorProps> = ({
  characters,
  memories,
  onSelectCharacter,
}) => {
  const { language } = useTranslation();

  // Find 4 solid initial characters (SSR priority)
  const defaultTeam = useMemo(() => {
    const ssrs = characters.filter(c => c.rarity === 'SSR');
    return [
      ssrs[0] || characters[0],
      ssrs[1] || characters[1],
      ssrs[2] || characters[2],
      ssrs[3] || characters[3],
    ];
  }, [characters]);

  const [teamSlots, setTeamSlots] = useState<TeamSlotState[]>([
    { characterId: defaultTeam[0]?.id || '', memoryId: null, selectedAction: 'ult', skillLevel: 10 },
    { characterId: defaultTeam[1]?.id || '', memoryId: null, selectedAction: 'ult', skillLevel: 10 },
    { characterId: defaultTeam[2]?.id || '', memoryId: null, selectedAction: 'ult', skillLevel: 10 },
    { characterId: defaultTeam[3]?.id || '', memoryId: null, selectedAction: 'skill3', skillLevel: 10 },
  ]);

  // Target Enemy Settings
  const [targetElement, setTargetElement] = useState<string>('Red');
  const [isEnemyBreak, setIsEnemyBreak] = useState<boolean>(false);
  const [isKokusenActive, setIsKokusenActive] = useState<boolean>(true);

  // Modal State
  const [modalSlotIndex, setModalSlotIndex] = useState<number | null>(null);
  const [modalType, setModalType] = useState<'character' | 'memory' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1-Click Equip BiS on entire team
  const handleAutoEquipTeamBiS = () => {
    playSelect();
    setTeamSlots(prev =>
      prev.map(slot => {
        const char = characters.find(c => c.id === slot.characterId);
        if (!char) return slot;
        const bis = getBestInSlotMemory(char, memories);
        return { ...slot, memoryId: bis?.id || null };
      })
    );
  };

  // 1-Click Set all to Ultimate
  const handleAllUlts = () => {
    playUltimateSkill();
    setTeamSlots(prev => prev.map(s => ({ ...s, selectedAction: 'ult' })));
  };

  // Calculate Party-wide Buffs from active skills & memories
  const partyBuffs = useMemo(() => {
    let partyDmgBuff = 0;
    let partyTaiBuff = 0;
    let partyJujuBuff = 0;

    teamSlots.forEach(slot => {
      const char = characters.find(c => c.id === slot.characterId);
      const mem = memories.find(m => m.id === slot.memoryId);

      // Character passives party buffs
      (char?.auto_skills || char?.passives || []).forEach(p => {
        const desc = (p.sp_description || p.description || '').toLowerCase();
        if (desc.includes('all allies') || desc.includes('aliados')) {
          const m = desc.match(/(\d+(?:\.\d+)?)%\s*(?:damage dealt|dano)/i);
          if (m) partyDmgBuff += parseFloat(m[1]) || 0;
        }
      });

      // Memory active party buffs
      if (mem?.active_skill?.description) {
        const d = mem.active_skill.description.toLowerCase();
        if (d.includes('all') && d.includes('allies')) {
          const m = d.match(/(\d+(?:\.\d+)?)%\s*damage/i);
          if (m) partyDmgBuff += parseFloat(m[1]) || 0;
        }
      }
    });

    if (isEnemyBreak) partyDmgBuff += 50;

    return { partyDmgBuff, partyTaiBuff, partyJujuBuff };
  }, [teamSlots, characters, memories, isEnemyBreak]);

  // Compute individual and combined team damage
  const teamDamageResults = useMemo(() => {
    let ultCount = 0;

    const individualResults = teamSlots.map((slot) => {
      const char = characters.find(c => c.id === slot.characterId);
      if (!char) return { damage: 0, charName: 'Vazio', multiplier: 0, power: 0, elemBonus: 1 };

      const mem = memories.find(m => m.id === slot.memoryId);
      const memTaiPct = parseStatPercent(mem?.stats?.taijutsu);
      const memJujPct = parseStatPercent(mem?.stats?.jujutsu);

      const baseTai = parseStatNum(char.stats?.attack);
      const baseJuj = parseStatNum(char.stats?.jujutsu);

      const effTai = baseTai * (1 + (memTaiPct + partyBuffs.partyTaiBuff) / 100);
      const effJuj = baseJuj * (1 + (memJujPct + partyBuffs.partyJujuBuff) / 100);

      const isTaijutsuFocus = (char.focus || '').toLowerCase().includes('taijutsu');
      const power = isTaijutsuFocus ? effTai : Math.max(effTai, effJuj);

      // Skill Multiplier Extraction
      let multiplier = 200; // default skill 2/3
      if (slot.selectedAction === 'na') {
        multiplier = 100;
      } else if (slot.selectedAction === 'ult') {
        ultCount++;
        const ultText = (slot.skillLevel === 10 ? char.ultimate?.description_10 : char.ultimate?.description) || char.ultimate?.description || '';
        const allMatches = [...ultText.matchAll(/(\d+(?:\.\d+)?)%/g)].map(m => parseFloat(m[1]));
        const big = allMatches.filter(n => n >= 250);
        multiplier = big.length > 0 ? Math.max(...big) : 1200;
      } else if (slot.selectedAction === 'skill2') {
        const s = char.skills?.[0];
        const t = (slot.skillLevel === 10 ? s?.description_10 : s?.description) || s?.description || '';
        const m = t.match(/(\d+(?:\.\d+)?)%/);
        multiplier = m ? parseFloat(m[1]) : 240;
      } else {
        const s = char.skills?.[1];
        const t = (slot.skillLevel === 10 ? s?.description_10 : s?.description) || s?.description || '';
        const m = t.match(/(\d+(?:\.\d+)?)%/);
        multiplier = m ? parseFloat(m[1]) : 320;
      }

      const elemFactor = getElementalFactor(char.element, targetElement);
      const dmgBonus = 1 + partyBuffs.partyDmgBuff / 100;
      const kokusenBonus = isKokusenActive ? 1.4 : 1.0;

      const rawDamage = Math.round(power * (multiplier / 100) * elemFactor * dmgBonus * kokusenBonus);

      return {
        damage: rawDamage,
        charName: char.name,
        multiplier,
        power: Math.round(power),
        elemBonus: elemFactor,
      };
    });

    // Combo Ultimate Bonus: +15% per ult when 2+ characters trigger Ultimate in same turn
    const comboMultiplier = ultCount >= 2 ? 1 + (ultCount * 0.1) : 1.0;
    const totalBaseDamage = individualResults.reduce((acc, r) => acc + r.damage, 0);
    const finalTotalBurst = Math.round(totalBaseDamage * comboMultiplier);

    return {
      individual: individualResults,
      ultCount,
      comboMultiplier,
      finalTotalBurst,
    };
  }, [teamSlots, characters, memories, partyBuffs, targetElement, isKokusenActive]);

  // Modal Filtering
  const filteredModalCharacters = useMemo(() => {
    if (!searchQuery) return characters;
    const q = searchQuery.toLowerCase();
    return characters.filter(c => c.name.toLowerCase().includes(q) || c.epithet?.toLowerCase().includes(q));
  }, [characters, searchQuery]);

  const filteredModalMemories = useMemo(() => {
    if (!searchQuery) return memories;
    const q = searchQuery.toLowerCase();
    return memories.filter(m => m.title.toLowerCase().includes(q));
  }, [memories, searchQuery]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Strategy Controls */}
      <div className="bg-[#110c24] border border-[#271d44] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#201738] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-600/40 text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-serif">
                {language === 'pt' ? 'ROTAÇÃO TÁTICA DE TIME (4 FEITICEIROS)' : '4-MAN TEAM ROTATION SIMULATOR'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {language === 'pt'
                ? 'Simulação de dano total da equipe em 1 turno, integrando sinergia de passivas, memórias e bônus de Combo Ultimate.'
                : 'Full party 1-turn burst simulator, aggregating shared passives, memory stats, and Combo Ultimate multipliers.'}
            </p>
          </div>

          {/* 1-Click Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoEquipTeamBiS}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Equipa a memória com maior pontuação tática para cada um dos 4 feiticeiros"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>{language === 'pt' ? 'Auto BiS (Time Inteiro)' : 'Auto BiS (Full Team)'}</span>
            </button>

            <button
              onClick={handleAllUlts}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              <span>{language === 'pt' ? 'Combo Máximo (4 Ultimates)' : 'Max Burst (4 Ultimates)'}</span>
            </button>
          </div>
        </div>

        {/* Global Environmental Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Target Element */}
          <div className="bg-[#0b0818] border border-[#201738] rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">
              {language === 'pt' ? 'Elemento do Inimigo' : 'Enemy Element'}:
            </span>
            <div className="flex items-center gap-1">
              {['Blue', 'Red', 'Green', 'Yellow'].map(el => (
                <button
                  key={el}
                  onClick={() => {
                    playElementalTone(el);
                    setTargetElement(el);
                  }}
                  className={`px-2 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                    targetElement === el
                      ? 'bg-purple-600 text-white ring-1 ring-purple-400'
                      : 'bg-[#160f2e] text-gray-400 hover:text-white'
                  }`}
                >
                  {el[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Break Status */}
          <button
            onClick={() => {
              playClick();
              setIsEnemyBreak(!isEnemyBreak);
            }}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              isEnemyBreak
                ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                : 'bg-[#0b0818] border-[#201738] text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-xs font-bold">
              {language === 'pt' ? 'Inimigo em Break (+50% Dano)' : 'Enemy in Break (+50% DMG)'}
            </span>
            {isEnemyBreak ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4" />}
          </button>

          {/* Kokusen Trigger */}
          <button
            onClick={() => {
              playBlackFlash();
              setIsKokusenActive(!isKokusenActive);
            }}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              isKokusenActive
                ? 'bg-red-950/80 border-red-500 text-red-200 shadow-sm'
                : 'bg-[#0b0818] border-[#201738] text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>{language === 'pt' ? 'Impacto Kokusen (+40%)' : 'Black Flash Strike (+40%)'}</span>
            </span>
            {isKokusenActive ? <CheckSquare className="w-4 h-4 text-red-400" /> : <Square className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4 Team Member Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {teamSlots.map((slot, index) => {
          const char = characters.find(c => c.id === slot.characterId);
          const mem = memories.find(m => m.id === slot.memoryId);
          const result = teamDamageResults.individual[index];

          return (
            <div
              key={index}
              className="bg-[#110c24] border border-[#271d44] rounded-2xl p-4 space-y-4 shadow-xl flex flex-col justify-between"
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between border-b border-[#201738] pb-2.5">
                <span className="text-xs font-mono font-black text-purple-400">
                  SLOT 0{index + 1}
                </span>
                {char && (
                  <button
                    onClick={() => onSelectCharacter(char)}
                    className="text-[11px] text-gray-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    {language === 'pt' ? 'Ver Ficha' : 'Profile'}
                  </button>
                )}
              </div>

              {/* Character Card Info */}
              <div className="flex items-center gap-3">
                <div
                  onClick={() => {
                    playClick();
                    setModalSlotIndex(index);
                    setModalType('character');
                    setSearchQuery('');
                  }}
                  className="w-16 h-16 rounded-xl overflow-hidden bg-black border-2 border-purple-500/50 shrink-0 cursor-pointer relative group"
                  title="Trocar Feiticeiro"
                >
                  <img
                    src={getAssetUrl(char?.image)}
                    alt={char?.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAssetUrl();
                    }}
                  />
                  <div className="absolute inset-0 bg-purple-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[10px] font-black text-white uppercase">Trocar</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {char && <ElementBadge element={char.element} />}
                    {char && <RarityBadge rarity={char.rarity} className="text-[9px] px-1 py-0" />}
                  </div>
                  <h4 className="text-sm font-bold text-white truncate mt-1" title={char?.name}>
                    {char?.name || 'Selecione'}
                  </h4>
                  <button
                    onClick={() => {
                      playClick();
                      setModalSlotIndex(index);
                      setModalType('character');
                      setSearchQuery('');
                    }}
                    className="text-[11px] text-purple-400 hover:underline font-semibold cursor-pointer"
                  >
                    {language === 'pt' ? 'Alterar Feiticeiro' : 'Change Sorcerer'}
                  </button>
                </div>
              </div>

              {/* Equipped Memory Slot */}
              <div className="bg-[#0b0818] border border-[#201738] rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    onClick={() => {
                      playClick();
                      setModalSlotIndex(index);
                      setModalType('memory');
                      setSearchQuery('');
                    }}
                    className="w-9 h-9 rounded-lg overflow-hidden bg-black border border-purple-900/60 shrink-0 cursor-pointer"
                    title="Equipar Lembrança"
                  >
                    {mem ? (
                      <img src={getAssetUrl(mem.image)} alt={mem.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px]">
                        BiS
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Lembrança</span>
                    <span className="text-xs font-bold text-white truncate block" title={mem?.title}>
                      {mem ? mem.title : 'Nenhuma'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {char && (
                    <button
                      onClick={() => {
                        const bis = getBestInSlotMemory(char, memories);
                        if (bis) {
                          playSelect();
                          setTeamSlots(prev =>
                            prev.map((s, idx) => (idx === index ? { ...s, memoryId: bis.id } : s))
                          );
                        }
                      }}
                      className="px-2 py-1 rounded text-[10px] font-black bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                      title="Auto-Equipar BiS"
                    >
                      BiS
                    </button>
                  )}
                  {mem && (
                    <button
                      onClick={() => {
                        playClick();
                        setTeamSlots(prev =>
                          prev.map((s, idx) => (idx === index ? { ...s, memoryId: null } : s))
                        );
                      }}
                      className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Selection (Skill / Ult) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">
                  {language === 'pt' ? 'Ação no Turno' : 'Turn Action'}
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {(['na', 'skill2', 'skill3', 'ult'] as const).map(actionKey => {
                    const isSelected = slot.selectedAction === actionKey;
                    const label = actionKey === 'na' ? 'Atk 1' : actionKey === 'skill2' ? 'Hab 2' : actionKey === 'skill3' ? 'Hab 3' : 'ULT';
                    return (
                      <button
                        key={actionKey}
                        onClick={() => {
                          playClick();
                          setTeamSlots(prev =>
                            prev.map((s, idx) => (idx === index ? { ...s, selectedAction: actionKey } : s))
                          );
                        }}
                        className={`py-1 rounded text-xs font-black border transition-all cursor-pointer ${
                          isSelected
                            ? actionKey === 'ult'
                              ? 'bg-amber-950 border-amber-500 text-amber-300 ring-1 ring-amber-400'
                              : 'bg-purple-600 border-purple-400 text-white'
                            : 'bg-[#150f2c] border-[#22183d] text-gray-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot Damage Metric */}
              <div className="bg-[#0b0818] border border-purple-900/40 rounded-xl p-3 text-center space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {language === 'pt' ? 'Dano do Feiticeiro' : 'Sorcerer Damage'}
                </span>
                <div className="text-xl font-mono font-black text-amber-400 drop-shadow-sm">
                  {result?.damage.toLocaleString('pt-BR')}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  {result?.multiplier}% Mult • {result?.elemBonus > 1 ? '⚔️ +50% Vantagem' : result?.elemBonus < 1 ? '⚠️ -30% Desvantagem' : '⚖️ Neutro'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Massive Team Burst Scoreboard */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-950 via-[#180f33] to-red-950 border-2 border-purple-500/50 p-6 sm:p-8 shadow-2xl text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-black uppercase tracking-widest text-amber-300">
            {language === 'pt' ? 'DANO TOTAL COMBINADO DA ROTAÇÃO (BURST DPS)' : 'TOTAL COMBINED TEAM BURST DPS'}
          </span>
        </div>

        <div className="text-4xl sm:text-6xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-red-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]">
          {teamDamageResults.finalTotalBurst.toLocaleString('pt-BR')}
        </div>

        {/* Combo Multiplier Banner */}
        {teamDamageResults.ultCount >= 2 ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-500 text-amber-200 text-xs font-black shadow-md animate-pulse">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>
              COMBO ULTIMATE x{teamDamageResults.ultCount} • +{Math.round((teamDamageResults.comboMultiplier - 1) * 100)}% BÔNUS DE DANO DE EQUIPE
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 font-medium">
            💡 {language === 'pt' ? 'Ative a Ultimate de 2 ou mais feiticeiros para ativar o bônus oficial de Combo Ultimate!' : 'Activate Ultimate on 2+ sorcerers to trigger the official Combo Ultimate bonus!'}
          </div>
        )}

        {/* Contribution Bar */}
        <div className="pt-2 max-w-xl mx-auto space-y-1.5">
          <div className="h-2.5 rounded-full overflow-hidden bg-black/60 flex border border-purple-900/60">
            {teamDamageResults.individual.map((res, idx) => {
              const pct = teamDamageResults.finalTotalBurst > 0 ? (res.damage / (teamDamageResults.finalTotalBurst / teamDamageResults.comboMultiplier)) * 100 : 25;
              const colors = ['bg-purple-500', 'bg-red-500', 'bg-blue-500', 'bg-amber-500'];
              return (
                <div
                  key={idx}
                  className={`h-full ${colors[idx]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${res.charName}: ${Math.round(pct)}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-mono">
            {teamDamageResults.individual.map((res, idx) => (
              <span key={idx} className="truncate max-w-[100px]">
                {res.charName.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Character / Memory Selection Modal */}
      {modalType && modalSlotIndex !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#120d24] border border-[#271d44] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#201838] flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {modalType === 'character'
                  ? (language === 'pt' ? `Escolher Feiticeiro para o Slot ${modalSlotIndex + 1}` : `Choose Sorcerer for Slot ${modalSlotIndex + 1}`)
                  : (language === 'pt' ? `Escolher Lembrança para o Slot ${modalSlotIndex + 1}` : `Choose Memory for Slot ${modalSlotIndex + 1}`)}
              </h3>
              <button
                onClick={() => {
                  setModalType(null);
                  setModalSlotIndex(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-[#201838] bg-[#0c0819]">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={modalType === 'character' ? 'Buscar feiticeiro por nome...' : 'Buscar lembrança...'}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#17102e] border border-purple-900/60 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {modalType === 'character' ? (
                filteredModalCharacters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => {
                      playSelect();
                      setTeamSlots(prev =>
                        prev.map((s, idx) => (idx === modalSlotIndex ? { ...s, characterId: char.id } : s))
                      );
                      setModalType(null);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-purple-950 bg-[#150f2a] hover:border-purple-500 hover:bg-[#1e1438] transition-all text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black border border-purple-800/40 shrink-0">
                      <img src={getAssetUrl(char.image)} alt={char.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <ElementBadge element={char.element} />
                        <RarityBadge rarity={char.rarity} className="text-[9px] px-1.5 py-0" />
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-1">{char.name}</div>
                    </div>
                  </button>
                ))
              ) : (
                filteredModalMemories.map(mem => (
                  <button
                    key={mem.id}
                    onClick={() => {
                      playSelect();
                      setTeamSlots(prev =>
                        prev.map((s, idx) => (idx === modalSlotIndex ? { ...s, memoryId: mem.id } : s))
                      );
                      setModalType(null);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl border border-purple-950 bg-[#150f2a] hover:border-purple-500 hover:bg-[#1e1438] transition-all text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black border border-purple-800/40 shrink-0">
                      <img src={getAssetUrl(mem.image)} alt={mem.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <RarityBadge rarity={mem.rarity} className="text-[9px] px-1.5 py-0 mb-1" />
                      <div className="text-xs font-bold text-white line-clamp-2">{mem.title}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
