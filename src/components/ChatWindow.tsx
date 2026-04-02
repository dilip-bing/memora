import { useEffect, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import type { Message } from '../types';

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] ${
          isUser
            ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-3'
            : 'bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm'
        }`}
      >
        {/* Streaming Status */}
        {message.isStreaming && message.streamingStatus && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-600">{message.streamingStatus}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`prose text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          ) : message.content ? (
            <div
              className="whitespace-pre-wrap [&>p]:mb-2 [&>p:last-child]:mb-0"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(message.content),
              }}
            />
          ) : (
            <div className="flex items-center gap-2 text-gray-400 italic">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className={`flex items-center gap-2 mt-2 text-xs ${isUser ? 'text-indigo-200' : 'text-gray-400'}`}>
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.thinking !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              isUser
                ? 'bg-indigo-500 text-indigo-100'
                : message.thinking
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-emerald-100 text-emerald-600'
            }`}>
              {message.thinking ? 'Think' : 'Fast'}
            </span>
          )}
          {message.elapsed_seconds != null && (
            <span>{message.elapsed_seconds}s</span>
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Sources</p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s, i) => {
                const filename =
                  (s.metadata?.file_name as string) ||
                  (s.metadata?.filename as string) ||
                  `Source ${i + 1}`;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-600 border border-gray-100"
                    title={`Score: ${s.score}\n\n${s.text.slice(0, 200)}...`}
                  >
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {filename}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>');
}

export default function ChatWindow() {
  const { activeChat: getActiveChat, isLoading } = useStore();
  const chat = getActiveChat();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages.length, isLoading]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Welcome to Memora</h2>
          <p className="text-gray-400 text-sm">Create a new chat to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 px-4 sm:px-8 py-6">
      {chat.messages.length === 0 && (
        <div className="text-center mt-20">
          <h2 className="text-lg font-medium text-gray-500 mb-2">Start a conversation</h2>
          <p className="text-gray-400 text-sm">Ask anything about your documents</p>
        </div>
      )}

      {chat.messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
