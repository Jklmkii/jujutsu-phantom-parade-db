import React, { useState, useMemo } from 'react';
import type { Character, Memory, CombatRates } from '../types';
import { ElementBadge, RarityBadge } from './Badges';
import { 
  Calculator, 
  Flame, 
  ShieldAlert, 
  Zap, 
  Sparkles, 
  Search, 
  X, 
  Sliders,
  CheckSquare,
  Square,
  Clock,
  Swords,
  ChevronDown,
  ChevronUp,
  Users
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
import { getBestInSlotMemory } from '../utils/buildOptimizer';
import { TeamDpsSimulator } from './TeamDpsSimulator';

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

// Extract multiplier percentage and max stack scaling from skill description
function extractSkillMultipliers(desc?: string, desc10?: string, level: number = 10) {
  const text = (level === 10 && desc10) ? desc10 : (desc || desc10 || '');
  if (!text) return { taijutsuPct: 0, jujutsuPct: 0, isDirectDamage: false, maxStackPct: 0, stackResource: '' };

  let taijutsuPct = 0;
  let jujutsuPct = 0;
  let isDirectDamage = false;
  let maxStackPct = 0;
  let stackResource = '';

  // Match "X% of Taijutsu"
  const taiMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?Taijutsu/gi)];
  if (taiMatches.length > 0) {
    const val = parseFloat(taiMatches[taiMatches.length - 1][1]);
    if (!isNaN(val)) {
      taijutsuPct = val;
      isDirectDamage = true;
    }
  }

  // Match "X% of Jujutsu"
  const jujuMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?Jujutsu/gi)];
  if (jujuMatches.length > 0) {
    const val = parseFloat(jujuMatches[jujuMatches.length - 1][1]);
    if (!isNaN(val)) {
      jujutsuPct = val;
      isDirectDamage = true;
    }
  }

  // Match "Max damage 2100% with 250 Cursed Energy" or "up to 2100%"
  const maxMatch = text.match(/(?:Max damage|Máx dano|up to|até)\s*(\d+(?:\.\d+)?)\s*%(?:\s*(?:with|com)\s*(\d+)?\s*([a-zA-Z\s]+))?/i);
  if (maxMatch) {
    const mVal = parseFloat(maxMatch[1]);
    if (!isNaN(mVal) && mVal > Math.max(taijutsuPct, jujutsuPct)) {
      maxStackPct = mVal;
      stackResource = maxMatch[3]?.trim() || 'Stacks';
    }
  }

  return { taijutsuPct, jujutsuPct, isDirectDamage, maxStackPct, stackResource };
}

// Extractor and analyzer for Black Flash (Kokusen) mechanics
interface BlackFlashInfo {
  canBlackFlash: boolean;
  isGuaranteed: boolean;
  rateDisplay: string;
  multiplier: number;
  multiplierDisplay: string;
}

function getBlackFlashInfo(
  attacker: Character | null,
  skillData: { desc?: string; desc10?: string; combatRates?: CombatRates } | null
): BlackFlashInfo {
  if (!attacker || !skillData) {
    return {
      canBlackFlash: false,
      isGuaranteed: false,
      rateDisplay: '0%',
      multiplier: 0,
      multiplierDisplay: 'N/A',
    };
  }

  const desc = (skillData.desc10 || skillData.desc || '').toLowerCase();
  const rawRate = skillData.combatRates?.black_flash || attacker.combat_rates?.black_flash;
  const rawDmg = skillData.combatRates?.black_flash_dmg || attacker.combat_rates?.black_flash_dmg;

  const isGuaranteed =
    desc.includes('guaranteed black flash') ||
    desc.includes('always perform a black flash') ||
    (typeof rawRate === 'string' && rawRate.trim() === '100%');

  let canBlackFlash = false;
  let rateDisplay = '0%';

  if (isGuaranteed) {
    canBlackFlash = true;
    rateDisplay = '100% (Garantido)';
  } else if (rawRate && rawRate !== '0%' && rawRate !== '0.0%' && rawRate !== '0.00%') {
    const matches = [...rawRate.matchAll(/(\d+(?:\.\d+)?)\s*%/g)];
    const nums = matches.map((m) => parseFloat(m[1])).filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    if (maxNum > 0) {
      canBlackFlash = true;
      rateDisplay = rawRate.trim();
    }
  }

  if (!canBlackFlash) {
    return {
      canBlackFlash: false,
      isGuaranteed: false,
      rateDisplay: '0%',
      multiplier: 0,
      multiplierDisplay: 'N/A',
    };
  }

  // Parse accurate multiplier from game rates
  let multiplier = 2.0; // fallback standard Kokusen multiplier
  if (rawDmg && rawDmg !== '0%') {
    const dmgMatches = [...rawDmg.matchAll(/(\d+(?:\.\d+)?)\s*%/g)];
    const dmgNums = dmgMatches.map((m) => parseFloat(m[1])).filter((n) => !isNaN(n) && n > 0);
    const maxDmgNum = dmgNums.length > 0 ? Math.max(...dmgNums) : 0;

    if (rawDmg.includes('66.6%') && rawDmg.includes('All Hits')) {
      multiplier = 2.0; // Todo multi-hit Ult
    } else if (maxDmgNum >= 100) {
      multiplier = maxDmgNum / 100;
    } else if (maxDmgNum > 0) {
      multiplier = 1 + maxDmgNum / 100;
    }
  } else {
    // Lore / Character archetype fallbacks if combat rates don't specify explicit damage
    const cName = attacker.name.toLowerCase();
    if (cName.includes('yuji') || cName.includes('gojo')) {
      multiplier = 3.0;
    } else {
      multiplier = 2.0;
    }
  }

  const multiplierDisplay = `${multiplier.toFixed(2)}x (${Math.round(multiplier * 100)}%)`;
  return {
    canBlackFlash: true,
    isGuaranteed,
    rateDisplay,
    multiplier,
    multiplierDisplay,
  };
}

