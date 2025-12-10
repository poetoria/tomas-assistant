import { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { extractTextFromImage } from '@/services/ocrService';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/RichTextEditor';
import type { TranslationMode } from '@/types/translation';
import { SUPPORTED_LANGUAGES } from '@/types/translation';
import { cn } from '@/lib/utils';

interface SourceInputProps {
  mode: TranslationMode;
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  screenshotData: string | undefined;
  onScreenshotChange: (data: string | undefined) => void;
  detectedLanguage: string;
  onDetectedLanguageChange: (code: string) => void;
  requirements: string;
  onRequirementsChange: (text: string) => void;
}

export function SourceInput({
  mode,
  sourceText,
  onSourceTextChange,
  screenshotData,
  onScreenshotChange,
  detectedLanguage,
  onDetectedLanguageChange,
  requirements,
  onRequirementsChange,
}: SourceInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const detectLanguage = useCallback((text: string) => {
    if (/[àâäéèêëïîôùûüç]/.test(text)) return 'fr';
    if (/[äöüß]/.test(text)) return 'de';
    if (/[áéíóúñ¿¡]/.test(text)) return 'es';
    if (/[àèìòù]/.test(text)) return 'it';
    if (/[ãõçáéíóú]/.test(text)) return 'pt';
    if (/[а-яё]/i.test(text)) return 'ru';
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/[\u0600-\u06ff]/.test(text)) return 'ar';
    return 'en';
  }, []);

  const handleTextChange = (text: string) => {
    onSourceTextChange(text);
    if (text.length > 20) {
      const detected = detectLanguage(text);
      onDetectedLanguageChange(detected);
    }
  };

  const processOCR = useCallback(async (imageData: string) => {
    setIsProcessingOCR(true);
    try {
      const extractedText = await extractTextFromImage(imageData);
      onSourceTextChange(extractedText);
      
      // Detect language from extracted text
      if (extractedText.length > 20) {
        const detected = detectLanguage(extractedText);
        onDetectedLanguageChange(detected);
      }
      
      toast({
        title: 'Text extracted',
        description: `Successfully extracted ${extractedText.length} characters from the image.`,
      });
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: 'OCR Failed',
        description: error instanceof Error ? error.message : 'Failed to extract text from image',
        variant: 'destructive',
      });
      onSourceTextChange('');
    } finally {
      setIsProcessingOCR(false);
    }
  }, [detectLanguage, onSourceTextChange, onDetectedLanguageChange, toast]);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        onScreenshotChange(imageData);
        await processOCR(imageData);
      };
      reader.readAsDataURL(file);
    }
  }, [onScreenshotChange, processOCR]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        onScreenshotChange(imageData);
        await processOCR(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const detectedLang = SUPPORTED_LANGUAGES.find((l) => l.code === detectedLanguage);

  return (
    <div className="space-y-6">
      {mode === 'text' ? (
        <div className="space-y-3">
          <Label className="font-display">Enter your text</Label>
          <RichTextEditor
            placeholder="Paste or type the text you want to translate..."
            value={sourceText}
            onChange={handleTextChange}
          />
          <p className="text-xs text-muted-foreground">
            {sourceText.replace(/<[^>]*>/g, '').length} characters
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Label className="font-display">Upload Screenshot</Label>
          <div
            className={cn(
              'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300',
              isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border/50 hover:border-primary/30',
              screenshotData && 'border-solid border-primary/30 bg-primary/5'
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
          >
            {screenshotData ? (
              <div className="space-y-4">
                <img src={screenshotData} alt="Uploaded screenshot" className="max-h-48 mx-auto rounded-xl shadow-lg" />
                <Button variant="outline" size="sm" onClick={() => onScreenshotChange(undefined)} className="gap-2">
                  <X className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Drag and drop your image here, or</p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Choose File</Button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </>
            )}
          </div>

          {screenshotData && sourceText && (
            <div className="space-y-2">
              <Label>Extracted Text</Label>
              <Textarea value={sourceText} onChange={(e) => handleTextChange(e.target.value)} className="min-h-[120px] resize-none rounded-xl" />
            </div>
          )}
        </div>
      )}

      {sourceText.length > 20 && (
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-accent/30 border border-accent/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Detected: {detectedLang?.flag} {detectedLang?.name}</p>
            <p className="text-xs text-muted-foreground">Change if incorrect</p>
          </div>
          <select
            value={detectedLanguage}
            onChange={(e) => onDetectedLanguageChange(e.target.value)}
            className="px-4 py-2 text-sm rounded-xl border border-border/50 bg-background"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-3">
        <Label className="flex items-center gap-2 font-display">
          Specific Requirements
          <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
        </Label>
        <Input
          placeholder="e.g. Keep currency in GBP, use informal tone..."
          value={requirements}
          onChange={(e) => onRequirementsChange(e.target.value)}
          className="h-12 rounded-xl border-border/50"
        />
      </div>
    </div>
  );
}
