import { useState, useMemo } from 'react';
import { Search, Clock } from 'lucide-react';
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
    <div className="space-y-4">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search languages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Recent Languages */}
      {!search && recentLangs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Recent</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentLangs.map((lang) => lang && (
              <Button
                key={lang.code}
                variant={selectedLanguage === lang.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelect(lang.code)}
                className="gap-2"
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* All Languages */}
      <ScrollArea className="h-64 rounded-lg border border-border">
        <div className="p-2 grid grid-cols-2 gap-1">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                selectedLanguage === lang.code
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
