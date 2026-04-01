import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';

export default function MemoryPanel() {
  const { activeChat: getActiveChat, updateMemory, memoryPanelOpen, toggleMemoryPanel } = useStore();
  const chat = getActiveChat();
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (chat) setDraft(chat.memory);
  }, [chat?.id, chat?.memory]);

  if (!memoryPanelOpen || !chat) return null;

  const handleSave = () => {
    updateMemory(chat.id, draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges = draft !== chat.memory;

  return (
    <div className="w-80 h-full border-l border-gray-200 bg-white flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-700">Memory</h3>
        </div>
        <button
          onClick={toggleMemoryPanel}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Description */}
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
        <p className="text-xs text-amber-700 leading-relaxed">
          Context sent with every message in this chat. Add information about yourself, preferences, or any background the AI should know.
        </p>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4 flex flex-col gap-3">
        <textarea
          className="flex-1 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-gray-400 transition-all"
          placeholder="Example:&#10;My name is Dilip.&#10;I'm a developer working on RAG systems.&#10;I prefer concise, technical answers.&#10;Always include code examples when relevant."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
            saved
              ? 'bg-emerald-100 text-emerald-700'
              : hasChanges
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saved ? 'Saved!' : hasChanges ? 'Save Memory' : 'No changes'}
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
        <span>{draft.length} chars</span>
        <span>{draft.split(/\n/).filter(Boolean).length} lines</span>
      </div>
    </div>
  );
}
