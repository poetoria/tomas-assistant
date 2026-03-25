import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GlossaryEntry, StyleGuideSettings, StyleCheckConversation, StyleCheckMessage } from '@/types/translation';

const SETTINGS_KEY = 'tina2_style_settings';
const CONVERSATIONS_KEY = 'tina2_style_conversations';

const DEFAULT_SETTINGS: StyleGuideSettings = {
  globalInstructions: '',
  brandName: '',
  industry: '',
  extractedStyleGuideText: '',
  glossary: [],
};

// Global Settings Hook with Cloud Sync
export function useGlobalSettings() {
  const [settings, setSettings] = useState<StyleGuideSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings from cloud on mount
  useEffect(() => {
    const loadFromCloud = async () => {
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('*')
          .eq('id', 'default')
          .single();

        if (error) {
          console.error('Failed to load cloud settings:', error);
          // Fall back to local storage
          const stored = localStorage.getItem(SETTINGS_KEY);
          if (stored) {
            try {
              setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
            } catch (e) {
              console.error('Failed to parse local settings:', e);
            }
          }
        } else if (data) {
          const glossaryData = Array.isArray(data.glossary) ? data.glossary as unknown as GlossaryEntry[] : [];
          const cloudSettings: StyleGuideSettings = {
            globalInstructions: data.custom_instructions || '',
            brandName: data.brand_name || '',
            industry: data.industry || '',
            extractedStyleGuideText: data.style_guide_content || '',
            glossary: glossaryData,
          };
          setSettings(cloudSettings);
          // Also update local storage as cache
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloudSettings));
        }
      } catch (e) {
        console.error('Cloud sync error:', e);
        // Fall back to local storage
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
          } catch (parseError) {
            console.error('Failed to parse local settings:', parseError);
          }
        }
      }
      setIsLoaded(true);
    };

    loadFromCloud();
  }, []);

  // Sync to cloud with debounce
  const syncToCloud = useCallback(async (newSettings: StyleGuideSettings) => {
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('global_settings')
        .update({
          custom_instructions: newSettings.globalInstructions,
          brand_name: newSettings.brandName,
          industry: newSettings.industry,
          style_guide_content: newSettings.extractedStyleGuideText,
          glossary: JSON.parse(JSON.stringify(newSettings.glossary)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');

      if (error) {
        console.error('Failed to sync to cloud:', error);
      }
    } catch (e) {
      console.error('Cloud sync error:', e);
    }
    setIsSyncing(false);
  }, []);

  const updateSettings = useCallback((updates: Partial<StyleGuideSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      // Update local storage immediately as cache
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      
      // Debounce cloud sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncToCloud(updated);
      }, 1000);
      
      return updated;
    });
  }, [syncToCloud]);

  const clearSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_KEY);
    
    // Also clear from cloud
    try {
      await supabase
        .from('global_settings')
        .update({
          custom_instructions: null,
          brand_name: null,
          industry: null,
          style_guide_content: null,
          glossary: [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');
    } catch (e) {
      console.error('Failed to clear cloud settings:', e);
    }
  }, []);

  return { settings, updateSettings, clearSettings, isLoaded, isSyncing };
}

// Glossary Hook
export function useGlossary() {
  const { settings, updateSettings } = useGlobalSettings();

  const addEntry = useCallback((entry: Omit<GlossaryEntry, 'id'>) => {
    const newEntry: GlossaryEntry = {
      ...entry,
      id: `glossary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    updateSettings({ glossary: [...settings.glossary, newEntry] });
    return newEntry;
  }, [settings.glossary, updateSettings]);

  const updateEntry = useCallback((id: string, updates: Partial<GlossaryEntry>) => {
    updateSettings({
      glossary: settings.glossary.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    });
  }, [settings.glossary, updateSettings]);

  const removeEntry = useCallback((id: string) => {
    updateSettings({
      glossary: settings.glossary.filter(entry => entry.id !== id),
    });
  }, [settings.glossary, updateSettings]);

  const bulkImport = useCallback((entries: Omit<GlossaryEntry, 'id'>[]) => {
    const newEntries = entries.map((entry, index) => ({
      ...entry,
      id: `glossary-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    updateSettings({ glossary: [...settings.glossary, ...newEntries] });
  }, [settings.glossary, updateSettings]);

  const clearGlossary = useCallback(() => {
    updateSettings({ glossary: [] });
  }, [updateSettings]);

  return {
    glossary: settings.glossary,
    addEntry,
    updateEntry,
    removeEntry,
    bulkImport,
    clearGlossary,
  };
}

// Style Guide Conversations Hook
export function useStyleGuideConversations() {
  const [conversations, setConversations] = useState<StyleCheckConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
        if (parsed.length > 0) {
          setActiveConversationId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse conversations:', e);
      }
    }
  }, []);

  const saveConversations = useCallback((convs: StyleCheckConversation[]) => {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
  }, []);

  const createConversation = useCallback((initialMessage?: string) => {
    // Generate title from initial message content, or use fallback
    const title = initialMessage 
      ? initialMessage.slice(0, 40) + (initialMessage.length > 40 ? '...' : '')
      : `Chat ${new Date().toLocaleDateString()}`;
    
    const newConv: StyleCheckConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newConv, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    setActiveConversationId(newConv.id);
    return newConv;
  }, [conversations, saveConversations]);

  const addMessage = useCallback((conversationId: string, message: Omit<StyleCheckMessage, 'id' | 'timestamp'>) => {
    const newMessage: StyleCheckMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, newMessage], updatedAt: Date.now() }
          : conv
      );
      saveConversations(updated);
      return updated;
    });
    
    return newMessage;
  }, [saveConversations]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(conv => conv.id !== id);
      saveConversations(updated);
      if (activeConversationId === id) {
        setActiveConversationId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  }, [activeConversationId, saveConversations]);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveConversationId(null);
    localStorage.removeItem(CONVERSATIONS_KEY);
  }, []);

  const searchConversations = useCallback((query: string) => {
    if (!query.trim()) return conversations;
    const lowerQuery = query.toLowerCase();
    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(lowerQuery))
    );
  }, [conversations]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    deleteConversation,
    clearAllConversations,
    searchConversations,
  };
}
