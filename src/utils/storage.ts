import type { Chat, AppSettings } from '../types';

const CHATS_KEY = 'memora_chats';
const SETTINGS_KEY = 'memora_settings';

// ── Demo credentials (prefilled for contest judges) ──────────────────────
const DEMO_API_URL = 'https://seen-figures-luis-adjusted.trycloudflare.com';
const DEMO_API_KEY = '4002cc5c4d9472f53cc066bfdd098e8c53ebeeddd45d40cc23c15087da2f0364';

const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: DEMO_API_URL,
  apiKey: DEMO_API_KEY,
  defaultCollection: 'documents',
  defaultThinking: true,
  selectedModel: 'gemma4:e2b',
};

// Old model names that should be migrated to the current default
const OLD_DEFAULT_MODELS = ['', 'qwen3.5:9b-q4_K_M'];

export function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) return [];
    // Migrate: add memoryCards if missing
    return JSON.parse(raw).map((c: Chat) => ({
      ...c,
      memoryCards: c.memoryCards ?? [],
    }));
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]): void {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

const OLD_DEMO_URLS = [
  'https://blair-surface-shorter-gerald.trycloudflare.com',
];

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<AppSettings>;
    // If the user still has an old demo URL, replace it with the current one
    if (saved.apiUrl && OLD_DEMO_URLS.includes(saved.apiUrl)) {
      saved.apiUrl = DEMO_API_URL;
    }
    // If the user has an old/blank default model, migrate to the current default
    if (saved.selectedModel !== undefined && OLD_DEFAULT_MODELS.includes(saved.selectedModel)) {
      saved.selectedModel = DEFAULT_SETTINGS.selectedModel;
    }
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
