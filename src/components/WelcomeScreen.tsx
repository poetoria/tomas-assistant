import { Settings, Sparkles, MessageSquare, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onSelectChat: () => void;
  onSelectCompliance: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
}

export function WelcomeScreen({ onSelectChat, onSelectCompliance, onOpenSettings, onOpenAbout }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 tina-gradient-bg">
      {/* Settings Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={onOpenSettings} className="hover:bg-primary/10">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      
      <div className="w-full max-w-2xl animate-fade-in relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6 sm:mb-8 shadow-lg shadow-primary/10 animate-float">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-4 sm:mb-5 font-display tracking-tight">
            <span className="bg-gradient-to-r from-primary to-tina-green bg-clip-text text-transparent">Tomas</span>
          </h1>
        </div>

        {/* Description */}
        <div className="text-center mb-8 sm:mb-10 px-4 sm:px-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-4">
            Tomas is an AI-powered content governance tool built for Unibet.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
            It turns our static style guide into a system that can be queried, applied, and enforced in real time.
          </p>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Chat with it or search for the correct rules and UX writing patterns, with clear examples, or paste in content to check it against brand, terminology, and regulatory requirements.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 sm:px-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={onSelectChat}
            size="lg"
            className="flex items-center gap-3 px-8 py-6 text-base rounded-2xl"
          >
            <MessageSquare className="w-5 h-5" />
            Style guide chat
          </Button>
          <Button
            onClick={onSelectCompliance}
            variant="outline"
            size="lg"
            className="flex items-center gap-3 px-8 py-6 text-base rounded-2xl"
          >
            <FileCheck className="w-5 h-5" />
            Compliance check
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 sm:mt-14 px-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-sm text-muted-foreground/70">
            This is a 'work in progress'
          </p>
          <p className="text-xs text-muted-foreground/50 mt-2">
            by Tolu Akinyemi
          </p>
          <button
            onClick={onOpenAbout}
            className="text-xs text-primary/70 hover:text-primary mt-4 underline underline-offset-2 transition-colors"
          >
            About
          </button>
        </div>
      </div>
    </div>
  );
}
