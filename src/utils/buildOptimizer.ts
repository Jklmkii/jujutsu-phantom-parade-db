import type { Character, Memory } from '../types';

export interface RecommendedMemory {
  memory: Memory;
  score: number;
  rank: 1 | 2 | 3;
  badge: 'BiS Recomendado' | 'Forte Alternativa' | 'Situacional / Suporte';
  badgeEn: 'Best in Slot' | 'Strong Alternative' | 'Situational / Utility';
  reasonsPt: string[];
  reasonsEn: string[];
}

function parseStatPercent(str?: string): number {
  if (!str) return 0;
  const match = str.match(/(\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Calculates a tactical synergy score between a character and a memory card
 */
export function scoreMemoryForCharacter(
  character: Character,
  memory: Memory
): { score: number; reasonsPt: string[]; reasonsEn: string[] } {
  let score = 0;
  const reasonsPt: string[] = [];
  const reasonsEn: string[] = [];

  const memTai = parseStatPercent(memory.stats?.taijutsu);
  const memJuj = parseStatPercent(memory.stats?.jujutsu);
  const memHp = parseStatPercent(memory.stats?.hp);

  const focus = (character.focus || '').toLowerCase();
  const role = (character.role || '').toLowerCase();
  const activeDesc = (memory.active_skill?.description || '').toLowerCase();
  const passiveDesc = (memory.passive_skill?.description || '').toLowerCase();
  const fullDesc = `${activeDesc} ${passiveDesc}`;

  // 1. Rarity Baseline
  if (memory.rarity === 'SSR') score += 50;
  else if (memory.rarity === 'SR') score += 20;

  // 2. Primary Stat Scaling Alignment
  if (focus.includes('taijutsu') && !focus.includes('hybrid') && !focus.includes('mixed')) {
    score += memTai * 2.8;
    if (memTai >= 30) {
      reasonsPt.push(`Alto bônus de Taijutsu (+${memTai.toFixed(1)}%)`);
      reasonsEn.push(`High Taijutsu bonus (+${memTai.toFixed(1)}%)`);
    }
  } else if (focus.includes('jujutsu') && !focus.includes('hybrid') && !focus.includes('mixed')) {
    score += memJuj * 2.8;
    if (memJuj >= 30) {
      reasonsPt.push(`Alto bônus de Jujutsu (+${memJuj.toFixed(1)}%)`);
      reasonsEn.push(`High Jujutsu bonus (+${memJuj.toFixed(1)}%)`);
    }
  } else {
    // Hybrid / Mixed
    score += (memTai + memJuj) * 1.6;
    if (memTai >= 20 && memJuj >= 20) {
      reasonsPt.push(`Atributos híbridos balanceados (+${memTai.toFixed(0)}% Tai / +${memJuj.toFixed(0)}% Juj)`);
      reasonsEn.push(`Balanced hybrid stats (+${memTai.toFixed(0)}% Tai / +${memJuj.toFixed(0)}% Juj)`);
    }
  }

  // 3. Black Flash (Kokusen) & Critical Synergy
  const hasKokusen = character.tags?.includes('Black Flash') || 
                     character.tags?.includes('BF Rate Up') ||
                     Boolean(character.combat_rates?.black_flash) ||
                     JSON.stringify(character.skills || []).toLowerCase().includes('black flash') ||
                     JSON.stringify(character.ultimate || {}).toLowerCase().includes('black flash');

  if (hasKokusen) {
    if (fullDesc.includes('black flash')) {
      score += 55;
      reasonsPt.push('Sinergia direta com Black Flash (Kokusen)');
      reasonsEn.push('Direct Black Flash (Kokusen) synergy');
    } else if (fullDesc.includes('critical hit rate') || fullDesc.includes('crit rate')) {
      score += 40;
      reasonsPt.push('Aumento de Taxa Crítica para gatilho de Kokusen');
      reasonsEn.push('Crit rate boost triggering Kokusen');
    }
  }

  // 4. Role Specific Mechanics
  if (role.includes('attacker')) {
    if (fullDesc.includes('damage dealt') || fullDesc.includes('increases own taijutsu') || fullDesc.includes('increases own jujutsu')) {
      score += 30;
      if (reasonsPt.length < 2) {
        reasonsPt.push('Amplificação maciça de Dano');
        reasonsEn.push('Massive Damage Dealt amplification');
      }
    }
  } else if (role.includes('healer') || role.includes('buffer')) {
    if (fullDesc.includes('allies') || fullDesc.includes('cursed energy') || fullDesc.includes('recovers') || fullDesc.includes('ultimate gauge')) {
      score += 45;
      reasonsPt.push('Geração de Energia e utilidade para a equipe');
      reasonsEn.push('Energy generation & party utility');
    }
  } else if (role.includes('defender')) {
    score += memHp * 1.8;
    if (fullDesc.includes('damage reduction') || fullDesc.includes('taunt') || fullDesc.includes('hp')) {
      score += 45;
      reasonsPt.push('Mitigação de dano e tanque de sobrevivência');
      reasonsEn.push('Damage mitigation and survival tanking');
    }
  }

  // 5. Special Character Conditions (e.g. Gojo withdraw mechanic)
  if (character.name.toLowerCase().includes('gojo') && fullDesc.includes('leaves the battlefield')) {
    score += 60;
    reasonsPt.push('Condição de ativação sob medida para Gojo');
    reasonsEn.push('Custom activation condition for Gojo');
  }

  return {
    score,
    reasonsPt: reasonsPt.slice(0, 2),
    reasonsEn: reasonsEn.slice(0, 2),
  };
}

/**
 * Returns the Top 3 recommended memories for a given character
 */
export function getRecommendedMemories(
  character: Character,
  memories: Memory[]
): RecommendedMemory[] {
  const scored = memories
    .map((mem) => {
      const { score, reasonsPt, reasonsEn } = scoreMemoryForCharacter(character, mem);
      return { memory: mem, score, reasonsPt, reasonsEn };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const badges = [
    { pt: 'BiS Recomendado' as const, en: 'Best in Slot' as const },
    { pt: 'Forte Alternativa' as const, en: 'Strong Alternative' as const },
    { pt: 'Situacional / Suporte' as const, en: 'Situational / Utility' as const },
  ];

  return scored.map((item, idx) => ({
    memory: item.memory,
    score: item.score,
    rank: (idx + 1) as 1 | 2 | 3,
    badge: badges[idx].pt,
    badgeEn: badges[idx].en,
    reasonsPt: item.reasonsPt.length > 0 ? item.reasonsPt : ['Excelente compatibilidade com atributos de combate'],
    reasonsEn: item.reasonsEn.length > 0 ? item.reasonsEn : ['Excellent compatibility with combat stats'],
  }));
}

/**
 * Returns the single best memory for DPS Calculator auto-equip
 */
export function getBestInSlotMemory(
  character: Character,
  memories: Memory[]
): Memory | null {
  const recs = getRecommendedMemories(character, memories);
  return recs.length > 0 ? recs[0].memory : null;
}
