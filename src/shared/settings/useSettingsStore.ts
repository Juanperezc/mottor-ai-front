import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ImportMode = 'sync' | 'queue';

interface SettingsState {
  importMode: ImportMode;
  setImportMode: (mode: ImportMode) => void;
}

export const SETTINGS_KEY = 'mottor.settings';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      importMode: 'sync',
      setImportMode: (importMode) => set({ importMode }),
    }),
    { name: SETTINGS_KEY, partialize: ({ importMode }) => ({ importMode }) },
  ),
);
