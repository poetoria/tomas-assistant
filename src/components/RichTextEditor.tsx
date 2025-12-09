import { useRef, useCallback } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const isActive = (command: string) => {
    return document.queryCommandState(command);
  };

  const ToolbarButton = ({ command, icon: Icon, title }: { command: string; icon: React.ElementType; title: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => execCommand(command)}
      className={cn(
        "h-8 w-8 p-0",
        isActive(command) && "bg-accent text-accent-foreground"
      )}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("border border-input rounded-lg overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        <ToolbarButton command="bold" icon={Bold} title="Bold (Ctrl+B)" />
        <ToolbarButton command="italic" icon={Italic} title="Italic (Ctrl+I)" />
        <ToolbarButton command="underline" icon={Underline} title="Underline (Ctrl+U)" />
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <ToolbarButton command="insertUnorderedList" icon={List} title="Bullet List" />
        <ToolbarButton command="insertOrderedList" icon={ListOrdered} title="Numbered List" />
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <ToolbarButton command="justifyLeft" icon={AlignLeft} title="Align Left" />
        <ToolbarButton command="justifyCenter" icon={AlignCenter} title="Align Center" />
        <ToolbarButton command="justifyRight" icon={AlignRight} title="Align Right" />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className={cn(
          "min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none",
          "[&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4",
          !value && "before:content-[attr(data-placeholder)] before:text-muted-foreground before:pointer-events-none"
        )}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
        suppressContentEditableWarning
      />
    </div>
  );
}
