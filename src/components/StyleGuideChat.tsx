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
    
    // Check for bullet list item
    if (/^[-•]\s+/.test(trimmedLine)) {
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ul class="list-disc pl-5 my-2 space-y-1">');
        inList = true;
        listType = 'ul';
      }
      processedLines.push(`<li class="text-sm">${trimmedLine.replace(/^[-•]\s+/, '')}</li>`);
      continue;
    }
    
    // Check for numbered list item
    if (/^\d+\.\s+/.test(trimmedLine)) {
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ol class="list-decimal pl-5 my-2 space-y-1">');
        inList = true;
        listType = 'ol';
      }
      processedLines.push(`<li class="text-sm">${trimmedLine.replace(/^\d+\.\s+/, '')}</li>`);
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
      processedLines.push(`<h3 class="font-semibold text-sm mt-3 mb-1">${trimmedLine.replace(/^###\s+/, '')}</h3>`);
      continue;
    }
    if (/^##\s+/.test(trimmedLine)) {
      processedLines.push(`<h2 class="font-semibold text-base mt-3 mb-1">${trimmedLine.replace(/^##\s+/, '')}</h2>`);
      continue;
    }
    if (/^#\s+/.test(trimmedLine)) {
      processedLines.push(`<h1 class="font-bold text-lg mt-3 mb-1">${trimmedLine.replace(/^#\s+/, '')}</h1>`);
      continue;
    }
    
    // Regular paragraph or empty line
    if (trimmedLine === '') {
      processedLines.push('<br/>');
    } else {
      processedLines.push(`<p class="my-1">${trimmedLine}</p>`);
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
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>');
  
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

export function StyleGuideChat() {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
      {/* Sidebar - Conversation History */}
      <Card className="lg:col-span-1 flex flex-col">
        <CardContent className="p-4 flex flex-col h-full">
          <Button onClick={() => createConversation()} className="w-full mb-4">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {filteredConversations.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No conversations yet
                </p>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      activeConversation?.id === conv.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setActiveConversationId(conv.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {conv.messages.length} messages
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="lg:col-span-3 flex flex-col">
        <CardContent className="p-4 flex flex-col h-full">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Style Guide Assistant</h3>
                <p className="text-muted-foreground max-w-md">
                  Ask questions about your style guide, content standards, or writing best practices. 
                  I'll give you clear, helpful answers.
                </p>
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
                          className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>h1]:font-semibold [&>h2]:font-semibold [&>h3]:font-medium"
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
              placeholder="Ask a question about your style guide..."
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
    </div>
  );
}
