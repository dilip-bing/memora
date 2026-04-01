import { useState, useRef, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { useRAG } from '../hooks/useRAG';
import type { OllamaModel } from '../types';

export default function MessageInput() {
  const { activeChat: getActiveChat, isLoading, settings, updateSettings, toggleMemoryPanel, memoryPanelOpen } = useStore();
  const { sendQuery } = useRAG();
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(settings.defaultThinking);
  const [error, setError] = useState('');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [modelsOpen, setModelsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chat = getActiveChat();

  // Fetch models on mount
  useEffect(() => {
    if (!settings.apiUrl || !settings.apiKey) return;
    fetch(`${settings.apiUrl}/models`, {
      headers: { 'X-API-Key': settings.apiKey },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.models) {
          setModels(data.models);
          if (!settings.selectedModel && data.active_model) {
            updateSettings({ selectedModel: data.active_model });
          }
        }
      })
      .catch(() => {});
  }, [settings.apiUrl, settings.apiKey]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    });
  }, [input]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading || !chat) return;
    setError('');
    const question = input.trim();
    setInput('');
    try {
      await sendQuery(question, thinking);
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
        {/* Thinking toggle */}
        <button
          onClick={() => setThinking(!thinking)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            thinking
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
          title={thinking ? 'Thinking mode: deeper reasoning, slower' : 'Fast mode: quick answers'}
        >
          {thinking ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          {thinking ? 'Think' : 'Fast'}
        </button>

        {/* Memory toggle */}
        <button
          onClick={toggleMemoryPanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            memoryPanelOpen
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : chat.memory
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title="Toggle memory panel"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Memory{chat.memory ? ' *' : ''}
        </button>

        {/* Collection badge */}
        <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
          {chat.collection}
        </span>

        {/* Model selector */}
        <div className="relative ml-auto">
          <button
            onClick={() => setModelsOpen(!modelsOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            title="Select model"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            {settings.selectedModel
              ? settings.selectedModel.split(':')[0]
              : 'default'}
          </button>
          {modelsOpen && (
            <div className="absolute bottom-full mb-1 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 max-h-60 overflow-y-auto">
              <button
                onClick={() => { updateSettings({ selectedModel: '' }); setModelsOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${!settings.selectedModel ? 'text-blue-700 font-semibold bg-blue-50' : 'text-gray-700'}`}
              >
                Default (server config)
              </button>
              {models
                .filter((m) => !m.name.includes('embed') && !m.name.includes('bge'))
                .map((m) => (
                  <button
                    key={m.name}
                    onClick={() => { updateSettings({ selectedModel: m.name }); setModelsOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${settings.selectedModel === m.name ? 'text-blue-700 font-semibold bg-blue-50' : 'text-gray-700'}`}
                  >
                    {m.name}
                    <span className="ml-2 text-gray-400">
                      {(m.size / 1e9).toFixed(1)}GB
                    </span>
                  </button>
                ))}
              {models.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400">No models found</div>
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
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
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
      </div>
    </div>
  );
}
