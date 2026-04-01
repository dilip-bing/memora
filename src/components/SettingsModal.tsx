import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { useRAG } from '../hooks/useRAG';

export default function SettingsModal() {
  const { settings, updateSettings, settingsOpen, setSettingsOpen } = useStore();
  const { checkHealth } = useRAG();
  const [draft, setDraft] = useState(settings);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  useEffect(() => {
    if (settingsOpen) setDraft(settings);
  }, [settingsOpen, settings]);

  if (!settingsOpen) return null;

  const handleSave = () => {
    updateSettings(draft);
    setSettingsOpen(false);
  };

  const handleTest = async () => {
    setHealthStatus('checking');
    // Temporarily apply draft settings for testing
    updateSettings(draft);
    const ok = await checkHealth();
    setHealthStatus(ok ? 'ok' : 'error');
    setTimeout(() => setHealthStatus('idle'), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">API URL</label>
            <input
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              placeholder="https://your-tunnel.trycloudflare.com"
              value={draft.apiUrl}
              onChange={(e) => setDraft({ ...draft, apiUrl: e.target.value.replace(/\/$/, '') })}
            />
            <p className="mt-1 text-xs text-gray-400">Your Cloudflare tunnel or local URL (e.g. http://localhost:8000)</p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key</label>
            <input
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono placeholder-gray-400"
              type="password"
              placeholder="your-api-key"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            />
          </div>

          {/* Default Collection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Collection</label>
            <input
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              placeholder="documents"
              value={draft.defaultCollection}
              onChange={(e) => setDraft({ ...draft, defaultCollection: e.target.value })}
            />
          </div>

          {/* Default Thinking */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Default to Thinking Mode</label>
              <p className="text-xs text-gray-400">New chats start with thinking enabled</p>
            </div>
            <button
              onClick={() => setDraft({ ...draft, defaultThinking: !draft.defaultThinking })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                draft.defaultThinking ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  draft.defaultThinking ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Test connection */}
          <button
            onClick={handleTest}
            disabled={!draft.apiUrl || healthStatus === 'checking'}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              healthStatus === 'ok'
                ? 'bg-emerald-100 text-emerald-700'
                : healthStatus === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
            }`}
          >
            {healthStatus === 'checking' ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Testing...
              </>
            ) : healthStatus === 'ok' ? (
              'Connected!'
            ) : healthStatus === 'error' ? (
              'Connection failed'
            ) : (
              'Test Connection'
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
