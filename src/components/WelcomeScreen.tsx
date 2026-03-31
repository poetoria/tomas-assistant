import { Settings, MessageSquare, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import tomasIcon from '@/assets/tomas-icon.png';

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
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-primary/10 border border-primary/20 mb-4 sm:mb-5 overflow-hidden">
            <img src={tomasIcon} alt="Tomas" width={40} height={40} className="sm:w-11 sm:h-11 object-contain" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3 font-display tracking-tight">
            <span className="bg-gradient-to-r from-primary to-tina-green bg-clip-text text-transparent">Tomas</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 font-medium leading-snug max-w-md mx-auto">
            AI system for applying Unibet's style guide
          </p>
        </div>

        {/* Feature descriptions — plain text list, not cards */}
        <div className="space-y-3 px-4 sm:px-8 mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <span className="text-primary/60 mt-0.5 text-sm">●</span>
            <div>
              <span className="text-sm font-semibold text-foreground/80">Find the right rule</span>
              <span className="text-sm text-muted-foreground"> — Search UX writing rules and patterns, with clear examples.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-primary/60 mt-0.5 text-sm">●</span>
            <div>
              <span className="text-sm font-semibold text-foreground/80">Ask instead of guessing</span>
              <span className="text-sm text-muted-foreground"> — Chat with Tomas to get instant answers based on our style guide.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-primary/60 mt-0.5 text-sm">●</span>
            <div>
              <span className="text-sm font-semibold text-foreground/80">Check your content</span>
              <span className="text-sm text-muted-foreground"> — Check your copy against brand, terminology, and regulatory requirements.</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons — equal hierarchy */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-2 sm:px-8">
          <Button
            onClick={onSelectChat}
            size="lg"
            className="flex items-center gap-3 px-8 py-6 text-base font-semibold rounded-xl shadow-sm"
          >
            <MessageSquare className="w-5 h-5" />
            Ask Tomas
          </Button>
          <Button
            onClick={onSelectCompliance}
            size="lg"
            className="flex items-center gap-3 px-8 py-6 text-base font-semibold rounded-xl shadow-sm"
          >
            <FileCheck className="w-5 h-5" />
            Compliance check
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-10 space-y-1.5 px-2">
          <p className="text-xs text-muted-foreground/40">
            by Tolu Akinyemi
          </p>
          <button
            onClick={() => navigate('/documentation')}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Documentation
          </button>
        </div>
      </div>
    </div>
  );
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

        {/* Feature descriptions — non-interactive */}
        <div className="grid gap-3 px-2 sm:px-0 mb-5 sm:mb-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/40">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
              <Search className="w-[18px] h-[18px] text-primary/70" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground/90 text-sm mb-0.5">Find the right rule</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Search UX writing rules and patterns, with clear examples.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/40">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
              <HelpCircle className="w-[18px] h-[18px] text-primary/70" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground/90 text-sm mb-0.5">Ask instead of guessing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Chat with Tomas to get instant answers based on our style guide.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/40">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
              <ClipboardCheck className="w-[18px] h-[18px] text-primary/70" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground/90 text-sm mb-0.5">Check your content</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Check your copy against brand, terminology, and regulatory requirements.</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-2 sm:px-8">
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
            className="flex items-center gap-3 px-8 py-6 text-base rounded-xl border-border/60 text-foreground/80 hover:text-foreground hover:border-border"
          >
            <FileCheck className="w-5 h-5" />
            Compliance check
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-10 space-y-1.5 px-2">
          <p className="text-xs text-muted-foreground/40">
            by Tolu Akinyemi
          </p>
          <button
            onClick={() => navigate('/documentation')}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Documentation
          </button>
        </div>
      </div>
    </div>
  );
}