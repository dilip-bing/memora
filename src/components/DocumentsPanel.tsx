import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';

interface Document {
  filename: string;
  relative_path: string;
  size_bytes: number;
  modified_at: string;
  extension: string;
}

type TabType = 'chat' | 'user';

const EXT_COLOR: Record<string, string> = {
  '.pdf': 'bg-red-100 text-red-600',
  '.txt': 'bg-blue-100 text-blue-600',
  '.md': 'bg-gray-100 text-gray-600',
  '.docx': 'bg-indigo-100 text-indigo-600',
  '.csv': 'bg-emerald-100 text-emerald-600',
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface ScopedTabProps {
  apiUrl: string;
  apiKey: string;
  scope: TabType;
  scopeId: string | undefined;
  scopeLabel: string;
  emptyHint: string;
}

function ScopedTab({ apiUrl, apiKey, scope, scopeId, scopeLabel, emptyHint }: ScopedTabProps) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers: Record<string, string> = { 'X-API-Key': apiKey };

  const buildScopeParams = () => {
    const p = new URLSearchParams({ scope });
    if (scope === 'chat' && scopeId) p.set('chat_id', scopeId);
    if (scope === 'user' && scopeId) p.set('user_id', scopeId);
    return p.toString();
  };

  const fetchDocs = useCallback(async () => {
    if (!apiUrl || !apiKey) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/documents?${buildScopeParams()}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDocs(data.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, apiKey, scope, scopeId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!scopeId) {
      setError(scope === 'chat' ? 'No active chat — create a chat first.' : 'Not signed in — please sign in first.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');

    let uploaded = 0;
    for (const file of Array.from(files)) {
      try {
        const params = new URLSearchParams({ scope });
        if (scope === 'chat') params.set('chat_id', scopeId);
        if (scope === 'user') params.set('user_id', scopeId);

        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${apiUrl}/documents/upload?${params}`, {
          method: 'POST',
          headers,
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(err.detail || `HTTP ${res.status}`);
        }
        uploaded++;
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }

    if (uploaded > 0) {
      setSuccess(`${uploaded} file(s) uploaded and indexed`);
      setTimeout(() => setSuccess(''), 4000);
      fetchDocs();
    }
    setUploading(false);
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete "${filename}" from ${scopeLabel}?`)) return;
    try {
      const params = new URLSearchParams({ scope });
      if (scope === 'chat' && scopeId) params.set('chat_id', scopeId);
      if (scope === 'user' && scopeId) params.set('user_id', scopeId);

      const res = await fetch(`${apiUrl}/documents/${encodeURIComponent(filename)}?${params}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (!scopeId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Upload area */}
      <div className="px-5 py-4 border-b border-gray-100">
        <label
          className={`flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            uploading
              ? 'border-indigo-300 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          <input
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.txt,.docx,.md,.csv"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
          {uploading ? (
            <svg className="w-5 h-5 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
          <span className="text-xs text-gray-500">
            {uploading ? 'Uploading...' : 'PDF, TXT, DOCX, MD, CSV'}
          </span>
        </label>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-5 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
      )}
      {success && (
        <div className="mx-5 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600">{success}</div>
      )}

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 max-h-64">
        {loading ? (
          <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs">No documents in {scopeLabel} yet</div>
        ) : (
          <div className="space-y-1.5">
            {docs.map((doc) => (
              <div key={doc.relative_path} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 group">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${EXT_COLOR[doc.extension] || 'bg-gray-100 text-gray-500'}`}>
                  {doc.extension.slice(1)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{doc.filename}</p>
                  <p className="text-xs text-gray-400">
                    {formatSize(doc.size_bytes)} &middot; {new Date(doc.modified_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.filename)}
                  className="hidden group-hover:flex p-1.5 hover:bg-red-100 rounded-md transition-colors items-center justify-center"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
        <span>{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
        <button onClick={fetchDocs} className="text-indigo-500 hover:text-indigo-700 font-medium">Refresh</button>
      </div>
    </div>
  );
}

export default function DocumentsPanel() {
  const { settings, activeChat: getActiveChat, documentsPanelOpen, toggleDocumentsPanel } = useStore();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('user');

  const chat = getActiveChat();

  if (!documentsPanelOpen) {
    return null;
  }

  const tabs: { id: TabType; icon: string; label: string }[] = [
    { id: 'chat', icon: '💬', label: 'This Chat' },
    { id: 'user', icon: '👤', label: 'My Profile' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-gray-800">Documents</h2>
          <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab description */}
        <div className="px-5 pt-3 pb-1 shrink-0">
          {activeTab === 'chat' ? (
            <p className="text-xs text-gray-400">
              Documents uploaded here are private to <span className="font-medium text-gray-600">{chat?.title || 'this chat'}</span> — the AI will use them when answering questions in this conversation.
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              Documents uploaded here are part of your personal knowledge base and available across all your chats.
            </p>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'chat' ? (
          <ScopedTab
            apiUrl={settings.apiUrl}
            apiKey={settings.apiKey}
            scope="chat"
            scopeId={chat?.id}
            scopeLabel="this chat"
            emptyHint="Create or select a chat first to upload documents to it."
          />
        ) : (
          <ScopedTab
            apiUrl={settings.apiUrl}
            apiKey={settings.apiKey}
            scope="user"
            scopeId={user?.id}
            scopeLabel="your profile"
            emptyHint="Sign in with Google to upload documents to your personal profile."
          />
        )}
      </div>
    </div>
  );
}
