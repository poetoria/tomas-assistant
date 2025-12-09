import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TranslationSegment as SegmentType } from '@/types/translation';

interface TranslationSegmentProps {
  segment: SegmentType;
  showRationale: boolean;
  variant: 'split' | 'card';
}

export function TranslationSegmentCard({ segment, showRationale, variant }: TranslationSegmentProps) {
  const [copied, setCopied] = useState<'source' | 'translated' | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async (text: string, type: 'source' | 'translated') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (variant === 'split') {
    return (
      <div className="group grid grid-cols-2 gap-4 p-4 border-b border-border/50 hover:bg-accent/30 transition-colors">
        {/* Source */}
        <div className="relative">
          <p className="text-sm text-muted-foreground leading-relaxed pr-8">{segment.sourceText}</p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleCopy(segment.sourceText, 'source')}
          >
            {copied === 'source' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>

        {/* Translated */}
        <div className="relative">
          <p className="text-sm font-medium leading-relaxed pr-8">{segment.translatedText}</p>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleCopy(segment.translatedText, 'translated')}
          >
            {copied === 'translated' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </Button>
          
          {showRationale && segment.rationale && (
            <div className="mt-3 pt-3 border-t border-dashed border-border/50">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground italic">{segment.rationale}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Card variant for mobile
  return (
    <div className="tina-card p-4 animate-fade-in">
      {/* Source Text */}
      <div className="relative mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Source</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => handleCopy(segment.sourceText, 'source')}
          >
            {copied === 'source' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{segment.sourceText}</p>
      </div>

      {/* Translated Text */}
      <div className="relative pt-3 border-t border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Translated</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => handleCopy(segment.translatedText, 'translated')}
          >
            {copied === 'translated' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <p className="text-sm font-medium">{segment.translatedText}</p>
      </div>

      {/* Expandable Rationale */}
      {segment.rationale && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-3 w-3" />
              Rationale & Notes
            </span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            expanded ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
          )}>
            <div className="p-3 rounded-lg bg-accent/50 text-xs text-muted-foreground italic">
              {segment.rationale}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
