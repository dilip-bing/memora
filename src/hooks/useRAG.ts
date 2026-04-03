import { v4 as uuid } from 'uuid';
import { useStore } from './useStore';
import type { MemoryCard, QueryResponse } from '../types';

const importanceRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

function buildMemoryContext(globalCards: MemoryCard[], chatCards: MemoryCard[]): string {
  if (!globalCards.length && !chatCards.length) return '';

  const sortCards = (cards: MemoryCard[]) =>
    [...cards].sort((a, b) => (importanceRank[a.importance] ?? 1) - (importanceRank[b.importance] ?? 1));

  const lines: string[] = [
    '[PERSONALIZATION — Use this context to improve response accuracy, depth, and relevance]',
    '',
  ];

  if (globalCards.length > 0) {
    lines.push('About the user:');
    sortCards(globalCards).forEach((c) => lines.push(`  • ${c.content}`));
    lines.push('');
  }

  if (chatCards.length > 0) {
    lines.push('Current conversation context:');
    sortCards(chatCards).forEach((c) => lines.push(`  • ${c.content}`));
    lines.push('');
  }

  lines.push(
    'Instructions: Adjust answer depth, terminology, and focus to match this context.',
    'Skip basics the user already knows. Be specific to their situation.',
    '[END PERSONALIZATION]',
    '',
  );

  return lines.join('\n');
}

const POLL_INTERVAL = 2000; // 2 seconds

export function useRAG() {
  const { settings, addMessage, updateMessage, setLoading, activeChat, globalMemoryCards } = useStore();

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
      // Build rich personalised context from both memory layers
      const memContext = buildMemoryContext(
        globalMemoryCards,
        chat.memoryCards ?? [],
      );
      const fullQuestion = memContext ? `${memContext}\n${question}` : question;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': settings.apiKey,
      };

      // Always use polling (no streaming)
      await sendQueryPolling(fullQuestion, thinking, chat.id, chat.collection, headers);
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
