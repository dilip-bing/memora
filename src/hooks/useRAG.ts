import { v4 as uuid } from 'uuid';
import { useStore } from './useStore';
import type { QueryResponse } from '../types';

export function useRAG() {
  const { settings, addMessage, setLoading, activeChat } = useStore();

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
      // Build the full question with memory context
      let fullQuestion = question;
      if (chat.memory.trim()) {
        fullQuestion = `[Memory Context]\n${chat.memory.trim()}\n[End Memory Context]\n\n${question}`;
      }

      const res = await fetch(`${settings.apiUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': settings.apiKey,
        },
        body: JSON.stringify({
          question: fullQuestion,
          collection: chat.collection,
          thinking,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data: QueryResponse = await res.json();

      addMessage(chat.id, {
        id: uuid(),
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
        thinking,
        elapsed_seconds: data.elapsed_seconds,
        sources: data.sources,
      });
    } finally {
      setLoading(false);
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
