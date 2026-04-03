import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import MemoryPanel from './components/MemoryPanel';
import SettingsModal from './components/SettingsModal';
import DocumentsPanel from './components/DocumentsPanel';
import LoginPage from './components/LoginPage';
import { useStore } from './hooks/useStore';
import { useAuth } from './hooks/useAuth';
import { useMemory } from './hooks/useMemory';
import { useEffect } from 'react';

function SetupPrompt() {
  const { toggleSettings } = useStore();

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Connect to your RAG API</h2>
        <p className="text-gray-400 text-sm mb-5">Enter your API URL and key to start chatting with your documents.</p>
        <button
          onClick={toggleSettings}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          Open Settings
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { settings, sidebarOpen } = useStore();
  const { isAuthenticated, token } = useAuth();
  const { loadGlobalMemory } = useMemory();
  const needsSetup = !settings.apiUrl || !settings.apiKey;

  // Set page title
  useEffect(() => {
    document.title = 'Memora — Local RAG Chat';
  }, []);

  // Register user in backend DB once API is configured and user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !token || !settings.apiUrl) return;
    fetch(`${settings.apiUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {}); // fire-and-forget
  }, [isAuthenticated, token, settings.apiUrl]);

  // Load global memory from backend once API is ready
  useEffect(() => {
    if (!isAuthenticated || !settings.apiUrl || !settings.apiKey) return;
    loadGlobalMemory().catch(() => {});
  }, [isAuthenticated, settings.apiUrl, settings.apiKey]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
      <SettingsModal />
      {!needsSetup && <DocumentsPanel />}
    </div>
  );
}
