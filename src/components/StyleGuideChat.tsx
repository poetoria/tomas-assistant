import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Search, Trash2, MessageSquare } from 'lucide-react';
import DOMPurify from 'dompurify';

// Helper function to format rich text (markdown-like) with sanitization
function formatRichText(text: string): string {
  // Process line by line for better list handling
  const lines = text.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let listType = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check for bullet list item (including asterisk bullets)
    if (/^[-•*]\s+/.test(trimmedLine)) {
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ul style="list-style-type: disc; padding-left: 1.25rem; margin: 0.5rem 0;">');
        inList = true;
        listType = 'ul';
      }
      processedLines.push(`<li style="margin-bottom: 0.25rem;">${trimmedLine.replace(/^[-•*]\s+/, '')}</li>`);
      continue;
    }
    
    // Check for numbered list item
    if (/^\d+\.\s+/.test(trimmedLine)) {
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ol style="list-style-type: decimal; padding-left: 1.25rem; margin: 0.5rem 0;">');
        inList = true;
        listType = 'ol';
      }
      processedLines.push(`<li style="margin-bottom: 0.25rem;">${trimmedLine.replace(/^\d+\.\s+/, '')}</li>`);
      continue;
    }
    
    // Close list if we're exiting
    if (inList && trimmedLine !== '') {
      processedLines.push(`</${listType}>`);
      inList = false;
      listType = '';
    }
    
    // Handle headers
    if (/^###\s+/.test(trimmedLine)) {
      processedLines.push(`<h3 style="font-weight: 600; font-size: 0.875rem; margin-top: 0.75rem; margin-bottom: 0.25rem;">${trimmedLine.replace(/^###\s+/, '')}</h3>`);
      continue;
    }
    if (/^##\s+/.test(trimmedLine)) {
      processedLines.push(`<h2 style="font-weight: 600; font-size: 1rem; margin-top: 0.75rem; margin-bottom: 0.25rem;">${trimmedLine.replace(/^##\s+/, '')}</h2>`);
      continue;
    }
    if (/^#\s+/.test(trimmedLine)) {
      processedLines.push(`<h1 style="font-weight: 700; font-size: 1.125rem; margin-top: 0.75rem; margin-bottom: 0.25rem;">${trimmedLine.replace(/^#\s+/, '')}</h1>`);
      continue;
    }
    
    // Regular paragraph or empty line
    if (trimmedLine === '') {
      if (!inList) processedLines.push('<br/>');
    } else {
      processedLines.push(`<p style="margin: 0.25rem 0;">${trimmedLine}</p>`);
    }
  }
  
  // Close any open list
  if (inList) {
    processedLines.push(`</${listType}>`);
  }
  
  let result = processedLines.join('');
  
  // Apply inline formatting
  result = result
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background: hsl(var(--muted)); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.75rem;">$1</code>');
  
  return DOMPurify.sanitize(result);
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useStyleGuideConversations, useGlobalSettings } from '@/hooks/useSettingsStorage';
import { askStyleGuideQuestion } from '@/services/styleGuideService';

// Helper to get display name for assistant
function getAssistantName(brandName?: string): string {
  return brandName?.trim() ? `TINA2 (${brandName})` : 'TINA2';
}

export function StyleGuideChat({ initialConversationId }: { initialConversationId?: string } = {}) {
  const { toast } = useToast();
  const { settings } = useGlobalSettings();
  const {
    conversations,
    activeConversation,
    setActiveConversationId,
    createConversation,
    addMessage,
    deleteConversation,
    searchConversations,
  } = useStyleGuideConversations();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = searchQuery ? searchConversations(searchQuery) : conversations;

  // Set active conversation from prop on mount
  useEffect(() => {
    if (initialConversationId && conversations.some(c => c.id === initialConversationId)) {
      setActiveConversationId(initialConversationId);
    }
  }, [initialConversationId, conversations, setActiveConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    let conversation = activeConversation;
    if (!conversation) {
      conversation = createConversation(userMessage);
    }
    setInput('');
    addMessage(conversation.id, { role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      const response = await askStyleGuideQuestion(userMessage, settings);
      addMessage(conversation.id, { role: 'assistant', content: response });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const brandName = settings.brandName;
  const assistantName = getAssistantName(brandName);
  const placeholderText = brandName?.trim() 
    ? `Ask a question about the ${brandName} style guide...`
    : 'Ask a question about your style guide...';
  const welcomeText = brandName?.trim()
    ? `Ask questions about the ${brandName} style guide, content standards, or writing best practices.`
    : 'Ask questions about your style guide, content standards, or writing best practices.';

  const exampleQuestions = brandName?.trim()
    ? [
        `How do we write dates for ${brandName}?`,
        `How should we style the term T&Cs in copy?`,
        `What tone of voice should we use?`,
      ]
    : [
        'How do we write dates?',
        'How should we style the term T&Cs in copy?',
        'What tone of voice should we use?',
      ];

  const handleExampleClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] gap-6">
      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-4 flex flex-col h-full">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{assistantName}</h3>
                <p className="text-muted-foreground max-w-md mb-4">
                  {welcomeText} TINA2 will give you clear, helpful answers.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {exampleQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleExampleClick(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div 
                          className="text-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: formatRichText(message.content) }}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-4 rounded-2xl">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="mt-4 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              className="resize-none min-h-[60px]"
              rows={2}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar - Conversation History (now below) */}
      <Card className="flex flex-col max-h-[300px]">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex gap-2 mb-4">
            <Button onClick={() => createConversation()} className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              New chat
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="flex flex-wrap gap-2">
              {filteredConversations.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4 w-full">
                  No conversations yet
                </p>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group flex items-center gap-2 ${
                      activeConversation?.id === conv.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted bg-muted/50'
                    }`}
                    onClick={() => setActiveConversationId(conv.id)}
                  >
                    <p className="text-sm font-medium truncate max-w-[150px]">{conv.title}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
