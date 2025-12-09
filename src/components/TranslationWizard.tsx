import { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/StepIndicator';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ToneSelector } from '@/components/ToneSelector';
import { SourceInput } from '@/components/SourceInput';
import type { TranslationSettings, TranslationMode, TranslationTone, TranslationResult, TranslationSegment } from '@/types/translation';
import { SUPPORTED_LANGUAGES } from '@/types/translation';

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

  const simulateTranslation = (): TranslationSegment[] => {
    // Split text into paragraphs and create segments
    const paragraphs = settings.sourceText.split(/\n\n+/).filter((p) => p.trim());
    const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === settings.targetLanguage);
    
    return paragraphs.map((paragraph, index) => {
      // Simulate translation based on tone
      const isFunctional = settings.tone === 'functional';
      const prefix = isFunctional ? '' : '✨ ';
      
      return {
        id: `seg-${index}`,
        sourceText: paragraph.trim(),
        translatedText: `${prefix}[${targetLang?.name} translation of: "${paragraph.trim().substring(0, 50)}..."]`,
        rationale: isFunctional 
          ? 'Translated with focus on clarity and directness. Technical terms preserved.'
          : 'Adapted for marketing impact with culturally appropriate phrasing and emotional appeal.',
        type: paragraph.length < 50 ? 'heading' : 'paragraph',
      };
    });
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    onAddRecentLanguage(settings.targetLanguage);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const segments = simulateTranslation();
    
    const result: TranslationResult = {
      id: `trans-${Date.now()}`,
      timestamp: Date.now(),
      settings,
      segments,
    };
    
    setIsTranslating(false);
    onComplete(result);
  };

  const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === settings.targetLanguage);

  return (
    <div className="min-h-screen flex flex-col p-6 tina-gradient-bg">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="text-sm text-muted-foreground">
            {mode === 'text' ? '📄 Plain Text' : '🖼 Screenshot'} Translation
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Content */}
        <div className="flex-1 tina-card p-6 animate-fade-in">
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
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Translate</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your text will be translated to {targetLang?.flag} {targetLang?.name} using a {settings.tone} tone.
              </p>
              
              <div className="bg-muted/50 rounded-xl p-4 text-left max-w-md mx-auto mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Source:</span>
                    <span className="ml-2 font-medium">{SUPPORTED_LANGUAGES.find(l => l.code === settings.sourceLanguage)?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target:</span>
                    <span className="ml-2 font-medium">{targetLang?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tone:</span>
                    <span className="ml-2 font-medium capitalize">{settings.tone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Length:</span>
                    <span className="ml-2 font-medium">{settings.sourceText.length} chars</span>
                  </div>
                </div>
              </div>

              <Button
                variant="tina"
                size="xl"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="gap-2"
              >
                {isTranslating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Translate Now
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="tina"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
