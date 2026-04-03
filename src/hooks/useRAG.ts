import { v4 as uuid } from 'uuid';
import { useStore } from './useStore';
import { useAuth } from './useAuth';
import type { MemoryCard, QueryResponse } from '../types';

const importanceRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

// Detect whether a question is personal/lifestyle or technical/document-related.
// Personal queries get full memory; technical queries only get style preferences + skills.
const PERSONAL_RE = /\b(i |my |me |myself|personal|feel|health|sleep|diet|habit|life|goal|visa|university|college|study|career|plan|anxiety|stress|mood|relationship|family|friend|routine|wake|morning|night|schedule|motivation|confidence|worry|afraid|hope|dream|wish|want to|need to|should i|can i|how do i|am i)\b/i;

function detectQueryType(q: string): 'personal' | 'technical' {
  return PERSONAL_RE.test(q) ? 'personal' : 'technical';
}

function buildMemoryContext(
  globalCards: MemoryCard[],
  chatCards: MemoryCard[],
  question: string,
): string {
  if (!globalCards.length && !chatCards.length) return '';

  const sortByImportance = (cards: MemoryCard[]) =>
    [...cards].sort((a, b) => (importanceRank[a.importance] ?? 1) - (importanceRank[b.importance] ?? 1));

  const queryType = detectQueryType(question);

  // For technical queries only inject style/skill cards — never personal life details
  const relevantGlobal =
    queryType === 'personal'
      ? globalCards
      : globalCards.filter((c) => c.type === 'preference' || c.type === 'skill');

  if (!relevantGlobal.length && !chatCards.length) return '';

  const lines: string[] = [
    '--- CONTEXT (apply before answering) ---',
    '',
    'STRICT RULES:',
    '1. GROUND TRUTH — everything the user states in this conversation is true; never correct or contradict it',
    '2. PRIORITY — current chat context overrides user profile; profile only supplements',
    '3. SCOPE — only reference profile details when directly relevant to this specific question',
    '4. TONE — never end with motivational phrases, encouragement, or "you can do it"-style closings',
    '5. LENGTH — match response length to question complexity; short question = concise answer',
    '',
  ];

  // Chat context first — highest priority
  if (chatCards.length > 0) {
    lines.push('CURRENT CHAT CONTEXT (takes priority):');
    sortByImportance(chatCards).forEach((c) => lines.push(`  • ${c.content}`));
    lines.push('');
  }

  // User profile second — lower priority, already scoped to relevant types
  if (relevantGlobal.length > 0) {
    const note = queryType === 'technical' ? ' (style preferences only — ignore personal details)' : '';
    lines.push(`USER PROFILE${note}:`);
    sortByImportance(relevantGlobal).forEach((c) => lines.push(`  • ${c.content}`));
    lines.push('');
  }

  lines.push('--- END CONTEXT ---', '');
  return lines.join('\n');
}

const POLL_INTERVAL = 2000; // 2 seconds

export function useRAG() {
  const { settings, addMessage, updateMessage, setLoading, activeChat, globalMemoryCards } = useStore();
  const { user } = useAuth();

  async function sendQuery(question: string, thinking: boolean): Promise<void> {
    const chat = activeChat();
    if (!chat) return;
    if (!settings.apiUrl) throw new Error('API URL not configured. Open Settings to set it.');
    if (!settings.apiKey) throw new Error('API Key not configured. Open Settings to set it.');

    // Add user message
    addMessage(chat.id, {
      id: uuid(),
      role: 'user',
      content: question,
      timestamp: Date.now(),
      thinking,
    });

    setLoading(true);

    try {
      // Build rich personalised context — scoped to query type
      const memContext = buildMemoryContext(
        globalMemoryCards,
        chat.memoryCards ?? [],
        question,
      );
      const fullQuestion = memContext ? `${memContext}\n${question}` : question;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': settings.apiKey,
      };

      // Build chat history from last 8 completed (non-streaming) messages
      const chatHistory = (chat.messages ?? [])
        .filter((m) => !m.isStreaming && m.content)
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      // Always use polling (no streaming)
      await sendQueryPolling(
        fullQuestion,
        thinking,
        chat.id,
        chat.collection,
        headers,
        chatHistory,
        user?.id,
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendQueryPolling(
    question: string,
    thinking: boolean,
    chatId: string,
    collection: string,
    headers: Record<string, string>,
    chatHistory: { role: string; content: string }[] = [],
    userId?: string,
  ): Promise<void> {
    const messageId = uuid();
    
    addMessage(chatId, {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      thinking,
      isStreaming: true,
      streamingStatus: thinking ? 'Deep reasoning in progress...' : 'Processing your query...',
      startTime: Date.now(),  // Track start for predictive progress
    });

    try {
      const submitRes = await fetch(`${settings.apiUrl}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question,
          collection,
          thinking,
          chat_id: chatId,
          ...(userId ? { user_id: userId } : {}),
          chat_history: chatHistory,
          ...(settings.selectedModel ? { model: settings.selectedModel } : {}),
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({ detail: submitRes.statusText }));
        throw new Error(err.detail || `HTTP ${submitRes.status}`);
      }

      const { task_id } = await submitRes.json();

      updateMessage(chatId, messageId, {
        streamingStatus: thinking ? 'Deep reasoning in progress...' : 'Generating answer...',
      });

      const data = await pollForResult(task_id, headers);

      updateMessage(chatId, messageId, {
        content: data.answer,
        elapsed_seconds: data.elapsed_seconds,
        sources: data.sources,
        isStreaming: false,
        streamingStatus: undefined,
        startTime: undefined,
      });
    } catch (error) {
      updateMessage(chatId, messageId, {
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isStreaming: false,
        streamingStatus: undefined,
        startTime: undefined,
      });
      throw error;
    }
  }

  async function pollForResult(
    taskId: string,
    headers: Record<string, string>,
  ): Promise<QueryResponse> {
    while (true) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));

      const res = await fetch(`${settings.apiUrl}/query/${taskId}`, { headers });

      if (!res.ok) {
        throw new Error(`Poll failed: HTTP ${res.status}`);
      }

      const task = await res.json();

      if (task.status === 'completed' && task.result) {
        return task.result as QueryResponse;
      }

      if (task.status === 'error') {
        throw new Error(task.error || 'Query failed on server');
      }

      // status === 'processing' → keep polling
    }
  }

  async function checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${settings.apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }

  return { sendQuery, checkHealth };
}
