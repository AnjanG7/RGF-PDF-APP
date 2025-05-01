// In this code there is source that is given by LLM model so if you want source (pagenumber and pages where LLM use refrences)than uncomment and use this code 
/*'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Copy } from 'lucide-react';

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: { pageNumber?: number };
    source?: string;
  };
}

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
  expanded?: boolean;
}

interface CopyButtonProps {
  content: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ content }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-slate-300 text-xs flex items-center"
      title="Copy to clipboard"
    >
      {copied ? (
        <div className="bg-slate-600 text-white rounded-md px-2 py-1 text-xs flex items-center">
          <span className="mr-1">✅</span> Copied!
        </div>
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;
    const userMessage: IMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    try {
      const res = await fetch(`http://localhost:8001/ap1/v1/chat?message=${encodeURIComponent(message)}`);
      const data = await res.json();
      const assistantMessage: IMessage = { role: 'assistant', content: data?.message, documents: data?.docs, expanded: false };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Error: Unable to fetch response.' }]);
    }
  };

  const toggleExpand = (index: number) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, expanded: !msg.expanded } : msg))
    );
  };

  const shouldShowExpand = (content?: string) => !!content && content.split('\n').length > 5;

  const getTruncatedContent = (content?: string) =>
    content ? content.split('\n').slice(0, 5).join('\n') + '...' : '';

  return (
    <div className="flex flex-col h-screen p-6 bg-slate-800">
      <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scroll">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';
          const isUser = msg.role === 'user';
          const shouldTruncate = isAssistant && !msg.expanded && msg.content && shouldShowExpand(msg.content);
          const messageBackgroundColor = isUser ? 'bg-slate-700' : 'bg-slate-700';
          const messageTextColor = 'text-white';
          const messageContent = shouldTruncate ? getTruncatedContent(msg.content) : msg.content;

          return (
            <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`relative max-w-xl p-4 rounded-2xl shadow-md text-sm transition-all duration-300 ${messageBackgroundColor} ${messageTextColor} ${
                  isUser ? 'ml-auto rounded-br-none' : 'mr-auto rounded-bl-none'
                }`}
              >
                <div
                  className={`whitespace-pre-wrap overflow-hidden transition-all duration-300 ${
                    shouldTruncate ? 'max-h-[7.5em]' : 'max-h-full'
                  }`}
                >
                  {messageContent}
                </div>
                {isAssistant && msg.content && shouldShowExpand(msg.content) && (
                  <button
                    onClick={() => toggleExpand(index)}
                    className="mt-2 text-xs text-blue-500 hover:underline"
                  >
                    {msg.expanded ? 'Show less ▲' : 'Show more ▼'}
                  </button>
                )}
                {isAssistant && msg.content && (
                  <div className="mt-1 self-end">
                    <CopyButton content={msg.content} />
                  </div>
                )}
              </div>
              {isAssistant && msg.documents && msg.documents.length > 0 && (
                <div className="mt-2 w-full max-w-xl bg-slate-700 border border-slate-600 rounded-xl p-3 shadow-sm text-xs text-white">
                  <div className="font-semibold mb-1 text-slate-300">Sources:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {msg.documents.map((doc, i) => (
                      <li key={i}>
                        <span className="font-medium text-slate-200">{doc.metadata?.source || 'Unknown'}</span>
                        {doc.metadata?.loc?.pageNumber ? ` — Page ${doc.metadata.loc.pageNumber}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {isUser && msg.content && (
                <div className="mt-1">
                  <CopyButton content={msg.content} />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="pt-4 border-t mt-6 flex gap-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 bg-slate-700 text-white border-slate-600"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendChatMessage();
            }
          }}
        />
        <Button
          onClick={handleSendChatMessage}
          disabled={!message.trim()}
          className="px-6 bg-blue-600 hover:bg-blue-500 text-white"
        >
          Send
        </Button>
      </div>

  
      <style jsx>{`
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: #475569 #1e293b;
        }

        .custom-scroll::-webkit-scrollbar {
          width: 3px;
        }

        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 3px;
        }

        .custom-scroll::-webkit-scrollbar-track {
          background-color: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default ChatComponent;
*/'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Copy } from 'lucide-react';

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  expanded?: boolean;
}

interface CopyButtonProps {
  content: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ content }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-slate-300 text-xs flex items-center"
      title="Copy to clipboard"
    >
      {copied ? (
        <div className="bg-slate-600 text-white rounded-md px-2 py-1 text-xs flex items-center">
          <span className="mr-1">✅</span> Copied!
        </div>
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;
    const userMessage: IMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    try {
      const res = await fetch(`http://localhost:8001/ap1/v1/chat?message=${encodeURIComponent(message)}`);
      const data = await res.json();
      const assistantMessage: IMessage = { role: 'assistant', content: data?.message, expanded: false };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Error: Unable to fetch response.' }]);
    }
  };

  const toggleExpand = (index: number) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, expanded: !msg.expanded } : msg))
    );
  };

  const shouldShowExpand = (content?: string) => !!content && content.split('\n').length > 5;

  const getTruncatedContent = (content?: string) =>
    content ? content.split('\n').slice(0, 5).join('\n') + '...' : '';

  return (
    <div className="flex flex-col h-screen p-6 bg-slate-800">
      <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scroll">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';
          const isUser = msg.role === 'user';
          const shouldTruncate = isAssistant && !msg.expanded && msg.content && shouldShowExpand(msg.content);
          const messageBackgroundColor = isUser ? 'bg-slate-700' : 'bg-slate-700';
          const messageTextColor = 'text-white';
          const messageContent = shouldTruncate ? getTruncatedContent(msg.content) : msg.content;

          return (
            <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`relative max-w-xl p-4 rounded-2xl shadow-md text-sm transition-all duration-300 ${messageBackgroundColor} ${messageTextColor} ${isUser ? 'ml-auto rounded-br-none' : 'mr-auto rounded-bl-none'
                  }`}
              >
                <div
                  className={`whitespace-pre-wrap overflow-hidden transition-all duration-300 ${shouldTruncate ? 'max-h-[7.5em]' : 'max-h-full'
                    }`}
                >
                  {messageContent}
                </div>
                {isAssistant && msg.content && shouldShowExpand(msg.content) && (
                  <button
                    onClick={() => toggleExpand(index)}
                    className="mt-2 text-xs text-blue-500 hover:underline"
                  >
                    {msg.expanded ? 'Show less ▲' : 'Show more ▼'}
                  </button>
                )}
                {isAssistant && msg.content && (
                  <div className="mt-1 self-end">
                    <CopyButton content={msg.content} />
                  </div>
                )}
              </div>
              {isUser && msg.content && (
                <div className="mt-1">
                  <CopyButton content={msg.content} />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="pt-4 border-t mt-6 flex gap-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 bg-slate-700 text-white border-slate-600"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendChatMessage();
            }
          }}
        />
        <Button
          onClick={handleSendChatMessage}
          disabled={!message.trim()}
          className="px-6 bg-blue-600 hover:bg-blue-500 text-white"
        >
          Send
        </Button>
      </div>

      <style jsx>{`
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: #475569 #1e293b;
        }

        .custom-scroll::-webkit-scrollbar {
          width: 3px;
        }

        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 3px;
        }

        .custom-scroll::-webkit-scrollbar-track {
          background-color: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default ChatComponent;
