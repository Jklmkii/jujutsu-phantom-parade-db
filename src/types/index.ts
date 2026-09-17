export type Rarity = 'SSR' | 'SR' | 'R';
export type ElementType = 'Blue' | 'Red' | 'Green' | 'Yellow';

export interface CharacterStats {
  hp: string;
  attack: string;
  jujutsu: string;
  initial_energy: string;
  max_energy: string;
  special_gauge: string;
}

export interface SkillVariant {
  id: string;
  label: string;
  name: string;
  cost: string;
  description: string;
  combat_rates?: CombatRates;
}

export interface SkillItem {
  slot: number;
  name: string;
  cost: string;
  description: string;
  changed?: {
    name: string;
    cost: string;
    description: string;
  };
  variants?: SkillVariant[];
}

export interface PassiveItem {
  name: string;
  description: string;
}

export interface CombatRates {
  crit_rate?: string;
  crit_dmg?: string;
  black_flash?: string;
}

export interface Character {
  id: string;
  title: string;
  name: string;
  epithet: string;
  card_name: string;
  rarity: Rarity;
  element: ElementType | string;
  role: string;
  focus: string;
  affiliation: string;
  release_date: string;
  limited: boolean;
  stats: CharacterStats;
  image: string;
  normal_attack?: {
    name: string;
    description: string;
    variants?: SkillVariant[];
  };
  skills: SkillItem[];
  ultimate: {
    name: string;
    description: string;
    combo?: string;
    variants?: SkillVariant[];
  };
  passives: PassiveItem[];
  has_transformation?: boolean;
  transform_name?: string;
  skill_priority?: string[];
  combat_rates?: CombatRates;
}

export interface Memory {
  id: string;
  title: string;
  rarity: Rarity;
  release_date: string;
  stats: {
    hp: string;
    taijutsu: string;
    jujutsu: string;
  };
  active_cooldown: string;
  passive_cooldown: string;
  image: string;
  active_skill?: {
    description: string;
    cooldown?: string;
  };
  passive_skill?: {
    description: string;
  };
}

export interface TimelineEvent {
  index: number;
  status: string;
  name: string;
  jp_date: string;
  global_date: string;
  days: string;
}

export type ActiveTab = 'home' | 'characters' | 'memories' | 'tierlist' | 'teams' | 'releases' | 'timeline';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      saveFile: (
        defaultName?: string,
        content?: string,
        filters?: Array<{ name: string; extensions: string[] }>
      ) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
      openFile: (
        filters?: Array<{ name: string; extensions: string[] }>
      ) => Promise<{ success: boolean; content?: string; filePath?: string; canceled?: boolean; error?: string }>;
    };
  }
}

