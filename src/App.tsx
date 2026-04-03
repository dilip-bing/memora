import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import MemoryPanel from './components/MemoryPanel';
import DocumentsPanel from './components/DocumentsPanel';
import SettingsModal from './components/SettingsModal';
import LoginPage from './components/LoginPage';
import { useStore } from './hooks/useStore';
import { useAuth } from './hooks/useAuth';
import { useMemory } from './hooks/useMemory';
import { useEffect, useRef } from 'react';

function SetupPrompt() {
  const { toggleSettings } = useStore();

  return (
    <div className="flex-1 flex items-center justify-center bg-[#EDE9DF] dark:bg-[#1A1A18]">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white dark:bg-[#252523] flex items-center justify-center shadow-sm">
          <svg className="w-8 h-8 text-[#CE5630]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A18] dark:text-[#F1EFE8] mb-2">Connect to your RAG API</h2>
        <p className="text-[#5F5E5A] dark:text-[#888780] text-sm mb-5">Enter your API URL and key to get started.</p>
        <button
          onClick={toggleSettings}
          className="px-6 py-2.5 bg-[#CE5630] hover:bg-[#B84A28] text-white rounded-lg transition-all text-sm font-medium shadow-sm"
        >
          Open Settings
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { settings, sidebarOpen, chats, activeChatId, setChatsFromBackend } = useStore();
  const { isAuthenticated, token, user } = useAuth();
  const { loadGlobalMemory } = useMemory();
  const needsSetup = !settings.apiUrl || !settings.apiKey;
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef<Record<string, number>>({});
  const prevChatsRef = useRef(chats);

  // Set page title
  useEffect(() => {
    document.title = 'Memora — Local RAG Chat';
  }, []);

  const apiHeaders = {
    'Content-Type': 'application/json',
    'X-API-Key': settings.apiKey,
  };

  // Register user in backend DB once API is configured and user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !token || !settings.apiUrl) return;
    fetch(`${settings.apiUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }, [isAuthenticated, token, settings.apiUrl]);

  // Load global memory from backend once API is ready
  useEffect(() => {
    if (!isAuthenticated || !settings.apiUrl || !settings.apiKey) return;
    loadGlobalMemory().catch(() => {});
  }, [isAuthenticated, settings.apiUrl, settings.apiKey]);

  // ── Chat sync ────────────────────────────────────────────────────────────

  // On login + API ready: pull chats from backend (source of truth)
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !settings.apiUrl || !settings.apiKey) return;
    fetch(`${settings.apiUrl}/chats?user_id=${user.id}`, { headers: apiHeaders })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.chats?.length > 0) {
          setChatsFromBackend(data.chats);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, settings.apiUrl, settings.apiKey]);

  // After each chat change: debounce-sync the active chat to backend
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !settings.apiUrl || !settings.apiKey || !activeChatId) return;
    const chat = chats.find((c) => c.id === activeChatId);
    if (!chat) return;
    // Skip if this chat is currently streaming (updateMessage fires rapidly)
    if (chat.messages.some((m) => m.isStreaming)) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const lastSynced = lastSyncedRef.current[chat.id] ?? 0;
      if (chat.updatedAt <= lastSynced) return; // nothing new
      fetch(`${settings.apiUrl}/chats/${chat.id}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify({ user_id: user.id, chat }),
      })
        .then(() => { lastSyncedRef.current[chat.id] = chat.updatedAt; })
        .catch(() => {});
    }, 1500); // 1.5 s debounce
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats, activeChatId, isAuthenticated, user?.id]);

  // When chats are removed locally, delete them from backend too
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !settings.apiUrl || !settings.apiKey) return;
    const prev = prevChatsRef.current;
    const deleted = prev.filter((p) => !chats.some((c) => c.id === p.id));
    deleted.forEach((c) => {
      fetch(`${settings.apiUrl}/chats/${c.id}?user_id=${user.id}`, {
        method: 'DELETE',
        headers: apiHeaders,
      }).catch(() => {});
    });
    prevChatsRef.current = chats;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-[#EDE9DF] dark:bg-[#1A1A18] overflow-hidden">
      <Sidebar />

      <div className={`flex-1 flex flex-col min-w-0 transition-all ${!sidebarOpen ? 'ml-0' : ''}`}>
        {needsSetup ? (
          <SetupPrompt />
        ) : (
          <>
            <ChatWindow />
            <MessageInput />
          </>
        )}
      </div>

      <MemoryPanel />
      <DocumentsPanel />
      <SettingsModal />
    </div>
  );
}
