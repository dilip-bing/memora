import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useStore } from '../hooks/useStore';
import { useMemory } from '../hooks/useMemory';
import type { MemoryCard, MemoryCardType, MemoryImportance } from '../types';

// ── Card type config ──────────────────────────────────────────────────────────
const CARD_CONFIG: Record<MemoryCardType, {
  label: string; icon: string;
  bg: string; border: string; text: string; badge: string;
}> = {
  fact:       { label: 'Fact',       icon: '👤', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700'   },
  preference: { label: 'Preference', icon: '⚡', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  badge: 'bg-green-100 text-green-700'  },
  context:    { label: 'Context',    icon: '📍', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
  skill:      { label: 'Skill',      icon: '🎯', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
  goal:       { label: 'Goal',       icon: '🚀', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  badge: 'bg-amber-100 text-amber-700'  },
};

const IMPORTANCE_DOT: Record<MemoryImportance, string> = {
  high:   'bg-red-400',
  medium: 'bg-yellow-400',
  low:    'bg-gray-300',
};

const CARD_TYPES: MemoryCardType[] = ['fact', 'preference', 'context', 'skill', 'goal'];

// ── Single card component ─────────────────────────────────────────────────────
function CardItem({
  card,
  onDelete,
  onEdit,
}: {
  card: MemoryCard;
  onDelete: () => void;
  onEdit: (updated: MemoryCard) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.content);
  const cfg = CARD_CONFIG[card.type];

  const commitEdit = () => {
    if (draft.trim()) onEdit({ ...card, content: draft.trim() });
    setEditing(false);
  };

  return (
    <div className={`group relative rounded-xl border p-3 flex flex-col gap-2 transition-shadow hover:shadow-sm ${cfg.bg} ${cfg.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${cfg.text}`}>
          {cfg.icon} {cfg.label}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${IMPORTANCE_DOT[card.importance]}`}
            title={`${card.importance} importance`}
          />
          <div className="hidden group-hover:flex gap-0.5 ml-1">
            <button
              onClick={() => { setDraft(card.content); setEditing(true); }}
              className="p-1 rounded hover:bg-white/70 transition-colors"
              title="Edit"
            >
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-red-100 transition-colors"
              title="Delete"
            >
              <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            className="w-full text-sm bg-white border border-gray-300 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="flex gap-1.5">
            <button
              onClick={commitEdit}
              className="flex-1 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >Save</button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1 text-xs bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-800 leading-snug">{card.content}</p>
      )}

      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.tags.map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded-full bg-white/70 text-[10px] text-gray-500 border border-white/80">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function MemoryPanel() {
  const {
    activeChat: getActiveChat,
    updateChatMemoryCards,
    globalMemoryCards,
    memoryPanelOpen,
    toggleMemoryPanel,
  } = useStore();
  const { extractMemory, loadGlobalMemory, saveGlobalMemory } = useMemory();

  const chat = getActiveChat();
  const [tab, setTab] = useState<'profile' | 'chat'>('profile');

  // Working copies
  const [profileCards, setProfileCards] = useState<MemoryCard[]>([]);
  const [chatCards, setChatCards] = useState<MemoryCard[]>([]);

  // Brain dump
  const [brainDump, setBrainDump] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  // Quick-add
  const [addType, setAddType] = useState<MemoryCardType>('fact');
  const [addContent, setAddContent] = useState('');
  const [addImportance, setAddImportance] = useState<MemoryImportance>('medium');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load data when panel opens
  useEffect(() => {
    if (!memoryPanelOpen) return;
    // Load global from backend (or from store cache)
    setProfileCards([...globalMemoryCards]);
    loadGlobalMemory().then((cards) => setProfileCards(cards)).catch(() => {});
    // Load chat memory from store
    if (chat) setChatCards([...(chat.memoryCards ?? [])]);
    setIsDirty(false);
  }, [memoryPanelOpen, chat?.id]);

  if (!memoryPanelOpen || !chat) return null;

  const activeCards = tab === 'profile' ? profileCards : chatCards;
  const setActiveCards = tab === 'profile' ? setProfileCards : setChatCards;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleExtract = async () => {
    if (!brainDump.trim()) return;
    setExtracting(true);
    setExtractError('');
    try {
      const newCards = await extractMemory(brainDump);
      if (newCards.length === 0) {
        setExtractError('No memory cards found. Try being more specific.');
      } else {
        setActiveCards((prev) => [...prev, ...newCards]);
        setBrainDump('');
        setIsDirty(true);
      }
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleQuickAdd = () => {
    if (!addContent.trim()) return;
    const card: MemoryCard = {
      id: uuid(),
      type: addType,
      content: addContent.trim(),
      importance: addImportance,
      tags: [],
      createdAt: Date.now(),
    };
    setActiveCards((prev) => [...prev, card]);
    setAddContent('');
    setIsDirty(true);
  };

  const handleDelete = (id: string) => {
    setActiveCards((prev) => prev.filter((c) => c.id !== id));
    setIsDirty(true);
  };

  const handleEdit = (updated: MemoryCard) => {
    setActiveCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (tab === 'profile') {
      await saveGlobalMemory(profileCards);
    } else {
      updateChatMemoryCards(chat.id, chatCards);
    }
    setSaving(false);
    setSaved(true);
    setIsDirty(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const cardsByType = CARD_TYPES.reduce<Record<string, MemoryCard[]>>((acc, t) => {
    acc[t] = activeCards.filter((c) => c.type === t);
    return acc;
  }, {} as Record<string, MemoryCard[]>);

  return (
    <div className="w-96 h-full border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-semibold text-gray-800">Memory</h3>
          {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />}
        </div>
        <button onClick={toggleMemoryPanel} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-100 shrink-0">
        {[
          { id: 'profile', label: 'Profile', icon: '👤', desc: 'Applies to all chats' },
          { id: 'chat',    label: 'This Chat', icon: '💬', desc: 'Only this conversation' },
        ].map(({ id, label, icon, desc }) => (
          <button
            key={id}
            onClick={() => setTab(id as 'profile' | 'chat')}
            className={`flex-1 py-2.5 px-3 text-xs font-medium transition-colors flex flex-col items-center gap-0.5 ${
              tab === id
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{icon} {label}</span>
            <span className={`text-[10px] ${tab === id ? 'text-indigo-400' : 'text-gray-400'}`}>{desc}</span>
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Brain Dump */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">✨</span>
            <label className="text-xs font-semibold text-gray-700">Brain Dump</label>
            <span className="text-xs text-gray-400">— AI will extract structured cards</span>
          </div>
          <textarea
            className="w-full h-24 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            placeholder={tab === 'profile'
              ? "I'm a senior ML engineer. I prefer concise answers with code. I work on Python and RAG systems..."
              : "We're discussing the memory feature. The stack is FastAPI + React + ChromaDB..."}
            value={brainDump}
            onChange={(e) => setBrainDump(e.target.value)}
          />
          {extractError && (
            <p className="text-xs text-red-500">{extractError}</p>
          )}
          <button
            onClick={handleExtract}
            disabled={!brainDump.trim() || extracting}
            className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {extracting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Extracting with AI...
              </>
            ) : (
              <>✨ Extract with AI</>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-200" />
          or add manually
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Quick Add */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Type selector */}
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as MemoryCardType)}
              className="shrink-0 px-2 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {CARD_TYPES.map((t) => (
                <option key={t} value={t}>{CARD_CONFIG[t].icon} {CARD_CONFIG[t].label}</option>
              ))}
            </select>
            {/* Importance selector */}
            <select
              value={addImportance}
              onChange={(e) => setAddImportance(e.target.value as MemoryImportance)}
              className="shrink-0 px-2 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="Enter a fact, preference, or context..."
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
            <button
              onClick={handleQuickAdd}
              disabled={!addContent.trim()}
              className="px-3 py-2 rounded-lg bg-gray-800 text-white text-xs font-semibold hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Card Canvas */}
        {activeCards.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">
                Memory Cards ({activeCards.length})
              </span>
              <button
                onClick={() => { setActiveCards([]); setIsDirty(true); }}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            </div>

            {/* Group by type */}
            {CARD_TYPES.map((type) => {
              const cards = cardsByType[type];
              if (!cards.length) return null;
              const cfg = CARD_CONFIG[type];
              return (
                <div key={type} className="flex flex-col gap-1.5">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.text}`}>
                    {cfg.icon} {cfg.label}s
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {cards.map((card) => (
                      <CardItem
                        key={card.id}
                        card={card}
                        onDelete={() => handleDelete(card.id)}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeCards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <span className="text-3xl mb-2">🧠</span>
            <p className="text-sm font-medium text-gray-500">No memory cards yet</p>
            <p className="text-xs mt-1">
              {tab === 'profile'
                ? 'Add facts about yourself — applies to all chats'
                : 'Add context for this conversation'}
            </p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-100 p-3 shrink-0">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-100 text-emerald-700'
              : isDirty
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : saved ? '✓ Saved!' : isDirty ? '💾 Save Changes' : 'No changes'}
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-1.5">
          {tab === 'profile'
            ? `${profileCards.length} card${profileCards.length !== 1 ? 's' : ''} · synced to your profile`
            : `${chatCards.length} card${chatCards.length !== 1 ? 's' : ''} · this chat only`}
        </p>
      </div>
    </div>
  );
}
