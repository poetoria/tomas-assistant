import { useState } from 'react';
import { History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { TranslationModeSelector } from '@/components/TranslationModeSelector';
import { TranslationWizard } from '@/components/TranslationWizard';
import { TranslationResults } from '@/components/TranslationResults';
import { HistoryPanel } from '@/components/HistoryPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PasswordGate } from '@/components/PasswordGate';
import { SettingsPanel } from '@/components/SettingsPanel';
import { StyleGuideCheck } from '@/components/StyleGuideCheck';
import { usePreferences, useTranslationHistory } from '@/hooks/useLocalStorage';
import type { TranslationMode, TranslationResult } from '@/types/translation';
import { Toaster } from '@/components/ui/toaster';

type AppView = 'welcome' | 'translation-mode' | 'wizard' | 'results' | 'style-guide' | 'settings' | 'about';

const Index = () => {
  const [view, setView] = useState<AppView>('welcome');
  const [selectedMode, setSelectedMode] = useState<TranslationMode>('text');
  const [currentResult, setCurrentResult] = useState<TranslationResult | null>(null);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  
  const { preferences, updatePreferences, addRecentLanguage } = usePreferences();
  const { history, addToHistory, removeFromHistory, clearHistory } = useTranslationHistory();

  const handleSelectTranslations = () => {
    setView('translation-mode');
  };

  const handleSelectStyleGuide = () => {
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

  const handleSelectMode = (mode: TranslationMode) => {
    setSelectedMode(mode);
    setView('wizard');
  };

  const handleTranslationComplete = (result: TranslationResult) => {
    setCurrentResult(result);
    addToHistory(result);
    updatePreferences({
      lastTargetLanguage: result.settings.targetLanguage,
      lastTone: result.settings.tone,
    });
    setView('results');
  };

  const handleNewTranslation = () => {
    setCurrentResult(null);
    setView('welcome');
  };

  const handleViewResult = (result: TranslationResult) => {
    setCurrentResult(result);
    setView('results');
  };

  const handleReuseResult = (result: TranslationResult) => {
    setSelectedMode(result.settings.mode);
    updatePreferences({
      lastTargetLanguage: result.settings.targetLanguage,
      lastTone: result.settings.tone,
    });
    setView('wizard');
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
                <SheetTitle>Translation History</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <HistoryPanel
                  history={history}
                  onView={handleViewResult}
                  onReuse={handleReuseResult}
                  onDelete={removeFromHistory}
                  onClearAll={clearHistory}
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
          onSelectTranslations={handleSelectTranslations}
          onSelectStyleGuide={handleSelectStyleGuide}
          onOpenSettings={handleOpenSettings}
          onOpenAbout={handleOpenAbout}
        />
      )}

      {view === 'translation-mode' && (
        <TranslationModeSelector
          onSelectMode={handleSelectMode}
          onBack={handleNewTranslation}
        />
      )}

      {view === 'wizard' && (
        <TranslationWizard
          mode={selectedMode}
          preferences={preferences}
          onBack={() => setView('translation-mode')}
          onComplete={handleTranslationComplete}
          onAddRecentLanguage={addRecentLanguage}
        />
      )}

      {view === 'results' && currentResult && (
        <TranslationResults
          result={currentResult}
          onNewTranslation={handleNewTranslation}
          onReuse={handleReuseResult}
        />
      )}

      {view === 'style-guide' && (
        <StyleGuideCheck onBack={handleNewTranslation} />
      )}

      {view === 'settings' && (
        <SettingsPanel onBack={handleNewTranslation} />
      )}

      {view === 'about' && (
        <div className="min-h-screen p-4 sm:p-6 tina-gradient-bg">
          <div className="max-w-2xl mx-auto pt-16">
            <div className="bg-card border border-border/50 rounded-3xl p-8">
              <h1 className="text-2xl font-bold mb-4 font-display">About TINA 2</h1>
              <p className="text-muted-foreground mb-6">
                Content coming soon...
              </p>
              <Button variant="outline" onClick={handleNewTranslation}>
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </>
  );
};

export default Index;
