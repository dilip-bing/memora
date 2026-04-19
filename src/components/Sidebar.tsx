import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
  const {
    chats,
    activeChatId,
    sidebarOpen,
    createChat,
    deleteChat,
    setActiveChat,
    renameChat,
    toggleSidebar,
    toggleSettings,
    toggleMemoryPanel,
    toggleDocumentsPanel,
    clearChats,
  } = useStore();

  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const commitRename = () => {
    if (editingId && editTitle.trim()) {
      renameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      clearChats(); // wipe localStorage chats so the next account starts fresh
      logout();
    }
  };

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-3 bg-[#F0EDE4] dark:bg-[#181817] rounded-lg shadow-md border border-[#E8E5DB] dark:border-[#2C2C2A] hover:bg-white dark:hover:bg-[#212120] transition-colors flex items-center justify-center"
        title="Open sidebar"
      >
        <img src="/logo1.png" alt="Memora" className="w-8 h-8 object-contain" />
      </button>
    );
  }

  return (
    <aside className="w-72 h-screen bg-[#F0EDE4] dark:bg-[#181817] border-r border-[#E8E5DB] dark:border-[#2C2C2A] flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-[#E8E5DB] dark:border-[#2C2C2A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo1.png" alt="Memora" className="w-9 h-9 object-contain" />
          <h1 className="text-lg font-semibold text-[#CE5630] tracking-tight">Memora</h1>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-white dark:hover:bg-[#212120] rounded-md transition-colors"
          title="Close sidebar"
        >
          <svg className="w-4 h-4 text-[#5F5E5A] dark:text-[#888780]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={createChat}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#CE5630] hover:bg-[#B84A28] text-white rounded-lg transition-all text-sm font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {chats.length === 0 && (
          <p className="text-center text-[#AAA8A0] dark:text-[#5F5E5A] text-sm mt-8 px-4">
            No chats yet. Start a new conversation!
          </p>
        )}
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group flex items-center gap-1 px-3 py-2.5 mx-1 mb-0.5 rounded-lg cursor-pointer transition-all ${
              chat.id === activeChatId
                ? 'bg-white dark:bg-[#2C2C2A] text-[#1A1A18] dark:text-[#F1EFE8] border border-[#D8D6CF] dark:border-[#2C2C2A]'
                : 'hover:bg-white/50 dark:hover:bg-[#212120] text-[#3A3936] dark:text-[#D3D1C7]'
            }`}
            onClick={() => setActiveChat(chat.id)}
          >
            <svg className="w-4 h-4 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>

            {editingId === chat.id ? (
              <input
                className="flex-1 text-sm bg-white dark:bg-[#2A2A27] border border-[#D8D6CF] dark:border-[#2C2C2A] rounded px-2 py-0.5 outline-none text-[#1A1A18] dark:text-[#F1EFE8]"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-sm truncate">{chat.title}</span>
            )}

            {/* Actions */}
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(chat.id, chat.title);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Rename"
              >
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Delete"
              >
                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-[#E8E5DB] dark:border-[#2C2C2A]">
        {/* Common Documents */}
        <div className="p-3">
          <button
            onClick={toggleDocumentsPanel}
            className="w-full flex items-center gap-2 px-3 py-2 text-[#3A3936] dark:text-[#888780] hover:bg-white dark:hover:bg-[#212120] rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Common Documents
          </button>
        </div>

        {/* Memory */}
        <div className="p-3 pt-0">
          <button
            onClick={toggleMemoryPanel}
            className="w-full flex items-center gap-2 px-3 py-2 text-[#3A3936] dark:text-[#888780] hover:bg-white dark:hover:bg-[#212120] rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Memory
          </button>
        </div>

        {/* Settings */}
        <div className="p-3 pt-0">
          <button
            onClick={toggleSettings}
            className="w-full flex items-center gap-2 px-3 py-2 text-[#3A3936] dark:text-[#888780] hover:bg-white dark:hover:bg-[#212120] rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-3 pt-0 relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white dark:hover:bg-[#212120] rounded-lg transition-colors"
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full ring-2 ring-[#CE5630]/20"
              />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-[#1A1A18] dark:text-[#F1EFE8] truncate">{user.name}</p>
                <p className="text-xs text-[#5F5E5A] dark:text-[#888780] truncate">{user.email}</p>
              </div>
              <svg className={`w-4 h-4 text-[#AAA8A0] dark:text-[#5F5E5A] transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-[#2A2A27] border border-[#D8D6CF] dark:border-[#2C2C2A] rounded-lg shadow-lg py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
