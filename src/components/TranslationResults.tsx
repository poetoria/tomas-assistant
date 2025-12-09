import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Download, 
  RotateCcw, 
  AlertTriangle, 
  Search, 
  Eye, 
  EyeOff,
  Copy,
  Check,
  LayoutGrid,
  Rows3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TranslationSegmentCard } from '@/components/TranslationSegment';
import type { TranslationResult } from '@/types/translation';
import { SUPPORTED_LANGUAGES } from '@/types/translation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TranslationResultsProps {
  result: TranslationResult;
  onNewTranslation: () => void;
  onReuse: (result: TranslationResult) => void;
}

export function TranslationResults({ result, onNewTranslation, onReuse }: TranslationResultsProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRationale, setShowRationale] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'cards'>('split');
  const [copiedAll, setCopiedAll] = useState(false);
  
  const sourceLang = SUPPORTED_LANGUAGES.find((l) => l.code === result.settings.sourceLanguage);
  const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === result.settings.targetLanguage);

  // Filter segments by search
  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return result.segments;
    const query = searchQuery.toLowerCase();
    return result.segments.filter(
      (seg) =>
        seg.sourceText.toLowerCase().includes(query) ||
        seg.translatedText.toLowerCase().includes(query)
    );
  }, [result.segments, searchQuery]);

  const handleCopyAll = async () => {
    const allText = result.segments
      .map((seg) => `${seg.sourceText}\n→ ${seg.translatedText}`)
      .join('\n\n');
    await navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    toast({
      title: 'Copied to clipboard',
      description: 'All translations have been copied.',
    });
  };

  const handleExportWord = () => {
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
    <div className="min-h-screen flex flex-col p-4 md:p-6 tina-gradient-bg">
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Button variant="ghost" onClick={onNewTranslation} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            New Translation
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onReuse(result)} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reuse Settings</span>
            </Button>
            <Button variant="outline" onClick={handleCopyAll} className="gap-2">
              {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">Copy All</span>
            </Button>
            <Button variant="tina" onClick={handleExportWord} className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export to Word</span>
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="tina-card p-4 mb-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{sourceLang?.flag}</span>
              <span className="font-medium">{sourceLang?.name}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-2xl">{targetLang?.flag}</span>
              <span className="font-medium">{targetLang?.name}</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
              {result.settings.tone} tone
            </span>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-muted-foreground text-xs">
              {new Date(result.timestamp).toLocaleString('en-GB')}
            </span>
            <span className="text-muted-foreground text-xs">
              • {result.segments.length} segments
            </span>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="tina-card p-3 mb-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search translations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-4">
              {/* Rationale Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="rationale-toggle"
                  checked={showRationale}
                  onCheckedChange={setShowRationale}
                />
                <Label htmlFor="rationale-toggle" className="text-sm cursor-pointer flex items-center gap-1">
                  {showRationale ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  <span className="hidden md:inline">Rationale</span>
                </Label>
              </div>

              {/* View Mode Toggle - Desktop Only */}
              <div className="hidden md:flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('split')}
                >
                  <Rows3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('cards')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Container */}
        <div className="tina-card flex-1 overflow-hidden animate-slide-up">
          <ScrollArea className="h-full max-h-[60vh]">
            {/* Split View - Desktop */}
            <div className={cn(
              "hidden md:block",
              viewMode === 'split' ? 'block' : '!hidden'
            )}>
              {/* Column Headers */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-accent/50 border-b border-border sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{sourceLang?.flag}</span>
                  <span className="font-semibold text-sm">{sourceLang?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{targetLang?.flag}</span>
                  <span className="font-semibold text-sm">{targetLang?.name}</span>
                </div>
              </div>

              {/* Segments */}
              {filteredSegments.length > 0 ? (
                filteredSegments.map((segment) => (
                  <TranslationSegmentCard
                    key={segment.id}
                    segment={segment}
                    showRationale={showRationale}
                    variant="split"
                  />
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No translations match your search.
                </div>
              )}
            </div>

            {/* Cards View - Desktop (when selected) */}
            <div className={cn(
              "hidden md:grid gap-4 p-4",
              viewMode === 'cards' ? 'grid-cols-1 lg:grid-cols-2' : '!hidden'
            )}>
              {filteredSegments.map((segment) => (
                <TranslationSegmentCard
                  key={segment.id}
                  segment={segment}
                  showRationale={showRationale}
                  variant="card"
                />
              ))}
            </div>

            {/* Mobile View - Always Cards */}
            <div className="md:hidden flex flex-col gap-4 p-4">
              {filteredSegments.length > 0 ? (
                filteredSegments.map((segment) => (
                  <TranslationSegmentCard
                    key={segment.id}
                    segment={segment}
                    showRationale={showRationale}
                    variant="card"
                  />
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No translations match your search.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer Warning */}
        <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Please get a native speaker or editor to review this translation before use.
          </p>
        </div>
      </div>
    </div>
  );
}
