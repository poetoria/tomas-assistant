import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, PenLine } from 'lucide-react';

export interface ClarificationOption {
  index: number;
  text: string;
}

interface ClarificationOptionsProps {
  options: ClarificationOption[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

/**
 * Parse numbered options from an assistant message.
 * Matches patterns like "1. How to write..." or "1) How to write..."
 * Only returns options if there are 2–6 detected in the message.
 */
export function parseClarificationOptions(text: string): ClarificationOption[] {
  const lines = text.split('\n');
  const options: ClarificationOption[] = [];
  let idx = 1;

  for (const line of lines) {
    // Match numbered patterns: "1. ...", "1) ..."
    const numberedMatch = line.trim().match(/^(\d+)[.)]\s+(.+)/);
    if (numberedMatch) {
      options.push({ index: parseInt(numberedMatch[1], 10), text: numberedMatch[2].trim() });
      continue;
    }
    // Match bullet patterns: "• ...", "- ...", "* ..."
    const bulletMatch = line.trim().match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      options.push({ index: idx++, text: bulletMatch[1].trim() });
    }
  }

  // Only treat as clarification if there are 2–6 items
  if (options.length >= 2 && options.length <= 6) {
    return options;
  }
  return [];
}

/**
 * Try to resolve a short user input (like "1", "2", or partial text)
 * against active clarification options. Returns the matched option text
 * or null if no match.
 */
export function resolveOptionInput(
  input: string,
  options: ClarificationOption[]
): string | null {
  const trimmed = input.trim();
  if (!trimmed || options.length === 0) return null;

  // Numeric match
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && trimmed === String(num)) {
    const match = options.find((o) => o.index === num);
    if (match) return match.text;
  }

  // Exact text match (case-insensitive)
  const lower = trimmed.toLowerCase();
  const exact = options.find((o) => o.text.toLowerCase() === lower);
  if (exact) return exact.text;

  // Partial prefix match (at least 4 chars)
  if (lower.length >= 4) {
    const partial = options.find((o) => o.text.toLowerCase().startsWith(lower));
    if (partial) return partial.text;
  }

  return null;
}

export function ClarificationOptions({ options, onSelect, disabled }: ClarificationOptionsProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleCustomSubmit = () => {
    if (customText.trim()) {
      onSelect(customText.trim());
      setCustomText('');
      setShowCustom(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground font-medium mb-1">Choose an option:</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button
            key={opt.index}
            variant="outline"
            size="sm"
            disabled={disabled}
            className="text-xs text-left h-auto py-2 px-3 whitespace-normal max-w-[280px]"
            onClick={() => onSelect(opt.text)}
          >
            <MessageSquare className="w-3 h-3 mr-1.5 shrink-0" />
            <span>{opt.index}. {opt.text}</span>
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="text-xs h-auto py-2 px-3 text-muted-foreground"
          onClick={() => setShowCustom((v) => !v)}
        >
          <PenLine className="w-3 h-3 mr-1.5" />
          Something else
        </Button>
      </div>

      {showCustom && (
        <div className="flex gap-2 mt-2">
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
            placeholder="Clarify in your own words..."
            className="resize-none min-h-[48px] text-sm"
            rows={2}
            disabled={disabled}
          />
          <Button
            size="sm"
            className="self-end"
            disabled={!customText.trim() || disabled}
            onClick={handleCustomSubmit}
          >
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
