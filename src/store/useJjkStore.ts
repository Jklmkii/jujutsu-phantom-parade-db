import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CalculatorSavingsPlan, Language } from '../types';
import { getDeviceLocalDateString, getDaysBetweenDates } from '../utils/date';

export const DEFAULT_SAVINGS_PLAN: CalculatorSavingsPlan = {
  currentCubes: 15000,
  dailyIncome: 350,
  selectedBannerIndex: 161,
  customLag: 79,
  pityPoints: 0,
  lastUpdatedDate: getDeviceLocalDateString(),
  autoDailyIncrementEnabled: true,
  lastIncrementAmount: 0,
  lastIncrementDays: 0,
};

export const DEFAULT_OWNED_CHARACTER_IDS: string[] = [
  '_Heart_s_Resolve__Saki_Rindo',
  '_A_Bad_Match__Nobara_Kugisaki',
  '_Hollow_Purple__Satoru_Gojo',
  '_0_2-Second_Domain_Expansion__Satoru_Gojo',
  '_This_Is_Justice__Suguru_Geto',
  '_Cursed_Energy_Flashes_Black__Yuji_Itadori',
  '_Nimble_Body__Yuji_Itadori',
  '_Battle_of_firepower__Ryomen_Sukuna',
  '_Infuse_Your_Cursed_Energy__Yuji_Itadori',
  '_Smash_It_Into_the_Summer_Sky__Yuji_Itadori',
  '_Inherited_Cursed_Technique__Megumi_Fushiguro',
  '_Rabbit_s_Disruption__Megumi_Fushiguro',
  '_Tool_Manipulation__Momo_Nishimiya',
  '_The_Final_Bullet__Mai_Zen_in',
  '_Zanshin__Kasumi_Miwa',
  '_Sprinting__Kasumi_Miwa',
  '_Awakening__Satoru_Gojo__Teen_',
  '_First-Grade_Sorcerer_s_Skill__Kento_Nanami',
  '_Ariadne_s_Thread_Educator__Masamichi_Yaga',
  '_The_Thrill_Of_The_Fight__Hanami',
  '_Inspiration_From__Death___Mahito',
  '_The_Golden_Age_of_Jujutsu__Noritoshi_Kamo',
  '_Fulfilling_His_Duty_as_the_Older_Brother__Choso',
  '_To_Protect_Non-Sorcerers__Suguru_Geto__Teen_',
  '_Seance__Toji_Fushiguro',
  '_Executioner__Yuta_Okkotsu',
  '_Cursed_Technique_Boost__Kaito_Yuki',
  '_Bond_of_Friendship__Megumi_Fushiguro',
  '_The_Strongest__Satoru_Gojo',
  '_A_Life_Entrusted_to_Me__Yuji_Itadori',
  '_Early_Morning_Departure__Maki_Zen_in',
  '_Don_t_Underestimate_A_Puppet__Panda',
  '_Night-Lurking_Sorcerer__Toge_Inumaki',
  '_Team_Up_If_They_Are_Weak__Maki_Zen_in',
  '_Cursed_Energy_Melody__Yoshinobu_Gakuganji',
  '_Reverse_Cursed_Technique__Shoko_Ieiri',
  '_Keep_Hammering_At_Them__Nobara_Kugisaki',
  '_Longsword_Battle__Maki_Zen_in',
  '_Ratio_Technique__Kento_Nanami',
  '_With_Takada-Chan__Aoi_Todo',
  '_Resolved_Cursed_Speech__Toge_Inumaki',
  '_Young_Fish_And_Reverse_Punishment__Junpei_Yoshino',
  '_Blast_From_The_Past__Aoi_Todo',
  '_Value_Of_Life__Junpei_Yoshino',
  '_A_Clever_Bullet__Mai_Zen_in',
  '_Unfair_Salvation__Megumi_Fushiguro',
  '_Sukuna_s_Vessel__Yuji_Itadori',
  '_To_Stay_True_To_Myself__Nobara_Kugisaki',
  '_Panda_Is_Not_A_Panda__Panda',
  '_Blood_of_the_Big_Three_Families__Noritoshi_Kamo',
  '_Mode__Albatross__Ultimate_Mechamaru',
  '_Just_Bring_It__Saki_Rindo',
  '_I_ve_Seen_It_All__Kokichi_Muta',
  '_Meteor_of_Fierceness__Jogo',
  '_Cursed_Power_of_Words__Toge_Inumaki',
  '_Background_Support__Kiyotaka_Ijichi',
  '_Innate_Talent__Maki_Zen_in',
  '_Take_The_Shortest_Way__Panda',
  '_Ex-Office_Worker_Turned_Jujutsu_Sorcerer__Kento_Nanami',
  '_Determined_Counter__Kasumi_Miwa',
  '_The_Resolve_Of_Being_A_Sorcerer__Kaito_Yuki'
];

