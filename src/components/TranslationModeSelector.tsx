import { FileText, Image, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TranslationMode } from '@/types/translation';

interface TranslationModeSelectorProps {
  onSelectMode: (mode: TranslationMode) => void;
  onBack: () => void;
}

export function TranslationModeSelector({ onSelectMode, onBack }: TranslationModeSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 tina-gradient-bg">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      <div className="w-full max-w-2xl animate-fade-in relative z-10">
        {/* Title */}
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-display">
            Select Translation Mode
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose how you'd like to input your source content
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid sm:grid-cols-2 gap-5 sm:gap-6 px-2 sm:px-0">
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
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground font-display">Plain Text</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Type or paste text directly
              </p>
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
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground font-display">Screenshot</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Upload an image with text
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
