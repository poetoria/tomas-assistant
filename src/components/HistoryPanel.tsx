import { useState } from 'react';
import { Clock, Trash2, Eye, RotateCcw, FileText, Image, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { TranslationResult } from '@/types/translation';
import { SUPPORTED_LANGUAGES } from '@/types/translation';
import { useStyleGuideConversations } from '@/hooks/useSettingsStorage';

interface HistoryPanelProps {
  history: TranslationResult[];
  onView: (result: TranslationResult) => void;
  onReuse: (result: TranslationResult) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryPanel({ history, onView, onReuse, onDelete, onClearAll }: HistoryPanelProps) {
  const [activeTab, setActiveTab] = useState<'translations' | 'styleguide'>('translations');
  const { conversations, deleteConversation, clearAllConversations } = useStyleGuideConversations();

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'translations' | 'styleguide')}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="translations" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Translations
        </TabsTrigger>
        <TabsTrigger value="styleguide" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Style Guide
        </TabsTrigger>
      </TabsList>

      <TabsContent value="translations" className="mt-0">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No translation history yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Your recent translations will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Translations
              </h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear translation history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your saved translations. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {history.map((item) => {
            const sourceLang = SUPPORTED_LANGUAGES.find((l) => l.code === item.settings.sourceLanguage);
            const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === item.settings.targetLanguage);

            return (
              <div
                key={item.id}
                className="tina-card p-4 hover:shadow-tina-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {item.settings.mode === 'text' ? (
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Image className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {sourceLang?.flag} {sourceLang?.name} → {targetLang?.flag} {targetLang?.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground capitalize">
                        {item.settings.tone}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.settings.sourceText.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {new Date(item.timestamp).toLocaleString('en-GB')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(item)}
                      className="h-8 w-8"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onReuse(item)}
                      className="h-8 w-8"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
            </ScrollArea>
          </div>
        )}
      </TabsContent>

      <TabsContent value="styleguide" className="mt-0">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No style guide conversations yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Your Q&A chats will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Recent Chats
              </h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear conversation history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your saved chats. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearAllConversations} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="tina-card p-4 hover:shadow-tina-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''} · {new Date(conv.updatedAt).toLocaleString('en-GB')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteConversation(conv.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
