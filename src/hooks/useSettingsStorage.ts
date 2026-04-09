import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GlossaryEntry, StyleGuideSettings, StyleGuideDocument, StyleCheckConversation, StyleCheckMessage, TrainingConfig, BrandGovernanceSettings } from '@/types/translation';
import { DEFAULT_TRAINING_CONFIG, DEFAULT_BRAND_GOVERNANCE } from '@/types/translation';

const SETTINGS_KEY = 'tomas_style_settings';
const CONVERSATIONS_KEY = 'tomas_style_conversations';

const DEFAULT_SETTINGS: StyleGuideSettings = {
  globalInstructions: '',
  brandName: '',
  industry: '',
  extractedStyleGuideText: '',
  styleGuideDocuments: [],
  glossary: [],
  trainingConfig: DEFAULT_TRAINING_CONFIG,
  brandGovernance: DEFAULT_BRAND_GOVERNANCE,
};

/** Combine all document texts into a single string for AI consumption */
function combineDocumentTexts(docs: StyleGuideDocument[]): string {
  if (docs.length === 0) return '';
  if (docs.length === 1) return docs[0].extractedText;
  return docs.map(d => `--- ${d.fileName} ---\n${d.extractedText}`).join('\n\n');
}

/** Parse style_guide_content from DB — handles both legacy string and new JSON array format */
function parseStyleGuideContent(raw: string | null): { documents: StyleGuideDocument[]; combinedText: string } {
  if (!raw) return { documents: [], combinedText: '' };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].extractedText) {
      const docs = parsed as StyleGuideDocument[];
      return { documents: docs, combinedText: combineDocumentTexts(docs) };
    }
  } catch {
    // Not JSON — legacy plain text format
  }
  return {
    documents: [{
      id: `doc-legacy-${Date.now()}`,
      fileName: 'Style Guide (imported)',
      extractedText: raw,
      uploadedAt: Date.now(),
    }],
    combinedText: raw,
  };
}

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
          const stored = localStorage.getItem(SETTINGS_KEY);
          if (stored) {
            try {
              const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
              if (!parsed.styleGuideDocuments) parsed.styleGuideDocuments = [];
              if (!parsed.brandGovernance) parsed.brandGovernance = DEFAULT_BRAND_GOVERNANCE;
              setSettings(parsed);
            } catch (e) {
              console.error('Failed to parse local settings:', e);
            }
          }
        } else if (data) {
          const glossaryData = Array.isArray(data.glossary) ? data.glossary as unknown as GlossaryEntry[] : [];
          const { documents, combinedText } = parseStyleGuideContent(data.style_guide_content);
          const trainingData = (data as any).training_config as TrainingConfig | null;
          const brandGov = (data as any).brand_governance as BrandGovernanceSettings | null;
          const cloudSettings: StyleGuideSettings = {
            globalInstructions: data.custom_instructions || '',
            brandName: data.brand_name || '',
            industry: data.industry || '',
            extractedStyleGuideText: combinedText,
            styleGuideDocuments: documents,
            glossary: glossaryData,
            trainingConfig: trainingData ? { ...DEFAULT_TRAINING_CONFIG, ...trainingData } : DEFAULT_TRAINING_CONFIG,
            styleGuideUrls: (data as any).style_guide_urls || [],
            brandGovernance: brandGov ? { ...DEFAULT_BRAND_GOVERNANCE, ...brandGov } : DEFAULT_BRAND_GOVERNANCE,
          };
          setSettings(cloudSettings);
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloudSettings));
        }
      } catch (e) {
        console.error('Cloud sync error:', e);
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
          try {
            const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            if (!parsed.styleGuideDocuments) parsed.styleGuideDocuments = [];
            if (!parsed.brandGovernance) parsed.brandGovernance = DEFAULT_BRAND_GOVERNANCE;
            setSettings(parsed);
          } catch (parseError) {
            console.error('Failed to parse local settings:', parseError);
          }
        }
      }
      setIsLoaded(true);
    };

    loadFromCloud();
  }, []);

  // Sync to cloud with upsert
  const syncToCloud = useCallback(async (newSettings: StyleGuideSettings) => {
    setIsSyncing(true);
    try {
      const currentBackup = localStorage.getItem(SETTINGS_KEY);
      if (currentBackup) {
        localStorage.setItem('tomas_settings_backup', currentBackup);
      }

      const styleGuideContent = newSettings.styleGuideDocuments.length > 0
        ? JSON.stringify(newSettings.styleGuideDocuments)
        : null;

      const { error } = await supabase
        .from('global_settings')
        .upsert({
          id: 'default',
          custom_instructions: newSettings.globalInstructions,
          brand_name: newSettings.brandName,
          industry: newSettings.industry,
          style_guide_content: styleGuideContent,
          glossary: JSON.parse(JSON.stringify(newSettings.glossary)),
          training_config: JSON.parse(JSON.stringify(newSettings.trainingConfig || DEFAULT_TRAINING_CONFIG)),
          style_guide_urls: JSON.parse(JSON.stringify(newSettings.styleGuideUrls || [])),
          brand_governance: JSON.parse(JSON.stringify(newSettings.brandGovernance || DEFAULT_BRAND_GOVERNANCE)),
          updated_at: new Date().toISOString(),
        } as any);

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
      if (updates.styleGuideDocuments) {
        updated.extractedStyleGuideText = combineDocumentTexts(updates.styleGuideDocuments);
      }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncToCloud(updated);
      }, 1000);
      
      return updated;
    });
  }, [syncToCloud]);

  const saveNow = useCallback(async () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    await syncToCloud(settings);
  }, [settings, syncToCloud]);

  const restoreBackup = useCallback(() => {
    const backup = localStorage.getItem('tomas_settings_backup');
    if (backup) {
      try {
        const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(backup) };
        if (!parsed.styleGuideDocuments) parsed.styleGuideDocuments = [];
        if (!parsed.brandGovernance) parsed.brandGovernance = DEFAULT_BRAND_GOVERNANCE;
        setSettings(parsed);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
        syncToCloud(parsed);
        return true;
      } catch (e) {
        console.error('Failed to restore backup:', e);
      }
    }
    return false;
  }, [syncToCloud]);

  const clearSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_KEY);
    
    try {
      await supabase
        .from('global_settings')
        .upsert({
          id: 'default',
          custom_instructions: null,
          brand_name: null,
          industry: null,
          style_guide_content: null,
          glossary: [],
          training_config: JSON.parse(JSON.stringify(DEFAULT_TRAINING_CONFIG)),
          brand_governance: JSON.parse(JSON.stringify(DEFAULT_BRAND_GOVERNANCE)),
          updated_at: new Date().toISOString(),
        } as any);
    } catch (e) {
      console.error('Failed to clear cloud settings:', e);
    }
  }, []);

  return { settings, updateSettings, clearSettings, isLoaded, isSyncing, saveNow, restoreBackup };
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
    const title = initialMessage 
      ? initialMessage.slice(0, 60) + (initialMessage.length > 60 ? '...' : '')
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

  const updateConversationTitle = useCallback((id: string, title: string) => {
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === id ? { ...conv, title } : conv
      );
      saveConversations(updated);
      return updated;
    });
  }, [saveConversations]);

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
    updateConversationTitle,
  };
}
