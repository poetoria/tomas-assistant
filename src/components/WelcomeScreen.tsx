import { FileText, Image, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { TranslationMode } from '@/types/translation';

interface WelcomeScreenProps {
  onSelectMode: (mode: TranslationMode) => void;
  rememberChoices: boolean;
  onToggleRemember: (value: boolean) => void;
}

export function WelcomeScreen({ onSelectMode, rememberChoices, onToggleRemember }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 tina-gradient-bg">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 mb-4 sm:mb-6">
            <span className="text-3xl sm:text-4xl">🌐</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            Welcome to <span className="text-primary">TINA 2</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed px-2">
            Plain language translation assistant
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10 px-2 sm:px-0">
          <Button
            variant="tina-card"
            size="card"
            onClick={() => onSelectMode('text')}
            className="group animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Plain Text Translation</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Paste or type your text for translation with full control over tone and style.
            </p>
          </Button>

          <Button
            variant="tina-card"
            size="card"
            onClick={() => onSelectMode('screenshot')}
            className="group animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
              <Image className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Screenshot Translation</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Upload an image and we'll extract and translate the text automatically.
            </p>
          </Button>
        </div>

        {/* Remember Choices Toggle */}
        <div 
          className="flex items-center justify-center gap-3 p-3 sm:p-4 mx-2 sm:mx-0 rounded-xl bg-card border border-border animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
          <Label htmlFor="remember-choices" className="text-xs sm:text-sm text-muted-foreground cursor-pointer">
            Remember my last choices
          </Label>
          <Switch
            id="remember-choices"
            checked={rememberChoices}
            onCheckedChange={onToggleRemember}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 sm:mt-8 px-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Translation Intelligence Natural Assistant • British English by default
        </p>
      </div>
    </div>
  );
}
