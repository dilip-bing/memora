import { useState, useRef, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { useRAG } from '../hooks/useRAG';
import type { OllamaModel } from '../types';

export default function MessageInput() {
  const { activeChat: getActiveChat, isLoading, settings, updateSettings, toggleMemoryPanel, memoryPanelOpen, globalMemoryCards } = useStore();
  const { sendQuery } = useRAG();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showThinkWarning, setShowThinkWarning] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [activeModel, setActiveModel] = useState('');
  const [modelsOpen, setModelsOpen] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chat = getActiveChat();

  const fetchModels = async () => {
    if (!settings.apiUrl || !settings.apiKey) return;
    setModelsLoading(true);
    try {
      const res = await fetch(`${settings.apiUrl}/models`, {
        headers: { 'X-API-Key': settings.apiKey },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.models) {
        setModels(data.models);
        setActiveModel(data.active_model || '');
        if (!settings.selectedModel && data.active_model) {
          updateSettings({ selectedModel: data.active_model });
        }
      }
    } catch {
      // silently fail
    } finally {
      setModelsLoading(false);
    }
  };

  // Fetch models on mount
  useEffect(() => { fetchModels(); }, [settings.apiUrl, settings.apiKey]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelsOpen(false);
      }
    };
    if (modelsOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modelsOpen]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    });
  }, [input]);

  const handleSubmit = async (useThinkMode = false) => {
    if (!input.trim() || isLoading || !chat) return;
    
    // Show warning for think mode
    if (useThinkMode && !showThinkWarning) {
      setShowThinkWarning(true);
      return;
    }
    
    setError('');
    setShowThinkWarning(false);
    const question = input.trim();
    setInput('');
    try {
      await sendQuery(question, useThinkMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!chat) return null;

  return (
    <div className="border-t border-gray-200 bg-white px-4 sm:px-8 py-4">
      {/* Think mode warning */}
      {showThinkWarning && (
        <div className="mb-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 mb-1">Think Mode - Deep Reasoning</h4>
              <p className="text-sm text-amber-800 mb-3">
                This mode uses deeper reasoning which takes approximately <strong>3-10 minutes</strong> per query. 
                A progress bar will show activity.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50"
                >
                  Continue with Think Mode
                </button>
                <button
                  onClick={() => setShowThinkWarning(false)}
                  className="px-4 py-1.5 bg-white border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center gap-3 mb-2">
        {/* Memory toggle */}
        <button
          onClick={toggleMemoryPanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            memoryPanelOpen
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : (chat.memoryCards?.length ?? 0) > 0 || globalMemoryCards.length > 0
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title="Toggle memory panel"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Memory{(chat.memoryCards?.length ?? 0) + globalMemoryCards.length > 0 ? ` (${(chat.memoryCards?.length ?? 0) + globalMemoryCards.length})` : ''}
        </button>

        {/* Collection badge */}
        <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
          {chat.collection}
        </span>

        {/* Model selector */}
        <div className="relative ml-auto" ref={dropdownRef}>
          <button
            onClick={() => { setModelsOpen(!modelsOpen); if (!modelsOpen) fetchModels(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            title={`Model: ${settings.selectedModel || activeModel || 'not set'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            {settings.selectedModel || activeModel || 'Model'}
            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {modelsOpen && (
            <div className="absolute bottom-full mb-1 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 max-h-72 overflow-y-auto">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Model</span>
                <button
                  onClick={fetchModels}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Refresh models"
                >
                  <svg className={`w-3.5 h-3.5 ${modelsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              {modelsLoading && models.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">Loading models...</div>
              ) : models.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">
                  No models found.<br />
                  <span className="text-gray-300">Check API URL & key in Settings</span>
                </div>
              ) : (
                models
                  .filter((m) => !m.name.includes('embed') && !m.name.includes('bge'))
                  .map((m) => {
                    const isSelected = settings.selectedModel === m.name;
                    const isDefault = m.name === activeModel;
                    return (
                      <button
                        key={m.name}
                        onClick={() => { updateSettings({ selectedModel: m.name }); setModelsOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50 flex items-center justify-between transition-colors ${
                          isSelected ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>{m.name}</span>
                          {isDefault && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 text-[10px] font-medium">
                              default
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 shrink-0">
                          {(m.size / 1e9).toFixed(1)}GB
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 transition-colors"
            placeholder="Ask something about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
        </div>
        <button
          onClick={() => handleSubmit(false)}
          disabled={!input.trim() || isLoading}
          className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          title="Send (Fast mode)"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={!input.trim() || isLoading}
          className="shrink-0 px-3 h-10 rounded-xl bg-purple-600 text-white flex items-center gap-1.5 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm text-xs font-medium"
          title="Think mode - Deep reasoning (3-10 min)"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Think
        </button>
      </div>
    </div>
  );
}
