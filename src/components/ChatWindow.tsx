import { useEffect, useRef, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import type { Message } from '../types';

// Test/placeholder filenames to suppress from sources
const TEST_FILE_RE = /^(test|sample|example|demo|temp|placeholder|dummy)\./i;

function getUniqueMeaningfulSources(message: Message) {
  if (!message.sources?.length) return [];
  const seen = new Set<string>();
  return message.sources
    .filter((s) => {
      const name = (s.metadata?.file_name as string) || (s.metadata?.filename as string) || '';
      if (TEST_FILE_RE.test(name)) return false;    // hide test files
      if (s.score !== undefined && s.score < 0.25) return false; // hide low-relevance
      if (seen.has(name)) return false;             // deduplicate
      seen.add(name);
      return true;
    })
    .slice(0, 4); // max 4 unique sources
}

function MessageBubble({ message, onSaveToMemory }: { message: Message; onSaveToMemory?: (msg: Message) => void }) {
  const isUser = message.role === 'user';
  const [progress, setProgress] = useState(0);

  // Predictive progress bar
  useEffect(() => {
    if (!message.isStreaming || !message.startTime) return;

    // Estimated durations in milliseconds
    const estimatedDuration = message.thinking ? 480000 : 13000; // 8 min or 13 sec
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - message.startTime!;
      const predictedProgress = Math.min((elapsed / estimatedDuration) * 100, 95); // Cap at 95%
      setProgress(predictedProgress);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [message.isStreaming, message.startTime, message.thinking]);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] ${
          isUser
            ? 'bg-[#CE5630] hover:bg-[#B84A28] text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm'
            : 'bg-white dark:bg-[#2A2A27] border border-[#D8D6CF] dark:border-[#2C2C2A] rounded-2xl rounded-bl-md px-5 py-4 shadow-sm'
        }`}
      >
        {/* Streaming Status */}
        {message.isStreaming && message.streamingStatus && (
          <div className="mb-3 pb-3 border-b border-[#D8D6CF] dark:border-[#2C2C2A]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-[#3A3936] dark:text-[#888780]">{message.streamingStatus}</span>
            </div>
            {/* Predictive progress bar */}
            <div className="w-full bg-[#D8D6CF] dark:bg-[#2C2C2A] rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-[#4A90D9] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Attached file badge (user messages only) */}
        {isUser && message.attachedFile && (
          <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 rounded-lg w-fit">
            <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs text-white font-medium truncate max-w-[180px]">
              {message.attachedFile.name}
            </span>
            <span className="text-[10px] text-white/80 shrink-0">
              {message.attachedFile.charCount > 1000
                ? `${(message.attachedFile.charCount / 1000).toFixed(1)}k chars`
                : `${message.attachedFile.charCount} chars`}
              {message.attachedFile.truncated ? ' · truncated' : ''}
            </span>
          </div>
        )}

        {/* Content */}
        <div className={`prose text-sm leading-relaxed ${isUser ? 'text-white' : 'text-[#1A1A18] dark:text-[#F1EFE8]'}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap m-0">{message.content}</p>
          ) : message.content ? (
            <div
              className="whitespace-pre-wrap [&>p]:mb-2 [&>p:last-child]:mb-0"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(message.content),
              }}
            />
          ) : null}
        </div>

        {/* Meta */}
        <div className={`flex items-center gap-2 mt-2 text-xs ${isUser ? 'text-white/70' : 'text-[#5F5E5A] dark:text-[#888780]'}`}>
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.thinking !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              isUser
                ? 'bg-white/20 text-white'
                : message.thinking
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              {message.thinking ? 'Think' : 'Fast'}
            </span>
          )}
          {message.elapsed_seconds != null && (
            <span>{message.elapsed_seconds}s</span>
          )}
        </div>

        {/* Sources — deduplicated, test files hidden */}
        {(() => {
          const sources = getUniqueMeaningfulSources(message);
          if (!sources.length) return null;
          return (
            <div className="mt-3 pt-3 border-t border-[#D8D6CF] dark:border-[#2C2C2A]">
              <p className="text-xs font-medium text-[#5F5E5A] dark:text-[#888780] mb-1.5">
                {sources.length} source{sources.length !== 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sources.map((s, i) => {
                  const filename =
                    (s.metadata?.file_name as string) ||
                    (s.metadata?.filename as string) ||
                    `Source ${i + 1}`;
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#F0EDE4] dark:bg-[#252523] rounded-md text-xs text-[#3A3936] dark:text-[#888780] border border-[#D8D6CF] dark:border-[#2C2C2A]"
                      title={`Score: ${s.score?.toFixed(2) ?? 'n/a'}\n\n${s.text.slice(0, 200)}...`}
                    >
                      <svg className="w-3 h-3 text-[#AAA8A0] dark:text-[#5F5E5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {filename}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Save to memory suggestion — only on assistant messages with content */}
        {!isUser && message.content && !message.isStreaming && onSaveToMemory && (
          <div className="mt-2.5 pt-2.5 border-t border-[#D8D6CF] dark:border-[#2C2C2A]">
            <button
              onClick={() => onSaveToMemory(message)}
              className="flex items-center gap-1.5 text-[11px] text-[#5F5E5A] dark:text-[#888780] hover:text-amber-600 dark:hover:text-amber-500 transition-colors group"
            >
              <span className="group-hover:scale-110 transition-transform">💡</span>
              Save key points to memory
            </button>
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
  const {
    activeChat: getActiveChat,
    isLoading,
    memoryPanelOpen,
    toggleMemoryPanel,
    setMemoryBrainDumpPrefill,
  } = useStore();
  const { user } = useAuth();
  const chat = getActiveChat();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages.length, isLoading]);

  const handleSaveToMemory = (msg: Message) => {
    // Find the preceding user message
    const msgIndex = chat?.messages.findIndex((m) => m.id === msg.id) ?? -1;
    const prevUser = msgIndex > 0 ? chat?.messages[msgIndex - 1] : null;
    const prefill = prevUser
      ? `Q: ${prevUser.content.slice(0, 200)}\nA: ${msg.content.slice(0, 400)}`
      : msg.content.slice(0, 500);
    setMemoryBrainDumpPrefill(prefill);
    if (!memoryPanelOpen) toggleMemoryPanel();
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#EDE9DF] dark:bg-[#1A1A18]">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white dark:bg-[#252523] flex items-center justify-center p-4 shadow-sm">
            <img src="/logo1.png" alt="Memora" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-semibold text-[#CE5630] mb-2">
            Welcome{user ? `, ${user.name.split(' ')[0]}` : ''}!
          </h2>
          <p className="text-[#5F5E5A] dark:text-[#888780] text-sm">Create a new chat to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#EDE9DF] dark:bg-[#1A1A18] px-4 sm:px-8 py-6">
      {chat.messages.length === 0 && (
        <div className="text-center mt-20">
          <h2 className="text-lg font-medium text-[#3A3936] dark:text-[#888780] mb-2">Start a conversation</h2>
          <p className="text-[#5F5E5A] dark:text-[#5F5E5A] text-sm">Ask anything — or attach a file with the 📎 button</p>
        </div>
      )}

      {chat.messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onSaveToMemory={handleSaveToMemory} />
      ))}

      <div ref={endRef} />
    </div>
  );
}
