import { useState } from 'react';
import { History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { HistoryPanel } from '@/components/HistoryPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PasswordGate } from '@/components/PasswordGate';
import { SettingsPanel } from '@/components/SettingsPanel';
import { StyleGuideCheck } from '@/components/StyleGuideCheck';
import { Toaster } from '@/components/ui/toaster';

type AppView = 'welcome' | 'style-guide' | 'settings' | 'about';

const Index = () => {
  const [view, setView] = useState<AppView>('welcome');
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [styleGuideConversationId, setStyleGuideConversationId] = useState<string | undefined>();
  const [styleGuideInitialTab, setStyleGuideInitialTab] = useState<'chat' | 'compliance'>('chat');

  const handleSelectChat = () => {
    setStyleGuideConversationId(undefined);
    setStyleGuideInitialTab('chat');
    setView('style-guide');
  };

  const handleSelectCompliance = () => {
    setStyleGuideConversationId(undefined);
    setStyleGuideInitialTab('compliance');
    setView('style-guide');
  };

  const handleOpenSettings = () => {
    setShowPasswordGate(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordGate(false);
    setView('settings');
  };

  const handleOpenAbout = () => {
    setView('about');
  };

  const handleHome = () => {
    setView('welcome');
  };

  const handleOpenStyleGuideConversation = (conversationId: string) => {
    setStyleGuideConversationId(conversationId);
    setStyleGuideInitialTab('chat');
    setView('style-guide');
  };

  const showTopBar = view !== 'welcome';

  return (
    <>
      {/* Top Actions - Fixed Position */}
      {showTopBar && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleOpenSettings} className="hover:bg-primary/10">
            <Settings className="w-5 h-5" />
          </Button>
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shadow-md">
                <History className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>History</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <HistoryPanel
                  onOpenStyleGuideConversation={handleOpenStyleGuideConversation}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Password Gate */}
      <PasswordGate
        isOpen={showPasswordGate}
        onClose={() => setShowPasswordGate(false)}
        onSuccess={handlePasswordSuccess}
      />

      {/* Main Content */}
      {view === 'welcome' && (
        <WelcomeScreen
          onSelectChat={handleSelectChat}
          onSelectCompliance={handleSelectCompliance}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {view === 'style-guide' && (
        <StyleGuideCheck
          onBack={handleHome}
          initialConversationId={styleGuideConversationId}
          initialTab={styleGuideInitialTab}
        />
      )}

      {view === 'settings' && (
        <SettingsPanel onBack={handleHome} />
      )}

      {view === 'about' && (
        <div className="min-h-screen p-4 sm:p-6 tina-gradient-bg">
          <div className="max-w-2xl mx-auto pt-16">
            <div className="bg-card border border-border/50 rounded-3xl p-8">
              <h1 className="text-2xl font-bold mb-4 font-display">About Tomas</h1>
              <p className="text-muted-foreground mb-4">
                Tomas is an AI-powered content governance tool built for Unibet. It turns the static style guide into a system that can be queried, applied, and enforced in real time.
              </p>
              <p className="text-muted-foreground mb-6">
                Chat with Tomas to find the correct rules and UX writing patterns, or paste in content to check it against brand, terminology, and regulatory requirements.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button variant="outline" onClick={handleHome}>
                  Back to home
                </Button>
                <Button variant="default" onClick={() => window.open('/documentation', '_blank')}>
                  View documentation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </>
  );
};

export default Index;
