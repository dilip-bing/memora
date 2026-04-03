import { v4 as uuid } from 'uuid';
import { useStore } from './useStore';
import type { QueryResponse } from '../types';

const POLL_INTERVAL = 2000; // 2 seconds

export function useRAG() {
  const { settings, addMessage, updateMessage, setLoading, activeChat } = useStore();

  async function sendQuery(question: string, thinking: boolean, useStreaming = true): Promise<void> {
    const chat = activeChat();
    if (!chat) return;
    if (!settings.apiUrl) throw new Error('API URL not configured. Open Settings to set it.');
    if (!settings.apiKey) throw new Error('API Key not configured. Open Settings to set it.');

    // Disable streaming for Cloudflare tunnels (SSE not supported)
    // Note: If you're using ngrok, localtunnel, or direct hosting, streaming will work
    const isCloudflare = settings.apiUrl.includes('trycloudflare.com') || settings.apiUrl.includes('cloudflare');
    const useStreamingFinal = useStreaming && !isCloudflare;
    
    if (isCloudflare) {
      console.log('Cloudflare tunnel detected - using polling instead of streaming');
    }

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

      // Always use polling (no streaming)
      await sendQueryPolling(fullQuestion, thinking, chat.id, chat.collection, headers);
    } finally {
      setLoading(false);
    }
  }

  async function sendQueryStream(
    question: string,
    thinking: boolean,
    chatId: string,
    collection: string,
    headers: Record<string, string>,
  ): Promise<void> {
    // Create a placeholder assistant message
    const messageId = uuid();
    const statusLabel = thinking ? 'Thinking' : 'Fast thinking';
    
    addMessage(chatId, {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      thinking,
      isStreaming: true,
      streamingStatus: statusLabel,
    });

    try {
      const res = await fetch(`${settings.apiUrl}/query/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question,
          collection,
          thinking,
          ...(settings.selectedModel ? { model: settings.selectedModel } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let buffer = '';
      let answer = '';
      let sources: any[] = [];
      let elapsed = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = JSON.parse(line.slice(6));

          if (data.type === 'status') {
            // Update status
            updateMessage(chatId, messageId, {
              streamingStatus: `${data.status} (${data.phase})`,
            });
          } else if (data.type === 'answer') {
            // Answer received
            answer = data.content;
            updateMessage(chatId, messageId, {
              content: answer,
              streamingStatus: statusLabel,
            });
          } else if (data.type === 'sources') {
            sources = data.sources;
          } else if (data.type === 'done') {
            elapsed = data.elapsed_seconds;
            // Finalize message
            updateMessage(chatId, messageId, {
              content: answer,
              sources,
              elapsed_seconds: elapsed,
              isStreaming: false,
              streamingStatus: undefined,
            });
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        }
      }
    } catch (error) {
      // On error, remove the placeholder message by clearing its content
      // This will be handled by the outer try-catch
      throw error;
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
