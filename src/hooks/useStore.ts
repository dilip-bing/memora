import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { Chat, Message, AppSettings } from '../types';
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
  updateMemory: (chatId: string, memory: string) => void;
  updateChatCollection: (chatId: string, collection: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // UI state
  sidebarOpen: boolean;
  memoryPanelOpen: boolean;
  settingsOpen: boolean;
  toggleSidebar: () => void;
  toggleMemoryPanel: () => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;

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

  updateMemory: (chatId: string, memory: string) => {
    const chats = get().chats.map((c) =>
      c.id === chatId ? { ...c, memory, updatedAt: Date.now() } : c
    );
    saveChats(chats);
    set({ chats });
  },

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
  settingsOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleMemoryPanel: () => set((s) => ({ memoryPanelOpen: !s.memoryPanelOpen })),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),

  // Loading
  isLoading: false,
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
