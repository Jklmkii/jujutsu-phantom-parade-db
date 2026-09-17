import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  // Sound
  soundEnabled: boolean;
  toggleSound: () => void;

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

  // Export / Import / Reset Backup (Ported from Quantora)
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => { success: boolean; message: string };
  resetAllUserData: () => void;
}

export const useJjkStore = create<JjkState>()(
  persist(
    (set, get) => ({
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

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

      // Backup & Restore
      exportBackupJSON: () => {
        const state = get();
        const payload = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          favoriteCharIds: state.favoriteCharIds,
          favoriteMemoryIds: state.favoriteMemoryIds,
          teams: state.teams,
          tierList: state.tierList,
          soundEnabled: state.soundEnabled,
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
            teams: Array.isArray(data.teams) ? data.teams : [],
            tierList: typeof data.tierList === 'object' && data.tierList !== null ? data.tierList : {},
            soundEnabled: typeof data.soundEnabled === 'boolean' ? data.soundEnabled : true,
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
          teams: [],
          tierList: {},
        });
      },
    }),
    {
      name: 'jjkppdb-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
