import { useState, useMemo } from 'react';
import { Search, Clock, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SUPPORTED_LANGUAGES } from '@/types/translation';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelect: (code: string) => void;
  recentLanguages: string[];
  label: string;
}

export function LanguageSelector({ selectedLanguage, onSelect, recentLanguages, label }: LanguageSelectorProps) {
  const [search, setSearch] = useState('');

  const filteredLanguages = useMemo(() => {
    if (!search) return SUPPORTED_LANGUAGES;
    const lower = search.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (lang) => lang.name.toLowerCase().includes(lower) || lang.code.toLowerCase().includes(lower)
    );
  }, [search]);

  const recentLangs = useMemo(() => {
    return recentLanguages
      .map((code) => SUPPORTED_LANGUAGES.find((l) => l.code === code))
      .filter(Boolean)
      .slice(0, 3);
  }, [recentLanguages]);

  return (
    <div className="space-y-5">
      <label className="text-sm font-medium text-foreground font-display">{label}</label>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search languages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
        />
      </div>

      {/* Recent Languages */}
      {!search && recentLangs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Recently Used</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentLangs.map((lang) => lang && (
              <Button
                key={lang.code}
                variant={selectedLanguage === lang.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelect(lang.code)}
                className={cn(
                  "gap-2 h-10 px-4 rounded-xl transition-all",
                  selectedLanguage === lang.code && "shadow-md shadow-primary/20"
                )}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* All Languages */}
      <ScrollArea className="h-72 rounded-2xl border border-border/50 bg-background/30">
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className={cn(
                'group relative flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200',
                selectedLanguage === lang.code
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-accent/50'
              )}
            >
              {selectedLanguage === lang.code && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <span className="text-2xl">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
