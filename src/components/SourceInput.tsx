import { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectLanguage = useCallback((text: string) => {
    // Simple heuristic language detection
    const lowerText = text.toLowerCase();
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

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onScreenshotChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onScreenshotChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onScreenshotChange(event.target?.result as string);
        // Simulate OCR - in real app would use Tesseract.js or similar
        onSourceTextChange('Extracted text from image would appear here after OCR processing.');
        onDetectedLanguageChange('en');
      };
      reader.readAsDataURL(file);
    }
  };

  const detectedLang = SUPPORTED_LANGUAGES.find((l) => l.code === detectedLanguage);

  return (
    <div className="space-y-6">
      {/* Source Content Input */}
      {mode === 'text' ? (
        <div className="space-y-2">
          <Label>Enter your text</Label>
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
          <Label>Upload Screenshot</Label>
          <div
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
              screenshotData && 'border-solid border-primary/40'
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
          >
            {screenshotData ? (
              <div className="space-y-4">
                <img
                  src={screenshotData}
                  alt="Uploaded screenshot"
                  className="max-h-48 mx-auto rounded-lg shadow-md"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onScreenshotChange(undefined)}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your image here, or
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}
          </div>

          {screenshotData && sourceText && (
            <div className="space-y-2">
              <Label>Extracted Text</Label>
              <Textarea
                value={sourceText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="min-h-[120px] resize-none bg-muted/50"
              />
            </div>
          )}
        </div>
      )}

      {/* Language Detection */}
      {sourceText.length > 20 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/50 border border-accent">
          <CheckCircle className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Detected language: {detectedLang?.flag} {detectedLang?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Is this correct? You can change it below if needed.
            </p>
          </div>
          <select
            value={detectedLanguage}
            onChange={(e) => onDetectedLanguageChange(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Requirements */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Specific Requirements
          <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
        </Label>
        <Input
          placeholder="e.g. Keep currency in GBP, use informal tone, preserve formatting..."
          value={requirements}
          onChange={(e) => onRequirementsChange(e.target.value)}
        />
      </div>
    </div>
  );
}
