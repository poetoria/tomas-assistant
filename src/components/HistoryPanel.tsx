import { Clock, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useStyleGuideConversations } from '@/hooks/useSettingsStorage';

interface HistoryPanelProps {
  onOpenStyleGuideConversation?: (conversationId: string) => void;
}

export function HistoryPanel({ onOpenStyleGuideConversation }: HistoryPanelProps) {
  const { conversations, deleteConversation, clearAllConversations } = useStyleGuideConversations();

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Your style guide chats will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent chats
        </h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              Clear all
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear conversation history</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your saved chats. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearAllConversations} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Clear all
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
              className="tina-card p-4 hover:shadow-tina-md transition-shadow cursor-pointer"
              onClick={() => onOpenStyleGuideConversation?.(conv.id)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
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
  );
}
