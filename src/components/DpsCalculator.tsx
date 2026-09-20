import React, { useState, useMemo } from 'react';
import type { Character, Memory } from '../types';
import { ElementBadge, RarityBadge } from './Badges';
import { 
  Calculator, 
  Flame, 
  ShieldAlert, 
  Zap, 
  Sparkles, 
  Search, 
  X, 
  Sliders
} from 'lucide-react';
import { useTranslation, translateRole } from '../i18n';
import { 
  playClick, 
  playSelect, 
  playBlackFlash, 
  playUltimateSkill, 
  playElementalTone 
} from '../utils/sound';
import { getAssetUrl, getSkillIconUrl } from '../utils/assets';

interface DpsCalculatorProps {
  characters: Character[];
  memories: Memory[];
  onSelectCharacter: (char: Character) => void;
}

// Elemental advantage calculation
function getElementalFactor(charElem: string, targetElem: string): { factor: number; label: string; tag: string } {
  const normalize = (el: string) => {
    const s = el.toLowerCase();
    if (s.includes('blue') || s.includes('幻') || s.includes('azul')) return 'blue';
    if (s.includes('red') || s.includes('夜') || s.includes('vermelho')) return 'red';
    if (s.includes('green') || s.includes('影') || s.includes('verde')) return 'green';
    if (s.includes('yellow') || s.includes('行') || s.includes('amarelo')) return 'yellow';
    return 'other';
  };
  const a = normalize(charElem);
  const b = normalize(targetElem);

  if (a === b || a === 'yellow' || b === 'yellow' || a === 'other' || b === 'other') {
    return { factor: 1.0, label: 'Neutro (1.0x)', tag: 'neutral' };
  }
  if (
    (a === 'blue' && b === 'red') ||
    (a === 'red' && b === 'green') ||
    (a === 'green' && b === 'blue')
  ) {
    return { factor: 1.5, label: 'Vantagem Elemental (+50% Dano)', tag: 'advantage' };
  }
  return { factor: 0.7, label: 'Desvantagem Elemental (-30% Dano)', tag: 'disadvantage' };
}

function parseNumber(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/[^\d]/g, '');
  return parseInt(clean, 10) || 0;
}

// Extract multiplier percentage from skill description
function extractSkillMultipliers(desc?: string, desc10?: string, level: number = 10) {
  const text = (level === 10 && desc10) ? desc10 : (desc || desc10 || '');
  if (!text) return { taijutsuPct: 0, jujutsuPct: 0, isDirectDamage: false };

  let taijutsuPct = 0;
  let jujutsuPct = 0;
  let isDirectDamage = false;

  // Regex to match "X% of Taijutsu" or "X% of Jujutsu"
  const taiMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?Taijutsu/gi)];
  if (taiMatches.length > 0) {
    const val = parseFloat(taiMatches[taiMatches.length - 1][1]);
    if (!isNaN(val)) {
      taijutsuPct = val;
      isDirectDamage = true;
    }
  }

  const jujuMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?Jujutsu/gi)];
  if (jujuMatches.length > 0) {
    const val = parseFloat(jujuMatches[jujuMatches.length - 1][1]);
    if (!isNaN(val)) {
      jujutsuPct = val;
      isDirectDamage = true;
    }
  }

  return { taijutsuPct, jujutsuPct, isDirectDamage };
}

