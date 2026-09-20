export type Language = 'pt' | 'en';
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
  description_10?: string;
  image_key?: string;
  icon?: string | null;
  combat_rates?: CombatRates;
}

export interface SkillItem {
  slot: number;
  name: string;
  cost: string;
  description: string;
  description_10?: string;
  image_key?: string;
  icon?: string;
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
  image_key?: string;
  icon?: string;
  sp_description?: string;
  sp?: {
    name?: string;
    description: string;
    image_key?: string;
    icon?: string;
  };
  variants?: SkillVariant[];
}

export interface CombatRates {
  crit_rate?: string;
  crit_dmg?: string;
  black_flash?: string;
  black_flash_dmg?: string;
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
  in_pool?: boolean;
  pool_status?: 'in_pool' | 'waiting' | 'limited';
  sp?: boolean;
  tags?: string[];
  stats: CharacterStats;
  image: string;
  normal_attack?: {
    name: string;
    description: string;
    description_10?: string;
    image_key?: string;
    icon?: string;
    variants?: SkillVariant[];
  };
  skills: SkillItem[];
  ultimate: {
    name: string;
    description: string;
    description_10?: string;
    image_key?: string;
    icon?: string;
    combo?: string;
    variants?: SkillVariant[];
  };
  passives: PassiveItem[];
  auto_skills?: PassiveItem[];
  has_transformation?: boolean;
  transform_name?: string;
  skill_priority?: (number | string)[];
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
  status: 'released' | 'current' | 'upcoming' | string;
  status_label?: string;
  name: string;
  banners?: string[];
  jp_date: string;
  global_date: string;
  days?: string;
}

export type ActiveTab = 
  | 'home' 
  | 'characters' 
  | 'memories' 
  | 'tierlist' 
  | 'teams' 
  | 'buffs' 
  | 'timeline' 
  | 'compare' 
  | 'gacha' 
  | 'dps'
  | 'raids';

export interface OfficialTierSlot {
  characterId: string;
  title: string;
  name: string;
  slug: string;
  element: string;
  rarity: string;
  image: string;
  hasDupeScaling?: boolean;
}

export interface OfficialTierRank {
  rank: string;
  slots: OfficialTierSlot[];
}

export interface OfficialTierCategory {
  id: string;
  title: string;
  description: string;
  tiers: OfficialTierRank[];
}

export interface MetaTeamSlotChar {
  characterId: string;
  title: string;
  name: string;
  element: string;
  rarity: string;
  image: string;
}

export interface MetaTeamSlot {
  role: string;
  main: MetaTeamSlotChar;
  substitutes: MetaTeamSlotChar[];
}

export interface MetaTeam {
  id: string;
  element: string;
  label: string;
  best: boolean;
  summary: string;
  char_notes: { title: string; note: string }[];
  slots: MetaTeamSlot[];
}

export interface BuffItem {
  id: string;
  characterId: string;
  slug: string;
  title: string;
  name: string;
  element: string;
  rarity: string;
  image: string;
  buff: string;
  target: 'AoE' | 'ST' | 'Both' | string;
  maxStack: string;
  statType?: 'Jujutsu' | 'Taijutsu' | 'Both' | 'Damage' | string;
  notes: string;
  category: 'buff' | 'debuff' | 'dmgUp';
}

export interface BuffsData {
  buff: BuffItem[];
  debuff: BuffItem[];
  dmgUp: BuffItem[];
}

export interface CalculatorSavingsPlan {
  currentCubes: number;
  dailyIncome: number;
  selectedBannerIndex: number;
  customLag: number;
  pityPoints: number; // Pontos de Gacha Exclusivo acumulados no banner + Cartas de Ponto de Gacha
  lastUpdatedDate: string; // YYYY-MM-DD local
  autoDailyIncrementEnabled: boolean;
  lastIncrementAmount?: number;
  lastIncrementDays?: number;
}

export interface UpdaterStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseDate?: string;
  percent?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  message?: string;
}

declare global {
  const __APP_VERSION__: string;
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getAppVersion?: () => Promise<string>;
      saveFile: (
        defaultName?: string,
        content?: string,
        filters?: Array<{ name: string; extensions: string[] }>
      ) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
      openFile: (
        filters?: Array<{ name: string; extensions: string[] }>
      ) => Promise<{ success: boolean; content?: string; filePath?: string; canceled?: boolean; error?: string }>;
      checkForUpdates?: () => Promise<{ success: boolean; updateInfo?: unknown; error?: string; message?: string }>;
      installUpdate?: () => Promise<{ success: boolean }>;
      onUpdateStatus?: (callback: (status: UpdaterStatus) => void) => () => void;
    };
  }
}

