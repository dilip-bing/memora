import type { Chat, AppSettings } from '../types';

const CHATS_KEY = 'memora_chats';
const SETTINGS_KEY = 'memora_settings';

// ── Demo credentials (prefilled for contest judges) ──────────────────────
const DEMO_API_URL = 'https://blair-surface-shorter-gerald.trycloudflare.com';
const DEMO_API_KEY = '4002cc5c4d9472f53cc066bfdd098e8c53ebeeddd45d40cc23c15087da2f0364';

const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: DEMO_API_URL,
  apiKey: DEMO_API_KEY,
  defaultCollection: 'documents',
  defaultThinking: true,
  selectedModel: '',
};

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

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
