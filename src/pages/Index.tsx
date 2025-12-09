import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LocalAuth } from '@/components/LocalAuth';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { TranslationWizard } from '@/components/TranslationWizard';
import { TranslationResults } from '@/components/TranslationResults';
import { HistoryPanel } from '@/components/HistoryPanel';
import { usePreferences, useTranslationHistory } from '@/hooks/useLocalStorage';
import type { TranslationMode, TranslationResult } from '@/types/translation';
import { Toaster } from '@/components/ui/toaster';

type AppView = 'auth' | 'welcome' | 'wizard' | 'results';

const hashPin = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

const Index = () => {
  const [view, setView] = useState<AppView>('auth');
  const [selectedMode, setSelectedMode] = useState<TranslationMode>('text');
  const [currentResult, setCurrentResult] = useState<TranslationResult | null>(null);
  const [isPinSetup, setIsPinSetup] = useState(false);
  
  const { preferences, updatePreferences, addRecentLanguage } = usePreferences();
  const { history, addToHistory, removeFromHistory, clearHistory } = useTranslationHistory();

  useEffect(() => {
    const storedHash = localStorage.getItem('tina-pin-hash');
    setIsPinSetup(!!storedHash);
  }, []);

  const handleSetupPin = (pin: string) => {
    localStorage.setItem('tina-pin-hash', hashPin(pin));
    setIsPinSetup(true);
    setView('welcome');
  };

  const handleAuthenticated = () => {
    setView('welcome');
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

  if (view === 'auth') {
    return (
      <>
        <LocalAuth
          onAuthenticated={handleAuthenticated}
          isSetup={isPinSetup}
          onSetupComplete={handleSetupPin}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {/* History Button - Fixed Position */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 right-4 z-50 shadow-tina-md"
          >
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

      {/* Main Content */}
      {view === 'welcome' && (
        <WelcomeScreen
          onSelectMode={handleSelectMode}
          rememberChoices={preferences.rememberChoices}
          onToggleRemember={(value) => updatePreferences({ rememberChoices: value })}
        />
      )}

      {view === 'wizard' && (
        <TranslationWizard
          mode={selectedMode}
          preferences={preferences}
          onBack={handleNewTranslation}
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

      <Toaster />
    </>
  );
};

export default Index;
