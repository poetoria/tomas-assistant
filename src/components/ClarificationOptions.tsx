import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, PenLine, Compass } from 'lucide-react';

export interface StructuredOptions {
  type: 'clarification' | 'exploration' | null;
  options: string[];
  cleanText: string;
}

/**
 * Parse structured [CLARIFICATION] or [EXPLORATION] JSON markers from an assistant message.
 * Returns the type, options array, and the clean text with markers removed.
 */
export function parseStructuredOptions(text: string): StructuredOptions {
  // Try clarification marker
  const clarMatch = text.match(/\[CLARIFICATION\]\s*(\{.*?\})\s*\[\/CLARIFICATION\]/s);
  if (clarMatch) {
    try {
      const parsed = JSON.parse(clarMatch[1]);
      if (Array.isArray(parsed.options) && parsed.options.length >= 2) {
        return {
          type: 'clarification',
          options: parsed.options.slice(0, 6),
          cleanText: text.replace(clarMatch[0], '').trim(),
        };
      }
    } catch { /* ignore parse errors */ }
  }

  // Try exploration marker
  const expMatch = text.match(/\[EXPLORATION\]\s*(\{.*?\})\s*\[\/EXPLORATION\]/s);
  if (expMatch) {
    try {
      const parsed = JSON.parse(expMatch[1]);
      if (Array.isArray(parsed.options) && parsed.options.length >= 2) {
        return {
          type: 'exploration',
          options: parsed.options.slice(0, 6),
          cleanText: text.replace(expMatch[0], '').trim(),
        };
      }
    } catch { /* ignore parse errors */ }
  }

  return { type: null, options: [], cleanText: text };
}

/**
 * Try to resolve a short user input (like "1", "2", or partial text)
 * against active options. Returns the matched option text or null.
 */
export function resolveOptionInput(
  input: string,
  options: string[]
): string | null {
  const trimmed = input.trim();
  if (!trimmed || options.length === 0) return null;

  // Numeric match (1-indexed)
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && trimmed === String(num) && num >= 1 && num <= options.length) {
    return options[num - 1];
  }

  // Exact text match (case-insensitive)
  const lower = trimmed.toLowerCase();
  const exact = options.find((o) => o.toLowerCase() === lower);
  if (exact) return exact;

  // Partial prefix match (at least 4 chars)
  if (lower.length >= 4) {
    const partial = options.find((o) => o.toLowerCase().startsWith(lower));
    if (partial) return partial;
  }

  return null;
}

interface StructuredOptionsUIProps {
  type: 'clarification' | 'exploration';
  options: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function StructuredOptionsUI({ type, options, onSelect, disabled }: StructuredOptionsUIProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleCustomSubmit = () => {
    if (customText.trim()) {
      onSelect(customText.trim());
      setCustomText('');
      setShowCustom(false);
    }
  };

  const isClarification = type === 'clarification';
  const Icon = isClarification ? MessageSquare : Compass;
  const label = isClarification ? 'Choose an option:' : 'Explore further:';

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            disabled={disabled}
            className="text-xs text-left h-auto py-2 px-3 whitespace-normal max-w-[280px]"
            onClick={() => onSelect(opt)}
          >
            <Icon className="w-3 h-3 mr-1.5 shrink-0" />
            <span>{isClarification ? `${idx + 1}. ` : ''}{opt}</span>
          </Button>
        ))}
        {isClarification && (
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
        )}
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
