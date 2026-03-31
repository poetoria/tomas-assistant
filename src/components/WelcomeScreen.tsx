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

      {/* Subtle background accents — toned down */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary/10 mb-4 sm:mb-5">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3 font-display tracking-tight">
            <span className="bg-gradient-to-r from-primary to-tina-green bg-clip-text text-transparent">Tomas</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 font-medium leading-snug max-w-md mx-auto">
            AI system for applying Unibet's content style guide
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-3 px-2 sm:px-0 mb-6 sm:mb-8">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mt-0.5">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-0.5">Find the right rule</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Search UX writing rules and patterns, with clear examples.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mt-0.5">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-0.5">Ask instead of guessing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Chat with Tomas to get instant answers based on our style guide.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mt-0.5">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-0.5">Check your content</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Check your copy against brand, terminology, and regulatory requirements.</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons — tighter to cards */}
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
            className="flex items-center gap-3 px-8 py-6 text-base rounded-xl"
          >
            <FileCheck className="w-5 h-5" />
            Compliance check
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 sm:mt-12 px-2">
          <p className="text-xs text-muted-foreground/50">
            by Tolu Akinyemi
          </p>
          <button
            onClick={() => navigate('/documentation')}
            className="text-xs text-primary/70 hover:text-primary mt-3 underline underline-offset-2 transition-colors"
          >
            Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