export interface TeamMember {
  slot: number; // 1 to 4 frontline, 5 backup
  characterId: string | null;
  memoryId: string | null;
}

export interface CustomTeam {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
}

interface JjkState {
  // Language / Idioma
  language: Language;
  setLanguage: (lang: Language) => void;

  // Sound & Tactical Audio
  soundEnabled: boolean;
  toggleSound: () => void;
  soundVolume: number;
  setSoundVolume: (vol: number) => void;
  isSoundboardOpen: boolean;
  toggleSoundboard: () => void;

  // Settings Modal
  isSettingsOpen: boolean;
  toggleSettings: () => void;

  // Favorites
  favoriteCharIds: string[];
  favoriteMemoryIds: string[];
  toggleFavoriteChar: (id: string) => void;
  toggleFavoriteMemory: (id: string) => void;
  isFavoriteChar: (id: string) => boolean;
  isFavoriteMemory: (id: string) => boolean;

  // Collection / Owned Roster ("Minha Coleção")
  ownedCharacterIds: string[];
  ownedMemoryIds: string[];
  toggleOwnedCharacter: (id: string) => void;
  setOwnedCharacters: (ids: string[]) => void;
  isCharacterOwned: (id: string) => boolean;
  toggleOwnedMemory: (id: string) => void;
  setOwnedMemories: (ids: string[]) => void;
  isMemoryOwned: (id: string) => boolean;

  // Teams
  teams: CustomTeam[];
  addTeam: (team: CustomTeam) => void;
  updateTeam: (team: CustomTeam) => void;
  deleteTeam: (id: string) => void;

  // Custom Tier List
  tierList: Record<string, string>; // charId -> tier (e.g. 'S+', 'S', 'A', 'B', 'C')
  setTierForChar: (charId: string, tier: string) => void;
  removeTierForChar: (charId: string) => void;
  resetTierList: () => void;

  // Tactical Scratchpad (Floating Whiteboard)
  isScratchpadOpen: boolean;
  toggleScratchpad: () => void;

  // Savings Plan & Gacha Pity Calculator
  savingsPlan: CalculatorSavingsPlan;
  updateSavingsPlan: (updates: Partial<CalculatorSavingsPlan>) => void;
  checkAndApplyDailySavings: () => { applied: boolean; daysAdded: number; cubesAdded: number };
  simulateNextDay: () => void;
  resetSavingsPlan: () => void;
  dismissDailyIncrementAlert: () => void;

  // Export / Import / Reset Backup (Ported from Quantora)
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => { success: boolean; message: string };
  resetAllUserData: () => void;
}

