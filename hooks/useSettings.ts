import { FontOption } from '@/config/fonts';
import { create } from 'zustand';

export type HighlightMode = 'current' | 'all past' | 'past row';
export interface UserSettings {
  pastWordsColor: string;
  pastWordsHighlightColor: string;
  currentWordColor: string;
  currentWordHighlightColor: string;
  playbackSpeed: number;
  fontSize: number;
  lineHeight: number;
  highlightMode: HighlightMode;
  fontFamily: FontOption;
  theme: 'light' | 'dark' | 'system';
  highlightDelay: number;
  pauseThreshold: number;
  pauseLines: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  pastWordsColor: '#d3d3d3',
  currentWordColor: '#5a5a5a',
  pastWordsHighlightColor: 'transparent',
  currentWordHighlightColor: 'transparent',
  playbackSpeed: 1.0,
  fontSize: 1.375,
  lineHeight: 1.5,
  highlightMode: 'all past',
  fontFamily: 'System Native',
  theme: 'system',
  highlightDelay: 0,
  pauseThreshold: 2,
  pauseLines: 1,
};

const STORAGE_KEY = 'user_transcript_settings';

// Load initial settings from localStorage
const loadSettings = (): UserSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_SETTINGS;

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (e) {
    console.error('Failed to parse settings:', e);
    return DEFAULT_SETTINGS;
  }
};

export const useSettings = create<{
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
  resetSettings: () => void;
}>((set) => ({
  settings: loadSettings(),
  updateSetting: (key, value) =>
    set((state) => {
      const newSettings = {
        ...state.settings,
        [key]: value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      return { settings: newSettings };
    }),
  resetSettings: () =>
    set(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return { settings: DEFAULT_SETTINGS };
    }),
}));
