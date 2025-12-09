import { ArrowLeft, Download, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { TranslationResult } from '@/types/translation';
import { SUPPORTED_LANGUAGES } from '@/types/translation';
import { useToast } from '@/hooks/use-toast';

interface TranslationResultsProps {
  result: TranslationResult;
  onNewTranslation: () => void;
  onReuse: (result: TranslationResult) => void;
}

export function TranslationResults({ result, onNewTranslation, onReuse }: TranslationResultsProps) {
  const { toast } = useToast();
  const sourceLang = SUPPORTED_LANGUAGES.find((l) => l.code === result.settings.sourceLanguage);
  const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === result.settings.targetLanguage);

  const handleExportWord = () => {
    // Create HTML content for Word export
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head><meta charset="utf-8"><title>TINA 2 Translation</title></head>
      <body>
        <h1>Translation Results</h1>
        <p><strong>Source:</strong> ${sourceLang?.name} → <strong>Target:</strong> ${targetLang?.name}</p>
        <p><strong>Tone:</strong> ${result.settings.tone}</p>
        <p><strong>Date:</strong> ${new Date(result.timestamp).toLocaleDateString('en-GB')}</p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; border-color: #22c55e;">
          <thead>
            <tr style="background-color: #f0fdf4;">
              <th style="border: 2px solid #22c55e;">Source Text</th>
              <th style="border: 2px solid #22c55e;">Translated Text</th>
              <th style="border: 2px solid #22c55e;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${result.segments.map(seg => `
              <tr>
                <td style="border: 2px solid #22c55e;">${seg.sourceText}</td>
                <td style="border: 2px solid #22c55e;">${seg.translatedText}</td>
                <td style="border: 2px solid #22c55e; font-style: italic; color: #666;">${seg.rationale}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="margin-top: 20px; color: #666; font-style: italic;">
          ⚠️ Please get a native speaker or editor to review this translation before use.
        </p>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-${result.id}.doc`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: 'Your translation has been downloaded as a Word document.',
    });
  };

  return (
    <div className="min-h-screen flex flex-col p-6 tina-gradient-bg">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onNewTranslation} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            New Translation
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onReuse(result)} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reuse Settings
            </Button>
            <Button variant="tina" onClick={handleExportWord} className="gap-2">
              <Download className="w-4 h-4" />
              Export to Word
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="tina-card p-4 mb-6 animate-fade-in">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{sourceLang?.flag}</span>
              <span className="font-medium">{sourceLang?.name}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-2xl">{targetLang?.flag}</span>
              <span className="font-medium">{targetLang?.name}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
              {result.settings.tone} tone
            </span>
            <div className="h-4 w-px bg-border" />
            <span className="text-muted-foreground">
              {new Date(result.timestamp).toLocaleString('en-GB')}
            </span>
          </div>
        </div>

        {/* Results Table */}
        <div className="tina-card flex-1 overflow-hidden animate-slide-up">
          <ScrollArea className="h-full">
            <table className="w-full">
              <thead className="bg-accent/50 sticky top-0">
                <tr>
                  <th className="tina-table-cell text-left font-semibold text-sm">Source Text</th>
                  <th className="tina-table-cell text-left font-semibold text-sm">Translated Text</th>
                  <th className="tina-table-cell text-left font-semibold text-sm w-1/4">
                    <div className="flex items-center gap-2">
                      Rationale/Notes
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Explains cultural or stylistic choices made during translation
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.segments.map((segment) => (
                  <tr key={segment.id} className="hover:bg-accent/20 transition-colors">
                    <td className="tina-table-cell text-sm">{segment.sourceText}</td>
                    <td className="tina-table-cell text-sm font-medium">{segment.translatedText}</td>
                    <td className="tina-table-cell text-sm text-muted-foreground italic">
                      {segment.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>

        {/* Footer Warning */}
        <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Please get a native speaker or editor to review this translation before use.
          </p>
        </div>
      </div>
    </div>
  );
}
