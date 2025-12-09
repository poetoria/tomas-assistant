import { Briefcase, Megaphone, Check } from 'lucide-react';
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
    <div className="space-y-5">
      <label className="text-sm font-medium text-foreground font-display">Choose Translation Tone</label>
      
      <div className="grid gap-4">
        {tones.map((tone) => {
          const Icon = tone.icon;
          const isSelected = selectedTone === tone.id;
          
          return (
            <button
              key={tone.id}
              onClick={() => onSelect(tone.id)}
              className={cn(
                'group relative flex items-start gap-5 p-5 sm:p-6 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden',
                isSelected
                  ? 'border-primary bg-gradient-to-br from-primary/8 to-primary/3 shadow-lg shadow-primary/10'
                  : 'border-border/50 hover:border-primary/30 bg-card hover:shadow-md'
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300',
                  isSelected 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-lg text-foreground font-display">{tone.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{tone.description}</p>
                <p className="text-sm italic text-muted-foreground/70 bg-muted/30 px-3 py-2 rounded-lg inline-block">{tone.example}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
