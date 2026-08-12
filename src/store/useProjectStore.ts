import { create } from 'zustand';
import { FardoConfig, FardoPC, PlatformConfig, CompilerSettings, PlatformAccount } from '../types';

interface ProjectState {
  version: string;
  projectName: string;
  outputDir: string;
  namingPattern: string;
  timerBasePath: string;
  platforms: Record<string, PlatformConfig>;
  pcs: FardoPC[];
  compilerSettings: CompilerSettings;

  // Setters for global config
  setProjectName: (name: string) => void;
  setOutputDir: (dir: string) => void;
  setNamingPattern: (pattern: string) => void;
  setTimerBasePath: (path: string) => void;
  setCompilerSettings: (settings: Partial<CompilerSettings>) => void;
  
  // Platform actions
  updatePlatform: (platformId: string, platform: Partial<PlatformConfig>) => void;
  
  // PC actions
  addPC: () => void;
  updatePC: (pcId: string, updates: Partial<FardoPC>) => void;
  removePC: (pcId: string) => void;
  togglePCEnabled: (pcId: string, enabled: boolean) => void;
  togglePCGame: (pcId: string, gameName: string, enabled: boolean) => void;
  updatePCAccount: (pcId: string, platformId: string, account: PlatformAccount) => void;

  // Bulk persistence & loading
  resetProject: () => void;
  loadProject: (config: FardoConfig) => void;
  getProjectConfig: () => FardoConfig;
}

const defaultPlatforms: Record<string, PlatformConfig> = {
  epic: {
    launcher: 'C:\\Program Files (x86)\\Epic Games\\Launcher\\Engine\\Binaries\\Win64\\EpicGamesLauncher.exe',
    gameBasePath: 'C:\\EpicBats',
    gameExt: '.bat',
    games: ['RocketLeague', 'Fallguys', 'Fortnite'],
    templateCode: '||| filename = {{ gamename }}Cab{{ id }}.exe\n; Epic Template\n'
  },
  ea: {
    launcher: 'C:\\Program Files\\Electronic Arts\\EA Desktop\\EA Desktop\\EALauncher.exe',
    gameBasePath: 'C:\\EAccesos',
    gameExt: '.lnk',
    games: ['Battlefield V', 'FIFA 25'],
    templateCode: '||| filename = {{ gamename }}Cab{{ id }}.exe\n; EA Template\n'
  }
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  version: '2.0.0',
  projectName: 'New Multi-Platform Project',
  outputDir: 'C:\\AutoItBuilds\\Output',
  namingPattern: '{{ gamename }}Cab{{ id }}.exe',
  timerBasePath: 'C:\\Timers',
  platforms: defaultPlatforms,
  pcs: [],
  compilerSettings: {
    aut2exePath: 'C:\\Program Files (x86)\\AutoIt3\\Aut2Exe\\Aut2exe.exe',
    architecture: 'x64',
    compressionLevel: 2,
    isConsoleApp: false,
    maxParallelBuilds: 4,
  },

  setProjectName: (projectName) => set({ projectName }),
  setOutputDir: (outputDir) => set({ outputDir }),
  setNamingPattern: (namingPattern) => set({ namingPattern }),
  setTimerBasePath: (timerBasePath) => set({ timerBasePath }),
  setCompilerSettings: (settings) =>
    set((state) => ({
      compilerSettings: { ...state.compilerSettings, ...settings },
    })),

  updatePlatform: (platformId, platformUpdates) =>
    set((state) => ({
      platforms: {
        ...state.platforms,
        [platformId]: { ...state.platforms[platformId], ...platformUpdates }
      }
    })),

  addPC: () =>
    set((state) => {
      const newId = (state.pcs.length + 1).toString().padStart(2, '0');
      const newPC: FardoPC = {
        id: newId,
        enabled: true,
        shortwait: 10,
        prepasswait: 3,
        accounts: {},
        disabledGames: [],
      };
      return { pcs: [...state.pcs, newPC] };
    }),

  updatePC: (pcId, updates) =>
    set((state) => ({
      pcs: state.pcs.map(pc => pc.id === pcId ? { ...pc, ...updates } : pc)
    })),

  removePC: (pcId) =>
    set((state) => ({
      pcs: state.pcs.filter(pc => pc.id !== pcId)
    })),

  togglePCEnabled: (pcId, enabled) =>
    set((state) => ({
      pcs: state.pcs.map(pc => pc.id === pcId ? { ...pc, enabled } : pc)
    })),

  togglePCGame: (pcId, gameName, enabled) =>
    set((state) => ({
      pcs: state.pcs.map(pc => {
        if (pc.id === pcId) {
          const disabledGames = enabled
            ? pc.disabledGames.filter(g => g !== gameName)
            : [...new Set([...pc.disabledGames, gameName])];
          return { ...pc, disabledGames };
        }
        return pc;
      })
    })),

  updatePCAccount: (pcId, platformId, account) =>
    set((state) => ({
      pcs: state.pcs.map(pc => {
        if (pc.id === pcId) {
          return {
            ...pc,
            accounts: {
              ...pc.accounts,
              [platformId]: account
            }
          };
        }
        return pc;
      })
    })),

  resetProject: () =>
    set({
      version: '2.0.0',
      projectName: 'New Multi-Platform Project',
      outputDir: 'C:\\AutoItBuilds\\Output',
      namingPattern: '{{ gamename }}Cab{{ id }}.exe',
      timerBasePath: 'C:\\Timers',
      platforms: defaultPlatforms,
      pcs: [],
    }),

  loadProject: (config) =>
    set({
      version: config.version || '2.0.0',
      projectName: config.projectName || 'AutoIt Batch Project',
      outputDir: config.outputDir || 'C:\\AutoItBuilds\\Output',
      namingPattern: config.namingPattern || '{{ gamename }}Cab{{ id }}.exe',
      timerBasePath: config.timerBasePath || 'C:\\Timers',
      platforms: config.platforms || defaultPlatforms,
      pcs: config.pcs || [],
    }),

  getProjectConfig: () => {
    const s = get();
    return {
      version: s.version,
      projectName: s.projectName,
      outputDir: s.outputDir,
      namingPattern: s.namingPattern,
      timerBasePath: s.timerBasePath,
      platforms: s.platforms,
      pcs: s.pcs,
    };
  },
}));
