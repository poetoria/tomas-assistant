import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalSettings } from '@/hooks/useSettingsStorage';
import { askStyleGuideQuestion } from '@/services/styleGuideService';
import { parseStructuredOptions, resolveOptionInput, StructuredOptionsUI } from './ClarificationOptions';
import DOMPurify from 'dompurify';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function formatSimpleText(text: string): string {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
    .replace(/\n/g, '<br/>');
  return DOMPurify.sanitize(html);
}

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useGlobalSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text.trim() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const answer = await askStyleGuideQuestion(text.trim(), settings, history);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isLoading) return;

    // Resolve against last assistant options
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant') {
      const parsed = parseStructuredOptions(lastMsg.content);
      const resolved = resolveOptionInput(q, parsed.options);
      if (resolved) {
        await sendMessage(resolved);
        return;
      }
    }
    await sendMessage(q);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        title="Ask Tomas"
      >
        <Sparkles className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Ask Tomas</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Clear chat" onClick={() => setMessages([])}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs pt-12 space-y-2">
            <Sparkles className="w-6 h-6 mx-auto opacity-30" />
            <p className="font-medium">Quick style guide help</p>
            <p className="text-[11px]">Ask about tone, terminology, formatting, or compliance.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1;
          const parsed = isLastAssistant ? parseStructuredOptions(msg.content) : null;
          const displayText = parsed ? parsed.cleanText : msg.content;
          const showOptions = isLastAssistant && parsed?.type && parsed.options.length > 0 && !isLoading;

          return (
            <div key={i}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.role === 'assistant' ? formatSimpleText(displayText) : msg.content }}
                />
              </div>
              {showOptions && parsed?.type && (
                <div className="mt-1">
                  <StructuredOptionsUI
                    type={parsed.type}
                    options={parsed.options}
                    onSelect={(text) => sendMessage(text)}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1 h-1 bg-muted-foreground/50 rounded-full animate-pulse" />
              <span className="w-1 h-1 bg-muted-foreground/50 rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-1 bg-muted-foreground/50 rounded-full animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={isLoading || !input.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
