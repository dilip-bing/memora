import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Chat, Message, AppSettings, MemoryCard } from '../types';
import { loadChats, saveChats, loadSettings, saveSettings } from '../utils/storage';

interface Store {
  // Chats
  chats: Chat[];
  activeChatId: string | null;
  activeChat: () => Chat | null;

  createChat: () => void;
  deleteChat: (id: string) => void;
  setActiveChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  updateMemory: (chatId: string, memory: string) => void;
  updateChatMemoryCards: (chatId: string, cards: MemoryCard[]) => void;
  updateChatCollection: (chatId: string, collection: string) => void;

  // Backend sync
  setChatsFromBackend: (chats: Chat[]) => void;

  // Global (user-level) memory
  globalMemoryCards: MemoryCard[];
  setGlobalMemoryCards: (cards: MemoryCard[]) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // UI state
  sidebarOpen: boolean;
  memoryPanelOpen: boolean;
  documentsPanelOpen: boolean;
  settingsOpen: boolean;
  toggleSidebar: () => void;
  toggleMemoryPanel: () => void;
  toggleDocumentsPanel: () => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;

  // Memory panel prefill (set when user clicks "save to memory" on a message)
  memoryBrainDumpPrefill: string;
  setMemoryBrainDumpPrefill: (text: string) => void;

  // Loading
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<Store>((set, get) => ({
  chats: loadChats(),
  activeChatId: loadChats().length > 0 ? loadChats()[0].id : null,

  activeChat: () => {
    const { chats, activeChatId } = get();
    return chats.find((c) => c.id === activeChatId) ?? null;
  },

  createChat: () => {
    const id = uuid();
    const newChat: Chat = {
      id,
      title: 'New Chat',
      messages: [],
      memory: '',
      memoryCards: [],
      collection: get().settings.defaultCollection,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const chats = [newChat, ...get().chats];
    saveChats(chats);
    set({ chats, activeChatId: id });
  },

  deleteChat: (id: string) => {
    const chats = get().chats.filter((c) => c.id !== id);
    saveChats(chats);
    const activeChatId = get().activeChatId === id
      ? (chats[0]?.id ?? null)
      : get().activeChatId;
    set({ chats, activeChatId });
  },

  setActiveChat: (id: string) => set({ activeChatId: id }),

  renameChat: (id: string, title: string) => {
    const chats = get().chats.map((c) =>
      c.id === id ? { ...c, title, updatedAt: Date.now() } : c
    );
    saveChats(chats);
    set({ chats });
  },

  addMessage: (chatId: string, message: Message) => {
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      const messages = [...c.messages, message];
      const title = c.messages.length === 0 && message.role === 'user'
        ? message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '')
        : c.title;
      return { ...c, messages, title, updatedAt: Date.now() };
    });
    saveChats(chats);
    set({ chats });
  },

  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => {
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      const messages = c.messages.map((m) =>
        m.id === messageId ? { ...m, ...updates } : m
      );
      return { ...c, messages, updatedAt: Date.now() };
    });
    saveChats(chats);
    set({ chats });
  },

  updateMemory: (chatId: string, memory: string) => {
    const chats = get().chats.map((c) =>
      c.id === chatId ? { ...c, memory, updatedAt: Date.now() } : c
    );
    saveChats(chats);
    set({ chats });
  },

  updateChatMemoryCards: (chatId: string, cards: MemoryCard[]) => {
    const chats = get().chats.map((c) =>
      c.id === chatId ? { ...c, memoryCards: cards, updatedAt: Date.now() } : c
    );
    saveChats(chats);
    set({ chats });
  },

  // Replace local chats with backend chats (merge: backend wins, keep any local-only chats)
  setChatsFromBackend: (backendChats: Chat[]) => {
    const { chats: localChats, activeChatId } = get();
    const backendIds = new Set(backendChats.map((c) => c.id));
    // Keep local chats not yet synced to backend, prepend backend chats
    const localOnly = localChats.filter((c) => !backendIds.has(c.id));
    const merged = [...backendChats, ...localOnly];
    saveChats(merged);
    const newActiveId = activeChatId && merged.some((c) => c.id === activeChatId)
      ? activeChatId
      : (merged[0]?.id ?? null);
    set({ chats: merged, activeChatId: newActiveId });
  },

  globalMemoryCards: [],
  setGlobalMemoryCards: (cards: MemoryCard[]) => set({ globalMemoryCards: cards }),

  updateChatCollection: (chatId: string, collection: string) => {
    const chats = get().chats.map((c) =>
      c.id === chatId ? { ...c, collection, updatedAt: Date.now() } : c
    );
    saveChats(chats);
    set({ chats });
  },

  // Settings
  settings: loadSettings(),

  updateSettings: (partial: Partial<AppSettings>) => {
    const settings = { ...get().settings, ...partial };
    saveSettings(settings);
    set({ settings });
  },

  // UI
  sidebarOpen: true,
  memoryPanelOpen: false,
  documentsPanelOpen: false,
  settingsOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleMemoryPanel: () => set((s) => ({ memoryPanelOpen: !s.memoryPanelOpen })),
  toggleDocumentsPanel: () => set((s) => ({ documentsPanelOpen: !s.documentsPanelOpen })),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),

  // Memory panel prefill
  memoryBrainDumpPrefill: '',
  setMemoryBrainDumpPrefill: (text: string) => set({ memoryBrainDumpPrefill: text }),

  // Loading
  isLoading: false,
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
