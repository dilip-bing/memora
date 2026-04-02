export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: boolean;
  elapsed_seconds?: number;
  sources?: SourceNode[];
  isStreaming?: boolean;  // New: indicates message is being streamed
  streamingStatus?: string;  // New: "Thinking" | "Fast thinking"
}

export interface SourceNode {
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  memory: string;
  collection: string;
  createdAt: number;
  updatedAt: number;
}

export interface QueryResponse {
  question: string;
  answer: string;
  sources: SourceNode[];
  collection: string;
  elapsed_seconds: number;
}

export interface HealthResponse {
  status: string;
  ollama_reachable: boolean;
  chroma_reachable: boolean;
  version: string;
  active_llm: string;
  active_embedding: string;
}

export interface AppSettings {
  apiUrl: string;
  apiKey: string;
  defaultCollection: string;
  defaultThinking: boolean;
  selectedModel: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}
