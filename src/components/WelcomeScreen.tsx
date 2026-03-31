import { Settings, Sparkles, MessageSquare, FileCheck, Search, HelpCircle, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface WelcomeScreenProps {
  onSelectChat: () => void;
  onSelectCompliance: () => void;
  onOpenSettings: () => void;
}

export function WelcomeScreen({ onSelectChat, onSelectCompliance, onOpenSettings }: WelcomeScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background">
      {/* Settings Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={onOpenSettings} className="hover:bg-primary/10">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary/10 border border-primary/20 mb-4 sm:mb-5">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3 font-display tracking-tight">
            <span className="bg-gradient-to-r from-primary to-tina-green bg-clip-text text-transparent">Tomas</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 font-medium leading-snug max-w-md mx-auto">
            AI system for applying Unibet's style guide
          </p>
        </div>

        {/* Feature descriptions — grouped with horizontal rules */}
        <div className="border-t border-border/30 mx-2 sm:mx-0"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-2 sm:px-0 my-4">
          <div className="text-center px-3 py-5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-3">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground/90 text-sm mb-1.5">Find the right rule</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Search UX writing rules and patterns, with clear examples.</p>
          </div>

          <div className="text-center px-3 py-5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-3">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground/90 text-sm mb-1.5">Ask instead of guessing</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Chat with Tomas to get instant answers based on our style guide.</p>
          </div>

          <div className="text-center px-3 py-5">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-3">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground/90 text-sm mb-1.5">Check your content</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Check your copy against brand and regulatory requirements.</p>
          </div>
        </div>
        <div className="border-t border-border/30 mx-2 sm:mx-0 mb-8"></div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-2 sm:px-8">
          <Button
            onClick={onSelectChat}
            size="lg"
            className="flex items-center gap-3 px-10 py-6 text-base font-semibold rounded-xl shadow-sm"
          >
            <MessageSquare className="w-5 h-5" />
            Ask Tomas
          </Button>
          <Button
            onClick={onSelectCompliance}
            variant="outline"
            size="lg"
            className="flex items-center gap-3 px-8 py-6 text-base rounded-xl border-primary/50 text-foreground/80 hover:text-foreground hover:border-primary hover:bg-primary/5"
          >
            <FileCheck className="w-5 h-5" />
            Compliance check
          </Button>
        </div>
      </div>

      {/* Footer — pinned to bottom */}
      <div className="fixed bottom-6 left-0 right-0 flex items-center justify-center gap-3">
        <span className="text-xs text-primary/60">
          by Tolu Akinyemi
        </span>
        <span className="text-xs text-primary/30">|</span>
        <button
          onClick={() => navigate('/documentation')}
          className="text-xs text-primary/60 hover:text-primary transition-colors"
        >
          Documentation
        </button>
      </div>
    </div>
  );
}