export const DpsCalculator: React.FC<DpsCalculatorProps> = ({ 
  characters, 
  memories 
}) => {
  const { t, language } = useTranslation();

  // Selected Attacker (defaults to Gojo Satoru or first SSR)
  const defaultChar = useMemo(() => {
    return (
      characters.find(c => c.name.includes('Gojo') && c.rarity === 'SSR') ||
      characters.find(c => c.rarity === 'SSR') ||
      characters[0]
    );
  }, [characters]);

  const [attackerId, setAttackerId] = useState<string>(defaultChar?.id || '');
  const attacker = useMemo(() => characters.find(c => c.id === attackerId) || defaultChar, [characters, attackerId, defaultChar]);

  // Selected Memory
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const selectedMemory = useMemo(() => memories.find(m => m.id === memoryId) || null, [memories, memoryId]);

  // Selected Skill Slot ('na' | 'skill2' | 'skill3' | 'ult')
  const [selectedSlot, setSelectedSlot] = useState<'na' | 'skill2' | 'skill3' | 'ult'>('ult');
  const [skillLevel, setSkillLevel] = useState<number>(10);

  // Manual multiplier override (if skill is non-damaging buff or user wants custom)
  const [customMultiplier, setCustomMultiplier] = useState<number>(100);

  // Buffs Sliders
  const [taijutsuBuff, setTaijutsuBuff] = useState<number>(0);
  const [jujutsuBuff, setJujutsuBuff] = useState<number>(0);
  const [damageDealtBuff, setDamageDealtBuff] = useState<number>(0);
  const [elementalBuff, setElementalBuff] = useState<number>(0);

  // Target Enemy Settings
  const [targetElement, setTargetElement] = useState<string>('Red');
  const [targetDefense, setTargetDefense] = useState<number>(0); // 0% (Dummy), 15% (Story), 35% (Raid Boss)
  const [enemyDebuff, setEnemyDebuff] = useState<number>(0); // Damage taken increase

  // Modals
  const [isCharModalOpen, setIsCharModalOpen] = useState<boolean>(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const [charSearch, setCharSearch] = useState<string>('');
  const [memorySearch, setMemorySearch] = useState<string>('');

  // Selected Skill Object & Description
  const currentSkillData = useMemo(() => {
    if (!attacker) return null;
    if (selectedSlot === 'na') {
      return {
        name: attacker.normal_attack?.name || 'Ataque Normal',
        icon: attacker.normal_attack?.icon || attacker.normal_attack?.image_key,
        desc: attacker.normal_attack?.description,
        desc10: attacker.normal_attack?.description_10,
        cost: '0',
      };
    } else if (selectedSlot === 'skill2') {
      const sk = attacker.skills?.[0];
      return {
        name: sk?.name || 'Skill 2',
        icon: sk?.icon || sk?.image_key,
        desc: sk?.description,
        desc10: sk?.description_10,
        cost: sk?.cost || '0',
      };
    } else if (selectedSlot === 'skill3') {
      const sk = attacker.skills?.[1];
      return {
        name: sk?.name || 'Skill 3',
        icon: sk?.icon || sk?.image_key,
        desc: sk?.description,
        desc10: sk?.description_10,
        cost: sk?.cost || '0',
      };
    } else {
      return {
        name: attacker.ultimate?.name || 'Técnica Suprema',
        icon: attacker.ultimate?.icon || attacker.ultimate?.image_key,
        desc: attacker.ultimate?.description,
        desc10: attacker.ultimate?.description_10,
        cost: `Gauge ${attacker.stats?.special_gauge || '1000'}`,
      };
    }
  }, [attacker, selectedSlot]);

  // Skill scaling extraction
  const { taijutsuPct, jujutsuPct, isDirectDamage } = useMemo(() => {
    if (!currentSkillData) return { taijutsuPct: 0, jujutsuPct: 0, isDirectDamage: false };
    return extractSkillMultipliers(currentSkillData.desc, currentSkillData.desc10, skillLevel);
  }, [currentSkillData, skillLevel]);

  // Apply Presets
  const applyPreset = (type: 'pure' | 'standard' | 'burst') => {
    playClick();
    if (type === 'pure') {
      setTaijutsuBuff(0);
      setJujutsuBuff(0);
      setDamageDealtBuff(0);
      setElementalBuff(0);
      setEnemyDebuff(0);
    } else if (type === 'standard') {
      setTaijutsuBuff(30);
      setJujutsuBuff(30);
      setDamageDealtBuff(20);
      setElementalBuff(10);
      setEnemyDebuff(15);
    } else {
      setTaijutsuBuff(80);
      setJujutsuBuff(80);
      setDamageDealtBuff(60);
      setElementalBuff(35);
      setEnemyDebuff(40);
    }
  };

  // Memory stats contribution
  const memoryTaijutsuBonus = useMemo(() => {
    if (!selectedMemory) return 0;
    const clean = String(selectedMemory.stats?.taijutsu || '').replace(/[^\d.]/g, '');
    return parseFloat(clean) || 0;
  }, [selectedMemory]);

  const memoryJujutsuBonus = useMemo(() => {
    if (!selectedMemory) return 0;
    const clean = String(selectedMemory.stats?.jujutsu || '').replace(/[^\d.]/g, '');
    return parseFloat(clean) || 0;
  }, [selectedMemory]);

  // Base stats of attacker
  const baseTaijutsu = useMemo(() => parseNumber(attacker?.stats?.attack), [attacker]);
  const baseJujutsu = useMemo(() => parseNumber(attacker?.stats?.jujutsu), [attacker]);

  // Effective attack power with buffs & memories
  const effectiveTaijutsu = useMemo(() => {
    const memMult = 1 + memoryTaijutsuBonus / 100;
    const buffMult = 1 + taijutsuBuff / 100;
    return Math.round(baseTaijutsu * memMult * buffMult);
  }, [baseTaijutsu, memoryTaijutsuBonus, taijutsuBuff]);

  const effectiveJujutsu = useMemo(() => {
    const memMult = 1 + memoryJujutsuBonus / 100;
    const buffMult = 1 + jujutsuBuff / 100;
    return Math.round(baseJujutsu * memMult * buffMult);
  }, [baseJujutsu, memoryJujutsuBonus, jujutsuBuff]);

  // Elemental factor
  const elementalMatch = useMemo(() => {
    if (!attacker) return { factor: 1.0, label: 'Neutro', tag: 'neutral' };
    return getElementalFactor(attacker.element, targetElement);
  }, [attacker, targetElement]);

  // Final Damage Calculations
  const calculatedDamage = useMemo(() => {
    // Determine which multiplier to use
    let activeTaiPct = taijutsuPct;
    let activeJujuPct = jujutsuPct;

    if (!isDirectDamage) {
      // If no explicit percentage was found, scale with primary focus using customMultiplier
      if (attacker?.focus?.toLowerCase().includes('taijutsu')) {
        activeTaiPct = customMultiplier;
      } else if (attacker?.focus?.toLowerCase().includes('jujutsu')) {
        activeJujuPct = customMultiplier;
      } else {
        activeTaiPct = customMultiplier / 2;
        activeJujuPct = customMultiplier / 2;
      }
    }

    // Raw damage scaling
    const rawDamage = (effectiveTaijutsu * activeTaiPct / 100) + (effectiveJujutsu * activeJujuPct / 100);

    // Multipliers
    const dmgDealtMult = 1 + damageDealtBuff / 100;
    const elemMult = elementalMatch.factor * (1 + elementalBuff / 100);
    const defenseReduction = Math.max(0, 1 - targetDefense / 100);
    const debuffMult = 1 + enemyDebuff / 100;

    const normal = Math.round(rawDamage * dmgDealtMult * elemMult * defenseReduction * debuffMult);
    const crit = Math.round(normal * 1.50); // +50% Crit DMG standard
    const blackFlash = Math.round(normal * 2.75); // Kokusen Black Flash multiplier

    // 3-Turn Rotation estimation (Skill 2 -> Skill 3 -> Ultimate)
    const rotationEstimate = Math.round(normal * 3.4);

    return {
      normal,
      crit,
      blackFlash,
      rotationEstimate,
      rawDamage: Math.round(rawDamage),
      activeTaiPct,
      activeJujuPct,
    };
  }, [
    effectiveTaijutsu, 
    effectiveJujutsu, 
    taijutsuPct, 
    jujutsuPct, 
    isDirectDamage, 
    customMultiplier, 
    attacker, 
    damageDealtBuff, 
    elementalMatch, 
    elementalBuff, 
    targetDefense, 
    enemyDebuff
  ]);

  // Filtered lists for modals
  const filteredCharacters = useMemo(() => {
    const q = charSearch.toLowerCase();
    return characters.filter(c => !q || c.name.toLowerCase().includes(q) || (c.epithet && c.epithet.toLowerCase().includes(q)));
  }, [characters, charSearch]);

  const filteredMemories = useMemo(() => {
    const q = memorySearch.toLowerCase();
    return memories.filter(m => !q || m.title.toLowerCase().includes(q));
  }, [memories, memorySearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#251b40] pb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-600/40 text-purple-400">
            <Calculator className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300">
            {t.dps.title}
          </h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {t.dps.subtitle}
        </p>
      </div>

      {/* Main Grid: Left Config Panel (2/3), Right Output Panel (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Attacker, Skills, Memory, Buffs, Target */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Attacker & Memory Setup Card */}
          <div className="bg-[#120d24] border border-[#271d44] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#201838] pb-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>{t.dps.selectAttacker}</span>
              </span>
              <button
                onClick={() => {
                  playClick();
                  setIsCharModalOpen(true);
                }}
                className="text-xs font-bold text-purple-400 hover:text-white transition-colors cursor-pointer"
              >
                {t.dps.changeAttacker} ⇄
              </button>
            </div>

            {/* Attacker Card Preview */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#0a0718] border-2 border-purple-500/60 shrink-0 shadow-lg relative">
                <img 
                  src={getAssetUrl(attacker.image)} 
                  alt={attacker.name} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-1 right-1">
                  <RarityBadge rarity={attacker.rarity} className="text-[9px] px-1.5 py-0" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <ElementBadge element={attacker.element} />
                  <span className="text-xs text-gray-400">{translateRole(attacker.role, language)}</span>
                </div>
                <h3 className="text-lg font-black text-white">{attacker.name}</h3>
                {attacker.epithet && (
                  <p className="text-xs text-purple-300/80 italic">{attacker.epithet}</p>
                )}

                {/* Base Stats Row */}
                <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 font-mono text-xs">
                  <span className="text-red-400 font-bold">
                    Taijutsu: {baseTaijutsu.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-blue-400 font-bold">
                    Jujutsu: {baseJujutsu.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Memory Slot */}
            <div className="pt-3 border-t border-[#1e1638] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#070412] border border-purple-900/50 shrink-0 flex items-center justify-center">
                  {selectedMemory ? (
                    <img src={getAssetUrl(selectedMemory.image)} alt={selectedMemory.title} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">{t.dps.equipMemory}</span>
                  <span className="text-xs font-bold text-white line-clamp-1">
                    {selectedMemory ? selectedMemory.title : t.dps.noMemory}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedMemory && (
                  <button
                    onClick={() => {
                      playClick();
                      setMemoryId(null);
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-400 text-xs cursor-pointer"
                    title="Remover Lembrança"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    playClick();
                    setIsMemoryModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1a1236] hover:bg-purple-900/40 border border-purple-900/60 text-purple-300 hover:text-white transition-all cursor-pointer"
                >
                  {t.dps.changeMemory}
                </button>
              </div>
            </div>
          </div>

          {/* Skill Selection & Level Toggle */}
          <div className="bg-[#120d24] border border-[#271d44] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#201838] pb-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300">
                {t.dps.selectTechnique}
              </span>

              {/* Level 1 vs 10 */}
              <div className="flex items-center gap-1 bg-[#0c0819] p-1 rounded-lg border border-purple-900/50 text-xs">
                <button
                  onClick={() => {
                    playClick();
                    setSkillLevel(1);
                  }}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    skillLevel === 1 ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Lv. 1
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setSkillLevel(10);
                  }}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    skillLevel === 10 ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Lv. 10
                </button>
              </div>
            </div>

            {/* Skill Slots Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  playClick();
                  setSelectedSlot('na');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedSlot === 'na' 
                    ? 'bg-purple-950/70 border-purple-400 text-white shadow-md' 
                    : 'bg-[#150e29] border-purple-950 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] uppercase font-bold block">Skill 1</span>
                <span className="text-xs font-bold line-clamp-1">{attacker.normal_attack?.name || 'Ataque'}</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setSelectedSlot('skill2');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedSlot === 'skill2' 
                    ? 'bg-purple-950/70 border-purple-400 text-white shadow-md' 
                    : 'bg-[#150e29] border-purple-950 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] uppercase font-bold block">Skill 2</span>
                <span className="text-xs font-bold line-clamp-1">{attacker.skills?.[0]?.name || 'Skill 2'}</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setSelectedSlot('skill3');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedSlot === 'skill3' 
                    ? 'bg-purple-950/70 border-purple-400 text-white shadow-md' 
                    : 'bg-[#150e29] border-purple-950 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] uppercase font-bold block">Skill 3</span>
                <span className="text-xs font-bold line-clamp-1">{attacker.skills?.[1]?.name || 'Skill 3'}</span>
              </button>

              <button
                onClick={() => {
                  playUltimateSkill();
                  setSelectedSlot('ult');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedSlot === 'ult' 
                    ? 'bg-amber-950/70 border-amber-400 text-amber-300 shadow-md' 
                    : 'bg-[#150e29] border-purple-950 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Ultimate</span>
                <span className="text-xs font-bold line-clamp-1">{attacker.ultimate?.name || 'Suprema'}</span>
              </button>
            </div>

            {/* Active Skill Preview & Scaling Info */}
            {currentSkillData && (
              <div className="bg-[#0b0717] p-3.5 rounded-xl border border-purple-950 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#070412] border border-purple-800/40 shrink-0">
                    <img 
                      src={getSkillIconUrl(currentSkillData.icon)} 
                      alt={currentSkillData.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{currentSkillData.name}</h4>
                    <span className="text-[11px] text-purple-400 font-mono">{currentSkillData.cost}</span>
                  </div>
                </div>

                {isDirectDamage ? (
                  <div className="flex items-center gap-3 text-xs font-mono pt-1">
                    {taijutsuPct > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/40 font-bold">
                        Taijutsu: {taijutsuPct}%
                      </span>
                    )}
                    {jujutsuPct > 0 && (
                      <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold">
                        Jujutsu: {jujutsuPct}%
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] text-yellow-400 block">
                      ⚠️ Técnica de suporte detectada. Ajuste o multiplicador desejado:
                    </span>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="50" 
                        max="800" 
                        step="10"
                        value={customMultiplier} 
                        onChange={(e) => setCustomMultiplier(parseInt(e.target.value, 10))}
                        className="flex-1 accent-purple-500 cursor-pointer" 
                      />
                      <span className="font-mono text-xs font-bold text-purple-300 w-12 text-right">
                        {customMultiplier}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buffs & Modifiers Panel */}
          <div className="bg-[#120d24] border border-[#271d44] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#201838] pb-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>{t.dps.buffsPanel}</span>
              </span>

              {/* Presets */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => applyPreset('pure')}
                  className="px-2 py-1 rounded bg-[#160f2b] border border-purple-950 text-gray-400 hover:text-white cursor-pointer"
                >
                  {t.dps.presetPure}
                </button>
                <button
                  onClick={() => applyPreset('standard')}
                  className="px-2 py-1 rounded bg-[#160f2b] border border-purple-950 text-purple-300 hover:text-white cursor-pointer"
                >
                  {t.dps.presetStandard}
                </button>
                <button
                  onClick={() => applyPreset('burst')}
                  className="px-2 py-1 rounded bg-gradient-to-r from-red-950 to-purple-950 border border-red-800/60 text-red-300 hover:text-white cursor-pointer font-bold"
                >
                  {t.dps.presetBurst}
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-gray-300 font-semibold mb-1">
                  <span>{t.dps.taijutsuBuff}</span>
                  <span className="font-mono text-red-400 font-bold">+{taijutsuBuff}%</span>
                </div>
                <input 
                  type="range" min="0" max="150" value={taijutsuBuff} 
                  onChange={(e) => setTaijutsuBuff(parseInt(e.target.value, 10))} 
                  className="w-full accent-red-500 cursor-pointer" 
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-300 font-semibold mb-1">
                  <span>{t.dps.jujutsuBuff}</span>
                  <span className="font-mono text-blue-400 font-bold">+{jujutsuBuff}%</span>
                </div>
                <input 
                  type="range" min="0" max="150" value={jujutsuBuff} 
                  onChange={(e) => setJujutsuBuff(parseInt(e.target.value, 10))} 
                  className="w-full accent-blue-500 cursor-pointer" 
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-300 font-semibold mb-1">
                  <span>{t.dps.damageDealtBuff}</span>
                  <span className="font-mono text-purple-300 font-bold">+{damageDealtBuff}%</span>
                </div>
                <input 
                  type="range" min="0" max="150" value={damageDealtBuff} 
                  onChange={(e) => setDamageDealtBuff(parseInt(e.target.value, 10))} 
                  className="w-full accent-purple-500 cursor-pointer" 
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-300 font-semibold mb-1">
                  <span>{t.dps.elementalDmgBuff}</span>
                  <span className="font-mono text-emerald-400 font-bold">+{elementalBuff}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={elementalBuff} 
                  onChange={(e) => setElementalBuff(parseInt(e.target.value, 10))} 
                  className="w-full accent-emerald-500 cursor-pointer" 
                />
              </div>
            </div>
          </div>

          {/* Enemy / Target Configuration */}
          <div className="bg-[#120d24] border border-[#271d44] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300 flex items-center gap-1.5 border-b border-[#201838] pb-3">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>{t.dps.enemyTarget}</span>
            </span>

            {/* Target Element Selector */}
            <div className="space-y-1.5">
              <span className="text-xs text-gray-400 font-semibold block">{t.dps.enemyElement}</span>
              <div className="grid grid-cols-4 gap-2">
                {['Blue', 'Red', 'Green', 'Yellow'].map((el) => (
                  <button
                    key={el}
                    onClick={() => {
                      playElementalTone(el);
                      setTargetElement(el);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      targetElement === el 
                        ? 'bg-purple-900/60 border-purple-400 text-white shadow-md' 
                        : 'bg-[#150e29] border-purple-950 text-gray-400 hover:text-white'
                    }`}
                  >
                    {el}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-gray-300 pt-1 font-semibold">
                Matchup: <span className={
                  elementalMatch.tag === 'advantage' ? 'text-emerald-400 font-bold' :
                  elementalMatch.tag === 'disadvantage' ? 'text-red-400 font-bold' : 'text-gray-400'
                }>{elementalMatch.label}</span>
              </div>
            </div>

            {/* Target Defense Quick Buttons */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs text-gray-400 font-semibold block">{t.dps.targetResistance}</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => { playClick(); setTargetDefense(0); }}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    targetDefense === 0 ? 'bg-purple-900/60 border-purple-400 text-white' : 'bg-[#150e29] border-purple-950 text-gray-400'
                  }`}
                >
                  {t.dps.dummyTarget}
                </button>
                <button
                  onClick={() => { playClick(); setTargetDefense(15); }}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    targetDefense === 15 ? 'bg-purple-900/60 border-purple-400 text-white' : 'bg-[#150e29] border-purple-950 text-gray-400'
                  }`}
                >
                  {t.dps.storyTarget}
                </button>
                <button
                  onClick={() => { playClick(); setTargetDefense(35); }}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    targetDefense === 35 ? 'bg-purple-900/60 border-purple-400 text-white' : 'bg-[#150e29] border-purple-950 text-gray-400'
                  }`}
                >
                  {t.dps.raidBossTarget}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Damage Results Cards & Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Giant Damage Card */}
          <div className="bg-gradient-to-b from-[#1c123d] via-[#120a26] to-[#0c061a] border-2 border-purple-500/60 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] uppercase font-black tracking-widest text-purple-300">
                {t.dps.normalDamage}
              </span>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-indigo-300 font-mono">
                {calculatedDamage.normal.toLocaleString('pt-BR')}
              </div>
              <p className="text-[11px] text-gray-400">
                Dano médio calculado considerando buffs e afinidade.
              </p>
            </div>

            {/* Critical & Black Flash Cards */}
            <div className="space-y-3">
              {/* Critical Hit Card */}
              <div className="bg-[#181033] border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{t.dps.critDamage}</span>
                  </span>
                  <span className="text-[10px] text-gray-400">+50% Dano Crítico</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  {calculatedDamage.crit.toLocaleString('pt-BR')}
                </div>
              </div>

              {/* Black Flash Card (Interactive Click) */}
              <div 
                onClick={() => playBlackFlash()}
                className="group bg-gradient-to-r from-red-950/90 via-black to-red-950/90 border-2 border-red-600/70 hover:border-red-500 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-red-950/60 cursor-pointer transition-all hover:scale-[1.02]"
                title="Clique para ouvir o impacto de Black Flash!"
              >
                <div>
                  <span className="text-xs uppercase font-black tracking-wider text-red-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-500 group-hover:animate-bounce" />
                    <span>{t.dps.blackFlashDamage}</span>
                  </span>
                  <span className="text-[10px] text-red-300/80">Kokusen • Multiplicador Lendário</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-red-400 font-mono drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                  {calculatedDamage.blackFlash.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            {/* 3-Turn Rotation Estimated DPS */}
            <div className="bg-[#0e081e] border border-purple-900/50 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wide block">
                {t.dps.rotationDps}
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                ~{calculatedDamage.rotationEstimate.toLocaleString('pt-BR')}
              </div>
              <span className="text-[10px] text-gray-400 block">
                Estimativa de rotação padrão (3 turnos até a Técnica Suprema).
              </span>
            </div>
          </div>

          {/* Formula Breakdown Card */}
          <div className="bg-[#120d24] border border-[#271d44] rounded-2xl p-5 space-y-3 text-xs shadow-xl">
            <h3 className="text-sm font-black text-purple-200 uppercase tracking-wider border-b border-[#201838] pb-2">
              {t.dps.formulaBreakdown}
            </h3>

            <div className="space-y-2 font-mono">
              <div className="flex justify-between text-gray-300 py-1 border-b border-[#1b1336]">
                <span className="text-gray-400">Taijutsu Efetivo:</span>
                <span className="text-red-400">{effectiveTaijutsu.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-gray-300 py-1 border-b border-[#1b1336]">
                <span className="text-gray-400">Jujutsu Efetivo:</span>
                <span className="text-blue-400">{effectiveJujutsu.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-gray-300 py-1 border-b border-[#1b1336]">
                <span className="text-gray-400">Multiplicador da Habilidade:</span>
                <span className="text-purple-300">
                  {calculatedDamage.activeTaiPct > 0 ? `${calculatedDamage.activeTaiPct}% Tai` : ''}
                  {calculatedDamage.activeTaiPct > 0 && calculatedDamage.activeJujuPct > 0 ? ' + ' : ''}
                  {calculatedDamage.activeJujuPct > 0 ? `${calculatedDamage.activeJujuPct}% Juju` : ''}
                </span>
              </div>
              <div className="flex justify-between text-gray-300 py-1 border-b border-[#1b1336]">
                <span className="text-gray-400">Multiplicador de Dano Geral:</span>
                <span className="text-purple-300">x{(1 + damageDealtBuff / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300 py-1 border-b border-[#1b1336]">
                <span className="text-gray-400">Fator de Afinidade Elemental:</span>
                <span className="text-emerald-400">x{(elementalMatch.factor * (1 + elementalBuff / 100)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300 py-1">
                <span className="text-gray-400">Resistência do Inimigo:</span>
                <span className="text-gray-300">-{targetDefense}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attacker Picker Modal */}
      {isCharModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120c24] border-2 border-purple-500/50 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-[#251b40] flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{t.dps.selectAttacker}</h3>
              <button
                onClick={() => setIsCharModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-[#251b40] bg-[#0c0819]">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={charSearch}
                  onChange={(e) => setCharSearch(e.target.value)}
                  placeholder="Buscar feiticeiro por nome..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#17102e] border border-purple-900/60 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredCharacters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => {
                    playSelect();
                    setAttackerId(char.id);
                    setIsCharModalOpen(false);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-xl border transition-all text-left cursor-pointer group ${
                    char.id === attackerId 
                      ? 'bg-purple-900/50 border-purple-400' 
                      : 'bg-[#150f2a] border-purple-950 hover:border-purple-500 hover:bg-[#1f153a]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#070412] border border-purple-800/40 shrink-0">
                    <img src={getAssetUrl(char.image)} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <RarityBadge rarity={char.rarity} className="text-[9px] px-1.5 py-0" />
                      <span className="text-[10px] text-gray-400 truncate">{char.element}</span>
                    </div>
                    <div className="text-sm font-bold text-white truncate">{char.name}</div>
                    {char.epithet && (
                      <div className="text-[10px] text-purple-300/80 truncate italic">{char.epithet}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Memory Picker Modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120c24] border-2 border-purple-500/50 rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-4 border-b border-[#251b40] flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{t.dps.equipMemory}</h3>
              <button
                onClick={() => setIsMemoryModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-[#251b40] bg-[#0c0819]">
              <div className="relative">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  placeholder="Buscar lembrança por nome..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#17102e] border border-purple-900/60 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredMemories.map((mem) => (
                <button
                  key={mem.id}
                  onClick={() => {
                    playSelect();
                    setMemoryId(mem.id);
                    setIsMemoryModalOpen(false);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-xl border transition-all text-left cursor-pointer group ${
                    mem.id === memoryId 
                      ? 'bg-purple-900/50 border-purple-400' 
                      : 'bg-[#150f2a] border-purple-950 hover:border-purple-500 hover:bg-[#1f153a]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#070412] border border-purple-800/40 shrink-0">
                    <img src={getAssetUrl(mem.image)} alt={mem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <RarityBadge rarity={mem.rarity} className="text-[9px] px-1.5 py-0 mb-1" />
                    <div className="text-xs font-bold text-white line-clamp-2">{mem.title}</div>
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