export const useJjkStore = create<JjkState>()(
  persist(
    (set, get) => ({
      language: 'pt',
      setLanguage: (lang) => set({ language: lang }),

      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      soundVolume: 0.8,
      setSoundVolume: (vol) => set({ soundVolume: Math.max(0, Math.min(1, vol)) }),
      isSoundboardOpen: false,
      toggleSoundboard: () => set((state) => ({ isSoundboardOpen: !state.isSoundboardOpen })),

      isSettingsOpen: false,
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      favoriteCharIds: [],
      favoriteMemoryIds: [],

      toggleFavoriteChar: (id) => {
        const { favoriteCharIds } = get();
        if (favoriteCharIds.includes(id)) {
          set({ favoriteCharIds: favoriteCharIds.filter((item) => item !== id) });
        } else {
          set({ favoriteCharIds: [...favoriteCharIds, id] });
        }
      },

      toggleFavoriteMemory: (id) => {
        const { favoriteMemoryIds } = get();
        if (favoriteMemoryIds.includes(id)) {
          set({ favoriteMemoryIds: favoriteMemoryIds.filter((item) => item !== id) });
        } else {
          set({ favoriteMemoryIds: [...favoriteMemoryIds, id] });
        }
      },

      isFavoriteChar: (id) => get().favoriteCharIds.includes(id),
      isFavoriteMemory: (id) => get().favoriteMemoryIds.includes(id),

      // Collection / Owned Roster ("Minha Coleção")
      ownedCharacterIds: DEFAULT_OWNED_CHARACTER_IDS,
      ownedMemoryIds: [],

      toggleOwnedCharacter: (id) =>
        set((state) => {
          const exists = state.ownedCharacterIds.includes(id);
          return {
            ownedCharacterIds: exists
              ? state.ownedCharacterIds.filter((cid) => cid !== id)
              : [...state.ownedCharacterIds, id],
          };
        }),

      setOwnedCharacters: (ids) => set({ ownedCharacterIds: ids }),

      isCharacterOwned: (id) => get().ownedCharacterIds.includes(id),

      toggleOwnedMemory: (id) =>
        set((state) => {
          const exists = state.ownedMemoryIds.includes(id);
          return {
            ownedMemoryIds: exists
              ? state.ownedMemoryIds.filter((mid) => mid !== id)
              : [...state.ownedMemoryIds, id],
          };
        }),

      setOwnedMemories: (ids) => set({ ownedMemoryIds: ids }),

      isMemoryOwned: (id) => get().ownedMemoryIds.includes(id),

      // Teams
      teams: [
        {
          id: 'default-team-1',
          name: 'Equipe Mono Azul (Meta)',
          description: 'Focada em combo de alta quebra de postura e dano Taijutsu.',
          members: [
            { slot: 1, characterId: '_Smash_It_Into_the_Summer_Sky__Yuji_Itadori', memoryId: null },
            { slot: 2, characterId: '_0_2_Second_Domain_Expansion__Satoru_Gojo', memoryId: null },
            { slot: 3, characterId: '_Queen_of_Curses__Yuta_Okkotsu', memoryId: null },
            { slot: 4, characterId: '_Team_Up_If_They_Are_Weak__Maki_Zen_in', memoryId: null },
            { slot: 5, characterId: '_Genuine_Jujutsu__Ryomen_Sukuna', memoryId: null },
          ]
        }
      ],

      addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),
      updateTeam: (team) =>
        set((state) => ({
          teams: state.teams.map((t) => (t.id === team.id ? team : t)),
        })),
      deleteTeam: (id) =>
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== id),
        })),

      // Tier List
      tierList: {},
      setTierForChar: (charId, tier) =>
        set((state) => ({
          tierList: { ...state.tierList, [charId]: tier },
        })),
      removeTierForChar: (charId) =>
        set((state) => {
          const next = { ...state.tierList };
          delete next[charId];
          return { tierList: next };
        }),
      resetTierList: () => set({ tierList: {} }),

      // Scratchpad
      isScratchpadOpen: false,
      toggleScratchpad: () => set((state) => ({ isScratchpadOpen: !state.isScratchpadOpen })),

      // Savings Plan & Gacha Pity Calculator
      savingsPlan: DEFAULT_SAVINGS_PLAN,

      updateSavingsPlan: (updates) =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            ...updates,
          },
        })),

      checkAndApplyDailySavings: () => {
        const { savingsPlan } = get();
        const todayStr = getDeviceLocalDateString();

        // Se não houver data gravada anterior, registra a data de hoje como marco inicial
        if (!savingsPlan.lastUpdatedDate) {
          set((state) => ({
            savingsPlan: { 
              ...state.savingsPlan, 
              lastUpdatedDate: todayStr,
              autoDailyIncrementEnabled: state.savingsPlan.autoDailyIncrementEnabled ?? true,
            },
          }));
          return { applied: false, daysAdded: 0, cubesAdded: 0 };
        }

        const daysDiff = getDaysBetweenDates(savingsPlan.lastUpdatedDate, todayStr);
        const isEnabled = savingsPlan.autoDailyIncrementEnabled !== false;

        if (daysDiff > 0 && isEnabled) {
          const income = savingsPlan.dailyIncome || 350;
          const cubesAdded = daysDiff * income;
          const newCurrentCubes = Math.max(0, (savingsPlan.currentCubes || 0) + cubesAdded);

          set((state) => ({
            savingsPlan: {
              ...state.savingsPlan,
              currentCubes: newCurrentCubes,
              lastUpdatedDate: todayStr,
              lastIncrementAmount: cubesAdded,
              lastIncrementDays: daysDiff,
              autoDailyIncrementEnabled: true,
            },
          }));
          return { applied: true, daysAdded: daysDiff, cubesAdded };
        }

        return { applied: false, daysAdded: 0, cubesAdded: 0 };
      },

      simulateNextDay: () => {
        set((state) => {
          const plan = state.savingsPlan;
          return {
            savingsPlan: {
              ...plan,
              currentCubes: plan.currentCubes + plan.dailyIncome,
              lastIncrementAmount: plan.dailyIncome,
              lastIncrementDays: 1,
            },
          };
        });
      },

      resetSavingsPlan: () =>
        set(() => ({
          savingsPlan: {
            ...DEFAULT_SAVINGS_PLAN,
            lastUpdatedDate: getDeviceLocalDateString(),
          },
        })),

      dismissDailyIncrementAlert: () =>
        set((state) => ({
          savingsPlan: {
            ...state.savingsPlan,
            lastIncrementAmount: 0,
            lastIncrementDays: 0,
          },
        })),

      // Backup & Restore
      exportBackupJSON: () => {
        const state = get();
        const payload = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          favoriteCharIds: state.favoriteCharIds,
          favoriteMemoryIds: state.favoriteMemoryIds,
          ownedCharacterIds: state.ownedCharacterIds,
          ownedMemoryIds: state.ownedMemoryIds,
          teams: state.teams,
          tierList: state.tierList,
          soundEnabled: state.soundEnabled,
          savingsPlan: state.savingsPlan,
        };
        return JSON.stringify(payload, null, 2);
      },

      importBackupJSON: (jsonStr: string) => {
        try {
          const data = JSON.parse(jsonStr);
          if (!data || typeof data !== 'object') {
            return { success: false, message: 'Arquivo JSON inválido.' };
          }
          set({
            favoriteCharIds: Array.isArray(data.favoriteCharIds) ? data.favoriteCharIds : [],
            favoriteMemoryIds: Array.isArray(data.favoriteMemoryIds) ? data.favoriteMemoryIds : [],
            ownedCharacterIds: Array.isArray(data.ownedCharacterIds) ? data.ownedCharacterIds : DEFAULT_OWNED_CHARACTER_IDS,
            ownedMemoryIds: Array.isArray(data.ownedMemoryIds) ? data.ownedMemoryIds : [],
            teams: Array.isArray(data.teams) ? data.teams : [],
            tierList: typeof data.tierList === 'object' && data.tierList !== null ? data.tierList : {},
            soundEnabled: typeof data.soundEnabled === 'boolean' ? data.soundEnabled : true,
            language: data.language === 'en' || data.language === 'pt' ? data.language : 'pt',
            savingsPlan:
              data.savingsPlan && typeof data.savingsPlan === 'object'
                ? { ...DEFAULT_SAVINGS_PLAN, ...data.savingsPlan }
                : DEFAULT_SAVINGS_PLAN,
          });
          return { success: true, message: 'Backup importado com sucesso!' };
        } catch {
          return { success: false, message: 'Erro ao processar arquivo JSON.' };
        }
      },

      resetAllUserData: () => {
        set({
          favoriteCharIds: [],
          favoriteMemoryIds: [],
          ownedCharacterIds: DEFAULT_OWNED_CHARACTER_IDS,
          ownedMemoryIds: [],
          teams: [],
          tierList: {},
          savingsPlan: {
            ...DEFAULT_SAVINGS_PLAN,
            lastUpdatedDate: getDeviceLocalDateString(),
          },
        });
      },
    }),
    {
      name: 'jjkppdb-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