// Extractor of innate buffs from passive descriptions
interface ParsedPassiveBuff {
  id: string;
  name: string;
  description: string;
  icon?: string;
  hasSp: boolean;
  baseTai: number;
  baseJuju: number;
  baseDmg: number;
  critTaiPerStack: number;
  critJujuPerStack: number;
  critDmgPerStack: number;
  isConditional: boolean;
}

function parsePassiveBuffs(
  passivesList: { name: string; description: string; sp_description?: string; icon?: string; image_key?: string }[],
  isSp: boolean
): ParsedPassiveBuff[] {
  return passivesList.map((p, idx) => {
    const hasSp = !!p.sp_description;
    const text = (isSp && p.sp_description) ? p.sp_description : (p.description || '');
    
    let baseTai = 0;
    let baseJuju = 0;
    let baseDmg = 0;

    let critTaiPerStack = 0;
    let critJujuPerStack = 0;
    let critDmgPerStack = 0;

    const sections = text.split('▼');
    const unconditionalText = sections[0] || '';
    const conditionalText = sections.slice(1).join(' ');

    // 1. Unconditional buffs (at battle start)
    const uTai = unconditionalText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Taijutsu Increase|Aumento de Taijutsu)/i);
    if (uTai) baseTai = parseFloat(uTai[1]) || 0;

    const uJuju = unconditionalText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Jujutsu Increase|Aumento de Jujutsu)/i);
    if (uJuju) baseJuju = parseFloat(uJuju[1]) || 0;

    const uDmg = unconditionalText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Damage Dealt Increase|Aumento de Dano)/i);
    if (uDmg) baseDmg = parseFloat(uDmg[1]) || 0;

    // 2. Conditional buffs on CRIT or Black Flash (e.g. Nanami Working Overtime / Zone Outburst)
    if (conditionalText.toLowerCase().includes('crit') || conditionalText.toLowerCase().includes('black flash')) {
      const cTai = conditionalText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Taijutsu Increase|Aumento de Taijutsu)/i);
      if (cTai) critTaiPerStack = parseFloat(cTai[1]) || 0;

      const cJuju = conditionalText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Jujutsu Increase|Aumento de Jujutsu)/i);
      if (cJuju) critJujuPerStack = parseFloat(cJuju[1]) || 0;

      const cDmg = conditionalText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Damage Dealt Increase|Aumento de Dano)/i);
      if (cDmg) critDmgPerStack = parseFloat(cDmg[1]) || 0;
    }

    const isConditional = text.includes('▼') || text.includes('Break') || text.includes('turn') || text.includes('Turn');

    return {
      id: `passive-${idx}-${p.name.replace(/\s+/g, '_')}`,
      name: p.name,
      description: text,
      icon: p.icon || p.image_key,
      hasSp,
      baseTai,
      baseJuju,
      baseDmg,
      critTaiPerStack,
      critJujuPerStack,
      critDmgPerStack,
      isConditional,
    };
  });
}

// Extractor of self-buffs from sorcerer active skills (e.g. Nanami's "I Hate Overtime")
interface SelfBuffSkill {
  slotKey: 'skill2' | 'skill3';
  name: string;
  icon?: string;
  dmgBuff: number;
  taiBuff: number;
  jujuBuff: number;
  description: string;
}

function extractSelfBuffSkills(attacker: Character | null, isSp: boolean): SelfBuffSkill[] {
  if (!attacker || !attacker.skills) return [];
  const list: SelfBuffSkill[] = [];

  attacker.skills.forEach((sk, sIdx) => {
    const slotKey = sIdx === 0 ? 'skill2' : 'skill3';
    const v = (isSp && sk.variants?.[1]) ? sk.variants[1] : (sk.variants?.[0] || sk);
    const text = v.description_10 || v.description || sk.description_10 || sk.description || '';

    let dmgBuff = 0;
    let taiBuff = 0;
    let jujuBuff = 0;

    const dmgMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Damage Dealt Increase|Aumento de Dano)/i);
    if (dmgMatch) dmgBuff = parseFloat(dmgMatch[1]) || 0;

    const taiMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Taijutsu Increase|Aumento de Taijutsu)/i);
    if (taiMatch) taiBuff = parseFloat(taiMatch[1]) || 0;

    const jujuMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Jujutsu Increase|Aumento de Jujutsu)/i);
    if (jujuMatch) jujuBuff = parseFloat(jujuMatch[1]) || 0;

    if (dmgBuff > 0 || taiBuff > 0 || jujuBuff > 0) {
      list.push({
        slotKey,
        name: v.name || sk.name,
        icon: v.icon || v.image_key || sk.icon || sk.image_key,
        dmgBuff,
        taiBuff,
        jujuBuff,
        description: text,
      });
    }
  });

  return list;
}

