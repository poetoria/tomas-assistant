import { Briefcase, Megaphone } from 'lucide-react';
import type { TranslationTone } from '@/types/translation';
import { cn } from '@/lib/utils';

interface ToneSelectorProps {
  selectedTone: TranslationTone;
  onSelect: (tone: TranslationTone) => void;
}

const tones: { id: TranslationTone; label: string; description: string; icon: typeof Briefcase; example: string }[] = [
  {
    id: 'functional',
    label: 'Functional',
    description: 'Clear, direct, and professional. Ideal for instructions, documentation, and business communications.',
    icon: Briefcase,
    example: '"Click here to submit your application."',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Engaging, persuasive, and culturally adapted. Perfect for advertisements, websites, and promotional content.',
    icon: Megaphone,
    example: '"Discover the power of seamless applications!"',
  },
];

export function ToneSelector({ selectedTone, onSelect }: ToneSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground">Choose Translation Tone</label>
      
      <div className="grid gap-4">
        {tones.map((tone) => {
          const Icon = tone.icon;
          const isSelected = selectedTone === tone.id;
          
          return (
            <button
              key={tone.id}
              onClick={() => onSelect(tone.id)}
              className={cn(
                'flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-tina-glow'
                  : 'border-border hover:border-primary/40 bg-card'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">{tone.label}</span>
                  {isSelected && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{tone.description}</p>
                <p className="text-xs italic text-muted-foreground/80">{tone.example}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
