import type { Character } from '../types';

export type CombatEffectKey = 'ALL' | 'kokusen' | 'stun' | 'heal' | 'defDown' | 'domain' | 'taunt';

export interface CombatEffectDef {
  key: CombatEffectKey;
  labelKey: string;
  iconName: 'Flame' | 'Zap' | 'Heart' | 'ShieldAlert' | 'Sparkles' | 'Eye';
  color: string;
  activeColor: string;
  badgeBg: string;
  predicate: (char: Character) => boolean;
}

/**
 * Checks if a character has Black Flash / Kokusen capabilities
 */
export function hasKokusen(c: Character): boolean {
  if (c.tags?.includes('Black Flash') || c.tags?.includes('BF Rate Up')) return true;
  const skillsStr = JSON.stringify(c.skills || []).toLowerCase();
  const ultStr = JSON.stringify(c.ultimate || {}).toLowerCase();
  const autoStr = JSON.stringify(c.auto_skills || []).toLowerCase();
  return skillsStr.includes('black flash') || ultStr.includes('black flash') || autoStr.includes('black flash') ||
         skillsStr.includes('kokusen') || ultStr.includes('kokusen') || autoStr.includes('kokusen');
}

/**
 * Checks if a character inflicts Stun or Action Disruption
 */
export function hasStun(c: Character): boolean {
  if (c.tags?.includes('Stun')) return true;
  const allText = JSON.stringify([c.skills, c.ultimate, c.auto_skills]).toLowerCase();
  return allText.includes('stun') || allText.includes('incapacitated') || allText.includes('prevent action');
}

/**
 * Checks if a character heals or revives allies/self
 */
export function hasHeal(c: Character): boolean {
  if (c.tags?.includes('Heal') || c.tags?.includes('Revival')) return true;
  const allText = JSON.stringify([c.skills, c.ultimate, c.auto_skills]).toLowerCase();
  return /recover(s)? hp|hp recovery|heal(s)?|reviv/i.test(allText);
}

/**
 * Checks if a character applies Defense Down, Break debuffs, or Damage Taken Increase
 */
export function hasDefDown(c: Character): boolean {
  if (c.tags?.some(t => ['Crit RES Down', 'Break Debuffer', 'DMG Debuffer', 'Stat Debuffer', 'Break Buffer'].includes(t))) return true;
  const allText = JSON.stringify([c.skills, c.ultimate]).toLowerCase();
  return /damage taken increase|defense down|taijutsu down|jujutsu down|break gauge/i.test(allText);
}

/**
 * Checks if a character has a Domain Expansion
 */
export function hasDomain(c: Character): boolean {
  if (c.tags?.includes('Domain')) return true;
  const title = (c.title || '').toLowerCase();
  const ultName = (c.ultimate?.name || '').toLowerCase();
  const ultDesc = (c.ultimate?.description || '').toLowerCase();
  return title.includes('domain') || ultName.includes('domain') || ultDesc.includes('domain expansion') || ultDesc.includes('domain展開');
}

/**
 * Checks if a character has Taunt, Counter, or Evasion mechanics
 */
export function hasTaunt(c: Character): boolean {
  if (c.tags?.some(t => ['Taunt', 'Counter'].includes(t))) return true;
  const allText = JSON.stringify([c.skills, c.ultimate, c.auto_skills]).toLowerCase();
  return /taunt|evasion|counter|draws attacks|nullif(y|ies) attacks/i.test(allText);
}

export const COMBAT_EFFECT_PREDICATES: Record<Exclude<CombatEffectKey, 'ALL'>, (c: Character) => boolean> = {
  kokusen: hasKokusen,
  stun: hasStun,
  heal: hasHeal,
  defDown: hasDefDown,
  domain: hasDomain,
  taunt: hasTaunt,
};

export function matchesCombatEffect(char: Character, effectKey: CombatEffectKey): boolean {
  if (effectKey === 'ALL') return true;
  const predicate = COMBAT_EFFECT_PREDICATES[effectKey];
  return predicate ? predicate(char) : true;
}
