import { useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { TranslationWizard } from '@/components/TranslationWizard';
import { TranslationResults } from '@/components/TranslationResults';
import { HistoryPanel } from '@/components/HistoryPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePreferences, useTranslationHistory } from '@/hooks/useLocalStorage';
import type { TranslationMode, TranslationResult } from '@/types/translation';
import { Toaster } from '@/components/ui/toaster';

type AppView = 'welcome' | 'wizard' | 'results';

const Index = () => {
  const [view, setView] = useState<AppView>('welcome');
  const [selectedMode, setSelectedMode] = useState<TranslationMode>('text');
  const [currentResult, setCurrentResult] = useState<TranslationResult | null>(null);
  
  const { preferences, updatePreferences, addRecentLanguage } = usePreferences();
  const { history, addToHistory, removeFromHistory, clearHistory } = useTranslationHistory();

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

  return (
    <>
      {/* Top Actions - Fixed Position */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shadow-md"
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
      </div>

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
