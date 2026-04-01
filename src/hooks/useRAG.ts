import { v4 as uuid } from 'uuid';
import { useStore } from './useStore';
import type { QueryResponse } from '../types';

const POLL_INTERVAL = 2000; // 2 seconds

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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': settings.apiKey,
      };

      // Step 1: Submit the query — returns immediately with a task_id
      const submitRes = await fetch(`${settings.apiUrl}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: fullQuestion,
          collection: chat.collection,
          thinking,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({ detail: submitRes.statusText }));
        throw new Error(err.detail || `HTTP ${submitRes.status}`);
      }

      const { task_id } = await submitRes.json();

      // Step 2: Poll for the result
      const data = await pollForResult(task_id, headers);

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
