import { FileText, Image, Settings2, Sparkles } from 'lucide-react';
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
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      
      <div className="w-full max-w-2xl animate-fade-in relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6 sm:mb-8 shadow-lg shadow-primary/10 animate-float">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4 sm:mb-5 font-display tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-primary to-tina-green bg-clip-text text-transparent">TINA 2</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed px-2 font-light">
            Plain language translation assistant
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 mb-10 sm:mb-12 px-2 sm:px-0">
          <button
            onClick={() => onSelectMode('text')}
            className="group relative p-8 sm:p-10 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-slide-up text-left overflow-hidden"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground font-display">Plain Text Translation</h3>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('screenshot')}
            className="group relative p-8 sm:p-10 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-slide-up text-left overflow-hidden"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                <Image className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground font-display">Screenshot Translation</h3>
            </div>
          </button>
        </div>

        {/* Remember Choices Toggle */}
        <div 
          className="flex items-center justify-center gap-4 p-4 sm:p-5 mx-2 sm:mx-0 rounded-2xl tina-glass animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Settings2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Label htmlFor="remember-choices" className="text-sm text-muted-foreground cursor-pointer">
            Remember my last choices
          </Label>
          <Switch
            id="remember-choices"
            checked={rememberChoices}
            onCheckedChange={onToggleRemember}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground/70 mt-8 sm:mt-10 px-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Translation Intelligence Natural Assistant • British English by default
        </p>
      </div>
    </div>
  );
}
