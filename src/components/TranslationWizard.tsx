import { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/StepIndicator';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ToneSelector } from '@/components/ToneSelector';
import { SourceInput } from '@/components/SourceInput';
import type { TranslationSettings, TranslationMode, TranslationTone, TranslationResult } from '@/types/translation';
import { SUPPORTED_LANGUAGES } from '@/types/translation';
import { translateText } from '@/services/translationService';
import { useToast } from '@/hooks/use-toast';

interface TranslationWizardProps {
  mode: TranslationMode;
  preferences: {
    lastTargetLanguage: string;
    lastTone: TranslationTone;
    recentLanguages: string[];
  };
  onBack: () => void;
  onComplete: (result: TranslationResult) => void;
  onAddRecentLanguage: (code: string) => void;
}

const steps = [
  { id: 1, label: 'Language' },
  { id: 2, label: 'Tone' },
  { id: 3, label: 'Content' },
  { id: 4, label: 'Translate' },
];

export function TranslationWizard({ mode, preferences, onBack, onComplete, onAddRecentLanguage }: TranslationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<TranslationSettings>({
    mode,
    sourceLanguage: 'en',
    targetLanguage: preferences.lastTargetLanguage,
    tone: preferences.lastTone,
    sourceText: '',
    requirements: '',
  });

  const updateSettings = <K extends keyof TranslationSettings>(key: K, value: TranslationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!settings.targetLanguage;
      case 2:
        return !!settings.tone;
      case 3:
        return settings.sourceText.length > 10;
      default:
        return true;
    }
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    onAddRecentLanguage(settings.targetLanguage);
    
    try {
      const segments = await translateText(settings);
      
      const result: TranslationResult = {
        id: `trans-${Date.now()}`,
        timestamp: Date.now(),
        settings,
        segments,
      };
      
      onComplete(result);
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === settings.targetLanguage);

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 tina-gradient-bg">
      {/* Decorative blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground tina-glass px-4 py-2">
            <span className="text-lg">{mode === 'text' ? '📄' : '🖼'}</span>
            <span className="hidden sm:inline">{mode === 'text' ? 'Plain Text' : 'Screenshot'} Translation</span>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Content */}
        <div className="flex-1 tina-card p-6 sm:p-8 animate-fade-in mt-6">
          {currentStep === 1 && (
            <LanguageSelector
              selectedLanguage={settings.targetLanguage}
              onSelect={(code) => updateSettings('targetLanguage', code)}
              recentLanguages={preferences.recentLanguages}
              label="Select Target Language"
            />
          )}

          {currentStep === 2 && (
            <ToneSelector
              selectedTone={settings.tone}
              onSelect={(tone) => updateSettings('tone', tone)}
            />
          )}

          {currentStep === 3 && (
            <SourceInput
              mode={mode}
              sourceText={settings.sourceText}
              onSourceTextChange={(text) => updateSettings('sourceText', text)}
              screenshotData={settings.screenshotData}
              onScreenshotChange={(data) => updateSettings('screenshotData', data)}
              detectedLanguage={settings.sourceLanguage}
              onDetectedLanguageChange={(code) => updateSettings('sourceLanguage', code)}
              requirements={settings.requirements || ''}
              onRequirementsChange={(text) => updateSettings('requirements', text)}
            />
          )}

          {currentStep === 4 && (
            <div className="text-center py-10">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-8 animate-float">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4 font-display">Ready to translate</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                Your text will be translated to {targetLang?.flag} <span className="font-medium text-foreground">{targetLang?.name}</span> using a <span className="font-medium text-foreground">{settings.tone}</span> tone.
              </p>
              
              <div className="bg-muted/30 backdrop-blur-sm rounded-2xl p-6 text-left max-w-md mx-auto mb-8 border border-border/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium">{SUPPORTED_LANGUAGES.find(l => l.code === settings.sourceLanguage)?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium">{targetLang?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Tone:</span>
                    <span className="font-medium capitalize">{settings.tone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Length:</span>
                    <span className="font-medium">{settings.sourceText.replace(/<[^>]*>/g, '').length} chars</span>
                  </div>
                </div>
              </div>

              <Button
                variant="tina"
                size="xl"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="gap-3 min-w-[200px]"
              >
                {isTranslating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Translate now
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-6 gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1}
              className="gap-2 flex-1 sm:flex-none"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="tina"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed()}
              className="gap-2 flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