export const DpsCalculator: React.FC<DpsCalculatorProps> = ({ 
  characters, 
  memories,
  onSelectCharacter
}) => {
  const { t, language } = useTranslation();

  // Selected Attacker (defaults to Satoru Gojo or first SSR)
  const defaultChar = useMemo(() => {
    return (
      characters.find(c => c.name.includes('Gojo') && c.rarity === 'SSR') ||
      characters.find(c => c.rarity === 'SSR') ||
      characters[0]
    );
  }, [characters]);

  // Mode Switcher: Solo vs Team
  const [calcMode, setCalcMode] = useState<'solo' | 'team'>('solo');

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

  // Innate Stacks and Turn progression state
  const [techniqueStackPct, setTechniqueStackPct] = useState<number>(0); // 0% to 100% stack
  const [battleTurn, setBattleTurn] = useState<number>(1); // Turn 1 to 10 (Gojo 0.2 All or Nothing)
  const [critStacks, setCritStacks] = useState<number>(1); // 0 to 6 (Nanami Working Overtime / CRIT stacks)
  const [isEnemyBreak, setIsEnemyBreak] = useState<boolean>(false); // Break status (+50% for Gojo 0.2)
  const [isZoneActive, setIsZoneActive] = useState<boolean>(true); // Zone in toggle

  // Check if attacker has SP unlocked capabilities
  const hasSpCapabilities = useMemo(() => {
    if (!attacker) return false;
    const hasSpAuto = (attacker.auto_skills || []).some(a => a.sp_description || a.sp);
    const hasSpPassives = (attacker.passives || []).some(p => p.sp_description || p.sp);
    const hasSpSkills = (attacker.skills || []).some(s => (s.variants || []).some(v => v.id?.includes('sp') || v.label?.toLowerCase().includes('sp')));
    return !!(attacker.sp || hasSpAuto || hasSpPassives || hasSpSkills);
  }, [attacker]);

  const [isSpMode, setIsSpMode] = useState<boolean>(true);
  const [activeSelfBuffs, setActiveSelfBuffs] = useState<Record<string, boolean>>({});

  // Self buffing active skills available for current attacker
  const selfBuffSkills = useMemo(() => {
    return extractSelfBuffSkills(attacker, isSpMode);
  }, [attacker, isSpMode]);

  // Innate Passives disabled map (id -> boolean). By default, all passives are enabled (!disabledPassives[id])
  const [disabledPassives, setDisabledPassives] = useState<Record<string, boolean>>({});
  const [isPassivesSectionExpanded, setIsPassivesSectionExpanded] = useState<boolean>(true);

  // External Support Buffs Sliders
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

  // Parsed innate passives of attacker
  const parsedPassives = useMemo(() => {
    const list = attacker.auto_skills || attacker.passives || [];
    return parsePassiveBuffs(list, isSpMode);
  }, [attacker, isSpMode]);

  // Selected Raw Skill item from character
  const selectedSkillRaw = useMemo(() => {
    if (!attacker) return null;
    if (selectedSlot === 'na') return attacker.normal_attack;
    if (selectedSlot === 'skill2') return attacker.skills?.[0];
    if (selectedSlot === 'skill3') return attacker.skills?.[1];
    return attacker.ultimate;
  }, [attacker, selectedSlot]);

  // Skill variant selection (e.g. Base vs Changed vs SP)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);
  const activeVariantIdx = Math.min(selectedVariantIdx, Math.max(0, (selectedSkillRaw?.variants?.length || 1) - 1));
  const activeVariant = selectedSkillRaw?.variants?.[activeVariantIdx];

  // Selected Skill Object & Description with active variant
  const currentSkillData = useMemo(() => {
    if (!attacker || !selectedSkillRaw) return null;
    const v = activeVariant;
    const variants = selectedSkillRaw.variants || [];
    return {
      name: v?.name || selectedSkillRaw.name || (selectedSlot === 'na' ? 'Ataque Normal' : selectedSlot === 'ult' ? 'Técnica Suprema' : 'Skill'),
      icon: v?.icon || v?.image_key || selectedSkillRaw.icon || selectedSkillRaw.image_key,
      desc: v?.description || selectedSkillRaw.description,
      desc10: v?.description_10 || selectedSkillRaw.description_10,
      cost: String(v?.cost || ('cost' in selectedSkillRaw ? (selectedSkillRaw as { cost?: string }).cost || '0' : selectedSlot === 'ult' ? `Gauge ${attacker.stats?.special_gauge || '1000'}` : '0')),
      combatRates: v?.combat_rates || attacker.combat_rates,
      variants,
      activeVariantLabel: v?.label || 'Base',
    };
  }, [attacker, selectedSkillRaw, activeVariant, selectedSlot]);

  // Skill scaling extraction
  const { taijutsuPct, jujutsuPct, isDirectDamage, maxStackPct, stackResource } = useMemo(() => {
    if (!currentSkillData) return { taijutsuPct: 0, jujutsuPct: 0, isDirectDamage: false, maxStackPct: 0, stackResource: '' };
    return extractSkillMultipliers(currentSkillData.desc, currentSkillData.desc10, skillLevel);
  }, [currentSkillData, skillLevel]);

  // Comprehensive Black Flash data and eligibility
  const blackFlashInfo = useMemo(() => {
    return getBlackFlashInfo(attacker, currentSkillData);
  }, [attacker, currentSkillData]);

  const isGuaranteedBlackFlash = blackFlashInfo.isGuaranteed;

  // Dynamic Skill Multiplier with Stack Interpolation
  const effectiveSkillMultiplier = useMemo(() => {
    const baseMult = Math.max(taijutsuPct, jujutsuPct);
    if (maxStackPct > baseMult) {
      // Interpolate between baseMult and maxStackPct according to techniqueStackPct
      return Math.round(baseMult + (maxStackPct - baseMult) * (techniqueStackPct / 100));
    }
    return baseMult;
  }, [taijutsuPct, jujutsuPct, maxStackPct, techniqueStackPct]);

  // Compute total buffs from active innate passives and self-buff skills
  const innateBuffs = useMemo(() => {
    let tai = 0;
    let juju = 0;
    let dmg = 0;

    parsedPassives.forEach(p => {
      if (!disabledPassives[p.id]) {
        // 1. Unconditional baseline buffs
        tai += p.baseTai;
        juju += p.baseJuju;
        dmg += p.baseDmg;

        // 2. CRIT / Black Flash conditional stacks (e.g. Nanami Going into Overtime)
        if (critStacks > 0) {
          const addedTai = Math.min(100, critStacks * p.critTaiPerStack);
          const addedJuju = Math.min(100, critStacks * p.critJujuPerStack);
          const addedDmg = Math.min(135, critStacks * p.critDmgPerStack);

          tai += addedTai;
          juju += addedJuju;
          dmg += addedDmg;
        }

        // Special handling for Gojo 0.2 "All or Nothing" (Turn scaling up to 80%)
        if (p.name.includes('All or Nothing') || p.description.includes('All or Nothing')) {
          const turnBuff = Math.min(80, 20 + (battleTurn - 1) * 10);
          tai += (turnBuff - 20);
          juju += (turnBuff - 20);
        }

        // Special handling for Gojo 0.2 "Break Enhance" (+50% if break active)
        if ((p.name.includes('Break') || p.description.includes('Break status')) && isEnemyBreak) {
          dmg += 50;
        }

        // Special handling for "Zone" passives (Nanami Zone Outburst, Yuji Zone)
        if (p.name.includes('Zone') && isZoneActive) {
          if (p.description.includes('48.00%') || p.description.includes('80.00%')) {
            tai += 32;
          }
          if (p.name.includes('Zone, Outburst') && isSpMode) {
            tai += 5;
            juju += 5;
          }
        }
      }
    });

    // 3. Self-buff active skills (e.g. Nanami's "I Hate Overtime")
    selfBuffSkills.forEach(sb => {
      if (activeSelfBuffs[sb.slotKey] && selectedSlot !== sb.slotKey) {
        tai += sb.taiBuff;
        juju += sb.jujuBuff;
        dmg += sb.dmgBuff;
      }
    });

    return { tai, juju, dmg };
  }, [
    parsedPassives, 
    disabledPassives, 
    critStacks, 
    battleTurn, 
    isEnemyBreak, 
    isZoneActive, 
    isSpMode, 
    selfBuffSkills, 
    activeSelfBuffs, 
    selectedSlot
  ]);

  // Presets
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

  // Effective attack power with memory + innate passives + external support buffs
  const effectiveTaijutsu = useMemo(() => {
    const memMult = 1 + memoryTaijutsuBonus / 100;
    const totalTaiBuff = innateBuffs.tai + taijutsuBuff;
    return Math.round(baseTaijutsu * memMult * (1 + totalTaiBuff / 100));
  }, [baseTaijutsu, memoryTaijutsuBonus, innateBuffs.tai, taijutsuBuff]);

  const effectiveJujutsu = useMemo(() => {
    const memMult = 1 + memoryJujutsuBonus / 100;
    const totalJujuBuff = innateBuffs.juju + jujutsuBuff;
    return Math.round(baseJujutsu * memMult * (1 + totalJujuBuff / 100));
  }, [baseJujutsu, memoryJujutsuBonus, innateBuffs.juju, jujutsuBuff]);

  // Elemental factor
  const elementalMatch = useMemo(() => {
    if (!attacker) return { factor: 1.0, label: 'Neutro', tag: 'neutral' };
    return getElementalFactor(attacker.element, targetElement);
  }, [attacker, targetElement]);

  const attackerFocus = attacker?.focus?.toLowerCase() || '';

  // Final Damage Calculations
  const calculatedDamage = useMemo(() => {
    let activeTaiPct = taijutsuPct;
    let activeJujuPct = jujutsuPct;

    if (maxStackPct > 0) {
      if (taijutsuPct > 0) activeTaiPct = effectiveSkillMultiplier;
      if (jujutsuPct > 0) activeJujuPct = effectiveSkillMultiplier;
    }

    if (!isDirectDamage) {
      if (attackerFocus.includes('taijutsu')) {
        activeTaiPct = customMultiplier;
      } else if (attackerFocus.includes('jujutsu')) {
        activeJujuPct = customMultiplier;
      } else {
        activeTaiPct = customMultiplier / 2;
        activeJujuPct = customMultiplier / 2;
      }
    }

    // Raw damage scaling
    const rawDamage = (effectiveTaijutsu * activeTaiPct / 100) + (effectiveJujutsu * activeJujuPct / 100);

    // Multipliers
    const totalDmgDealt = innateBuffs.dmg + damageDealtBuff;
    const dmgDealtMult = 1 + totalDmgDealt / 100;
    const elemMult = elementalMatch.factor * (1 + elementalBuff / 100);
    const defenseReduction = Math.max(0, 1 - targetDefense / 100);
    const debuffMult = 1 + enemyDebuff / 100;

    let normal = Math.round(rawDamage * dmgDealtMult * elemMult * defenseReduction * debuffMult);
    
    // Official Black Flash calculation from kit rates
    const canBlackFlash = blackFlashInfo.canBlackFlash;
    const bfMultiplier = canBlackFlash ? blackFlashInfo.multiplier : 0;

    let crit = Math.round(normal * 1.50);
    let blackFlash = canBlackFlash ? Math.round(normal * bfMultiplier) : 0;

    // If the skill has guaranteed Black Flash (e.g. Yuji Ult), normal hit IS a Black Flash!
    if (blackFlashInfo.isGuaranteed && canBlackFlash) {
      normal = blackFlash;
      crit = blackFlash;
    }

    // 3-Turn Rotation estimation
    const rotationEstimate = Math.round(normal * 3.4);

    return {
      normal,
      crit,
      blackFlash,
      rotationEstimate,
      rawDamage: Math.round(rawDamage),
      activeTaiPct,
      activeJujuPct,
      totalDmgDealt,
      totalTaiBuff: innateBuffs.tai + taijutsuBuff,
      totalJujuBuff: innateBuffs.juju + jujutsuBuff,
      bfMultiplier,
      canBlackFlash,
    };
  }, [
    effectiveTaijutsu, 
    effectiveJujutsu, 
    taijutsuPct, 
    jujutsuPct, 
    maxStackPct,
    effectiveSkillMultiplier,
    isDirectDamage, 
    customMultiplier, 
    innateBuffs,
    damageDealtBuff, 
    taijutsuBuff,
    jujutsuBuff,
    elementalMatch, 
    elementalBuff, 
    targetDefense, 
    enemyDebuff,
    blackFlashInfo,
    attackerFocus
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

        {/* Mode Switcher: Solo vs Team */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => {
              playClick();
              setCalcMode('solo');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2 ${
              calcMode === 'solo'
                ? 'bg-purple-600 border-purple-400 text-white ring-2 ring-purple-500/50 shadow-md'
                : 'bg-[#140e28] border-[#291e47] text-gray-400 hover:text-white'
            }`}
          >
            <span>{language === 'pt' ? 'Feiticeiro Solo (Análise Profunda)' : 'Solo Sorcerer (In-Depth)'}</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setCalcMode('team');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2 ${
              calcMode === 'team'
                ? 'bg-gradient-to-r from-purple-600 to-amber-600 border-amber-400 text-white ring-2 ring-amber-500/50 shadow-md'
                : 'bg-[#140e28] border-[#291e47] text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{language === 'pt' ? 'Rotação de Time (4 Feiticeiros + Sinergia)' : 'Team Rotation (4 Sorcerers)'}</span>
          </button>
        </div>
      </div>

      {calcMode === 'team' ? (
        <TeamDpsSimulator
          characters={characters}
          memories={memories}
          onSelectCharacter={onSelectCharacter}
        />
      ) : (
        /* Main Grid: Left Config Panel (2/3), Right Output Panel (1/3) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Attacker, Skills, Innate Passives & Stacks, Memory, Buffs, Target */}
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
                <button
                  onClick={() => {
                    if (!attacker) return;
                    const bis = getBestInSlotMemory(attacker, memories);
                    if (bis) {
                      playSelect();
                      setMemoryId(bis.id);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-950/40 flex items-center gap-1 transition-all cursor-pointer"
                  title="Equipar automaticamente a melhor memória calculada (BiS) para este personagem"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>Auto BiS</span>
                </button>
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

          {/* Skill Selection & Technique Stacks */}
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
              <div className="bg-[#0b0717] p-3.5 rounded-xl border border-purple-950 space-y-3">
                <div className="flex items-center justify-between">
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

                  {isGuaranteedBlackFlash && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-950 border border-red-500/80 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.5)] flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                      <span>{t.dps.guaranteedBlackFlash}</span>
                    </span>
                  )}
                </div>

                {/* Variant Selector (if skill has multiple variants like Base vs SP / Changed) */}
                {currentSkillData.variants.length > 1 && (
                  <div className="flex items-center gap-2 pt-1 pb-1 border-b border-[#1f1636]">
                    <span className="text-[11px] text-gray-400 font-semibold">{t.dps.variantSelector}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentSkillData.variants.map((v, vIdx) => (
                        <button
                          key={v.id || vIdx}
                          onClick={() => {
                            playClick();
                            setSelectedVariantIdx(vIdx);
                          }}
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            activeVariantIdx === vIdx
                              ? 'bg-purple-800 border-purple-400 text-white shadow-sm'
                              : 'bg-[#150e29] border-purple-950 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {v.label || v.name || `Modo ${vIdx + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isDirectDamage ? (
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono pt-1">
                    {taijutsuPct > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/40 font-bold">
                        Taijutsu: {effectiveSkillMultiplier}%
                      </span>
                    )}
                    {jujutsuPct > 0 && (
                      <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold">
                        Jujutsu: {effectiveSkillMultiplier}%
                      </span>
                    )}
                    {maxStackPct > Math.max(taijutsuPct, jujutsuPct) && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/50 font-bold">
                        Máx com Stacks: {maxStackPct}%
                      </span>
                    )}
                    {blackFlashInfo.canBlackFlash ? (
                      <span className="px-2 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-600/60 font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-red-400" />
                        <span>Kokusen: {blackFlashInfo.rateDisplay} • {blackFlashInfo.multiplier.toFixed(2)}x</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-purple-950/40 text-gray-400 border border-purple-900/30 text-[11px]">
                        {t.dps.noBlackFlash}
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

                {/* Stacks Controller (e.g. Yuji Ult 1050% -> 2100% with 250 CE) */}
                {maxStackPct > Math.max(taijutsuPct, jujutsuPct) && (
                  <div className="pt-2 border-t border-[#1f1636] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.dps.techniqueStacksTitle} ({stackResource})</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { playClick(); setTechniqueStackPct(0); }}
                          className="px-2 py-0.5 rounded text-[10px] bg-[#1a1236] border border-purple-900/60 text-gray-400 hover:text-white cursor-pointer"
                        >
                          {t.dps.baseStacksButton}
                        </button>
                        <button
                          onClick={() => { playSelect(); setTechniqueStackPct(100); }}
                          className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-600 to-yellow-500 text-black hover:scale-105 transition-transform cursor-pointer shadow-md"
                        >
                          {t.dps.maxStacksButton} ({maxStackPct}%)
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={techniqueStackPct} 
                        onChange={(e) => setTechniqueStackPct(parseInt(e.target.value, 10))} 
                        className="flex-1 accent-amber-500 cursor-pointer" 
                      />
                      <span className="font-mono text-xs font-bold text-amber-400 w-16 text-right">
                        {effectiveSkillMultiplier}%
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Escalona de {Math.max(taijutsuPct, jujutsuPct)}% até {maxStackPct}% conforme o acúmulo de energia/recursos.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Innate Character Passives & Battle Conditions */}
          <div className="bg-[#120d24] border border-[#271d44] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#201838] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-purple-400" />
                  <span>{t.dps.innatePassivesTitle}</span>
                </span>

                {/* SP Passives Toggle (Base vs SP) */}
                {hasSpCapabilities && (
                  <div className="flex items-center gap-1 bg-[#1a1133] p-0.5 rounded-xl border border-purple-900/60 ml-1">
                    <button
                      onClick={() => { playClick(); setIsSpMode(false); }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        !isSpMode 
                          ? 'bg-purple-800 text-white shadow-sm' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t.dps.baseMode}
                    </button>
                    <button
                      onClick={() => { playClick(); setIsSpMode(true); }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                        isSpMode 
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-md' 
                          : 'text-amber-400/80 hover:text-amber-300'
                      }`}
                    >
                      <span>{t.dps.spMode}</span>
                      {isSpMode && <Sparkles className="w-3 h-3 text-black" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playSelect();
                    setDisabledPassives({});
                  }}
                  className="text-[11px] text-purple-400 hover:text-white cursor-pointer transition-colors"
                >
                  {t.dps.enableAllPassives}
                </button>
                <span className="text-gray-600">•</span>
                <button
                  onClick={() => {
                    playClick();
                    const allFalse: Record<string, boolean> = {};
                    parsedPassives.forEach(p => { allFalse[p.id] = true; });
                    setDisabledPassives(allFalse);
                  }}
                  className="text-[11px] text-gray-400 hover:text-white cursor-pointer transition-colors"
                >
                  {t.dps.disableAllPassives}
                </button>
                <button
                  onClick={() => setIsPassivesSectionExpanded(prev => !prev)}
                  className="p-1 rounded text-gray-400 hover:text-white ml-1 cursor-pointer"
                >
                  {isPassivesSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Battle Conditionals Grid (Turn, Crit Stacks, Break, Zone) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#0b0717] border border-purple-950 text-xs">
              {/* Turn Counter */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-gray-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t.dps.turnCounter}:</span>
                  </span>
                  <span className="font-mono text-white font-bold">Turno {battleTurn}</span>
                </div>
                <input 
                  type="range" min="1" max="10" value={battleTurn} 
                  onChange={(e) => setBattleTurn(parseInt(e.target.value, 10))} 
                  className="w-full accent-purple-500 cursor-pointer" 
                />
              </div>

              {/* CRIT / Black Flash Stacks (Nanami Working Overtime) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-gray-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.dps.critStacksTitle}:</span>
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{critStacks}x Crítico</span>
                </div>
                <input 
                  type="range" min="0" max="6" value={critStacks} 
                  onChange={(e) => setCritStacks(parseInt(e.target.value, 10))} 
                  className="w-full accent-amber-500 cursor-pointer" 
                  title={t.dps.critStacksHint}
                />
              </div>

              {/* Break Status Toggle */}
              <button
                onClick={() => { playClick(); setIsEnemyBreak(prev => !prev); }}
                className={`p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                  isEnemyBreak ? 'bg-amber-950/70 border-amber-500/60 text-amber-300' : 'bg-[#150f2a] border-purple-950 text-gray-400'
                }`}
              >
                <span>💥 Alvo em Break</span>
                {isEnemyBreak ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4 text-gray-600" />}
              </button>

              {/* Zone In Toggle */}
              <button
                onClick={() => { playClick(); setIsZoneActive(prev => !prev); }}
                className={`p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                  isZoneActive ? 'bg-purple-900/60 border-purple-500 text-purple-200' : 'bg-[#150f2a] border-purple-950 text-gray-400'
                }`}
              >
                <span>⚡ Estado Zone</span>
                {isZoneActive ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4 text-gray-600" />}
              </button>
            </div>

            {/* List of Innate Passives */}
            {isPassivesSectionExpanded && (
              <div className="space-y-2">
                {parsedPassives.length === 0 ? (
                  <p className="text-xs text-gray-500 py-2">Nenhuma passiva cadastrada para esta unidade.</p>
                ) : (
                  parsedPassives.map((p) => {
                    const isChecked = !disabledPassives[p.id];
                    const activeCritTai = critStacks > 0 ? Math.min(100, critStacks * p.critTaiPerStack) : 0;
                    const activeCritJuju = critStacks > 0 ? Math.min(100, critStacks * p.critJujuPerStack) : 0;
                    const activeCritDmg = critStacks > 0 ? Math.min(135, critStacks * p.critDmgPerStack) : 0;

                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          playClick();
                          setDisabledPassives(prev => ({ ...prev, [p.id]: !prev[p.id] }));
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked 
                            ? 'bg-[#181033] border-purple-600/50 shadow-sm' 
                            : 'bg-[#0f0a20] border-purple-950/60 opacity-60 hover:opacity-90'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#070412] border border-purple-800/40 shrink-0 mt-0.5">
                          <img 
                            src={getSkillIconUrl(p.icon)} 
                            alt={p.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white line-clamp-1">{p.name}</span>
                              {isSpMode && p.hasSp && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-sm shrink-0">
                                  {t.dps.spUnlocked}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end">
                              {p.baseTai > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/50">
                                  +{p.baseTai}% Tai
                                </span>
                              )}
                              {p.baseJuju > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                                  +{p.baseJuju}% Juju
                                </span>
                              )}
                              {p.baseDmg > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                                  +{p.baseDmg}% Dano
                                </span>
                              )}
                              {activeCritTai > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/50">
                                  +{activeCritTai}% Tai (CRIT)
                                </span>
                              )}
                              {activeCritJuju > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/50">
                                  +{activeCritJuju}% Juju (CRIT)
                                </span>
                              )}
                              {activeCritDmg > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/50">
                                  +{activeCritDmg}% Dano Azul
                                </span>
                              )}
                              {isChecked ? <CheckSquare className="w-4 h-4 text-purple-400 ml-1" /> : <Square className="w-4 h-4 text-gray-600 ml-1" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-3 mt-1 leading-relaxed whitespace-pre-line">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Sorcerer Self-Buffing Active Skills (e.g. Nanami's "I Hate Overtime") */}
            {selfBuffSkills.length > 0 && (
              <div className="pt-3 border-t border-[#201838] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.dps.selfSkillBuffsTitle}</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Ative buffs aplicados por outras habilidades da unidade</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selfBuffSkills.map(sb => {
                    const isCurrentAttack = selectedSlot === sb.slotKey;
                    const isChecked = !!activeSelfBuffs[sb.slotKey];

                    return (
                      <div 
                        key={sb.slotKey}
                        onClick={() => {
                          if (isCurrentAttack) return;
                          playClick();
                          setActiveSelfBuffs(prev => ({ ...prev, [sb.slotKey]: !prev[sb.slotKey] }));
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isCurrentAttack 
                            ? 'opacity-40 bg-[#120a1c] border-purple-950 cursor-not-allowed select-none'
                            : isChecked 
                              ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 cursor-pointer shadow-md'
                              : 'bg-[#150f29] border-purple-950/70 text-gray-400 hover:text-gray-200 cursor-pointer'
                        }`}
                        title={isCurrentAttack ? 'Esta habilidade é a técnica atualmente selecionada para ataque' : sb.description}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#070412] border border-purple-800/40 shrink-0">
                            <img 
                              src={getSkillIconUrl(sb.icon)} 
                              alt={sb.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { (e.target as HTMLImageElement).src = getSkillIconUrl(); }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white line-clamp-1">{sb.name}</span>
                              {isCurrentAttack && (
                                <span className="text-[9px] text-gray-400 bg-purple-950 px-1.5 py-0.2 rounded border border-purple-900/40 shrink-0">
                                  (Em Uso)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-amber-300 font-mono block">
                              {sb.dmgBuff > 0 ? `+${sb.dmgBuff}% Dano ` : ''}
                              {sb.taiBuff > 0 ? `+${sb.taiBuff}% Tai ` : ''}
                              {sb.jujuBuff > 0 ? `+${sb.jujuBuff}% Juju` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {isCurrentAttack ? (
                            <Square className="w-4 h-4 text-gray-600" />
                          ) : isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* External Support Buffs & Modifiers Panel */}
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
                  <span className="font-mono text-red-400 font-bold">+{taijutsuBuff}% (Total: +{calculatedDamage.totalTaiBuff}%)</span>
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
                  <span className="font-mono text-blue-400 font-bold">+{jujutsuBuff}% (Total: +{calculatedDamage.totalJujuBuff}%)</span>
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
                  <span className="font-mono text-purple-300 font-bold">+{damageDealtBuff}% (Total: +{calculatedDamage.totalDmgDealt}%)</span>
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
                {isGuaranteedBlackFlash ? '🔥 DANO FINAL (KOKUSEN GARANTIDO)' : t.dps.normalDamage}
              </span>
              <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-indigo-300 font-mono">
                {calculatedDamage.normal.toLocaleString('pt-BR')}
              </div>
              <p className="text-[11px] text-gray-400">
                {isGuaranteedBlackFlash 
                  ? 'Técnica com Kokusen Garantido ativada com multiplicador lendário!' 
                  : 'Dano médio calculado considerando buffs, passivas nativas e afinidade.'}
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
                  <span className="text-[10px] text-gray-400">+50% Dano Crítico Padrão</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  {calculatedDamage.crit.toLocaleString('pt-BR')}
                </div>
              </div>

              {/* Black Flash Card (Active / Ineligible Handling) */}
              {calculatedDamage.canBlackFlash ? (
                <div 
                  onClick={() => playBlackFlash()}
                  className="group bg-gradient-to-r from-red-950/90 via-black to-red-950/90 border-2 border-red-600/70 hover:border-red-500 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-red-950/60 cursor-pointer transition-all hover:scale-[1.02]"
                  title="Clique para ouvir o impacto de Black Flash!"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-black tracking-wider text-red-400 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-red-500 group-hover:animate-bounce" />
                        <span>{t.dps.blackFlashDamage}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/40">
                        {blackFlashInfo.multiplier.toFixed(2)}x Dano
                      </span>
                    </div>
                    <span className="text-[10px] text-red-300/80 block">
                      Chance: <strong className="text-red-200">{blackFlashInfo.rateDisplay}</strong>
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-red-400 font-mono drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                    {calculatedDamage.blackFlash.toLocaleString('pt-BR')}
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => playClick()}
                  className="bg-[#120a1c]/80 border border-purple-950/60 rounded-2xl p-4 flex items-center justify-between opacity-60 select-none cursor-not-allowed"
                  title={t.dps.noBlackFlashDesc}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-gray-500" />
                        <span>{t.dps.blackFlashDamage}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-950/60 text-gray-400 border border-purple-900/40">
                        {t.dps.noBlackFlash}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 block">
                      {t.dps.noBlackFlashDesc}
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-gray-500 font-mono">
                    —
                  </div>
                </div>
              )}
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
                Estimativa de rotação de combate com stacks e buffs ativos.
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
                <span className="text-red-400">{effectiveTaijutsu.toLocaleString('pt-BR')} (Base: {baseTaijutsu})</span>
              </div>
              <div className="flex justify-between text-gray-300 py-1 border-b border-[#1b1336]">
                <span className="text-gray-400">Jujutsu Efetivo:</span>
                <span className="text-blue-400">{effectiveJujutsu.toLocaleString('pt-BR')} (Base: {baseJujutsu})</span>
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
                <span className="text-gray-400">Buffs Totais de Dano:</span>
                <span className="text-purple-300">+{calculatedDamage.totalDmgDealt}% (x{(1 + calculatedDamage.totalDmgDealt / 100).toFixed(2)})</span>
              </div>
              {(innateBuffs.tai > 0 || innateBuffs.juju > 0 || innateBuffs.dmg > 0) && (
                <div className="flex justify-between text-gray-400 py-1 border-b border-[#1b1336] text-[11px]">
                  <span>Passivas {isSpMode ? '[SP]' : '[Base]'} + Buffs Próprios:</span>
                  <span className="text-amber-300 font-bold">
                    {innateBuffs.tai > 0 ? `+${innateBuffs.tai}% Tai ` : ''}
                    {innateBuffs.juju > 0 ? `+${innateBuffs.juju}% Juju ` : ''}
                    {innateBuffs.dmg > 0 ? `+${innateBuffs.dmg}% Dano` : ''}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-300 py-1 border-b border-[#1b1336]">
                <span className="text-gray-400">Fator de Afinidade Elemental:</span>
                <span className="text-emerald-400">x{(elementalMatch.factor * (1 + elementalBuff / 100)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300 py-1 border-b border-[#1b1336]">
                <span className="text-gray-400">Kokusen (Black Flash):</span>
                {calculatedDamage.canBlackFlash ? (
                  <span className="text-red-400 font-bold">
                    {blackFlashInfo.multiplier.toFixed(2)}x ({blackFlashInfo.rateDisplay})
                  </span>
                ) : (
                  <span className="text-gray-500">
                    {t.dps.noBlackFlash}
                  </span>
                )}
              </div>
              <div className="flex justify-between text-gray-300 py-1">
                <span className="text-gray-400">Resistência do Inimigo:</span>
                <span className="text-gray-300">-{targetDefense}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

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
                    setDisabledPassives({});
                    setTechniqueStackPct(0);
                    setBattleTurn(1);
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
