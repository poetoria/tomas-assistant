import { useState, useEffect, useCallback } from 'react';
import type { StoredPreferences, TranslationResult } from '@/types/translation';

const PREFERENCES_KEY = 'tina2_preferences';
const HISTORY_KEY = 'tina2_history';
const MAX_HISTORY_ITEMS = 5;

const defaultPreferences: StoredPreferences = {
  lastTargetLanguage: 'fr',
  lastTone: 'functional',
  recentLanguages: ['fr', 'de', 'es'],
  rememberChoices: true,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<StoredPreferences>(defaultPreferences);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  const updatePreferences = useCallback((updates: Partial<StoredPreferences>) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, ...updates };
      try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPrefs));
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
      return newPrefs;
    });
  }, []);

  const addRecentLanguage = useCallback((langCode: string) => {
    setPreferences((prev) => {
      const recent = [langCode, ...prev.recentLanguages.filter((l) => l !== langCode)].slice(0, 5);
      const newPrefs = { ...prev, recentLanguages: recent, lastTargetLanguage: langCode };
      try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPrefs));
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
      return newPrefs;
    });
  }, []);

  return { preferences, updatePreferences, addRecentLanguage };
}

export function useTranslationHistory() {
  const [history, setHistory] = useState<TranslationResult[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  const addToHistory = useCallback((result: TranslationResult) => {
    setHistory((prev) => {
      const newHistory = [result, ...prev].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Failed to save history:', error);
      }
      return newHistory;
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Failed to save history:', error);
      }
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
