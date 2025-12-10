import { supabase } from '@/integrations/supabase/client';
import type { TranslationSegment, TranslationSettings } from '@/types/translation';
import { SUPPORTED_LANGUAGES } from '@/types/translation';

interface TranslationResponse {
  segments: Array<{
    id: string;
    translatedText: string;
    rationale: string;
    type: 'paragraph' | 'heading' | 'button' | 'list-item';
  }>;
  error?: string;
}

export async function translateText(settings: TranslationSettings): Promise<TranslationSegment[]> {
  const sourceLanguageName = SUPPORTED_LANGUAGES.find(l => l.code === settings.sourceLanguage)?.name || settings.sourceLanguage;
  const targetLanguageName = SUPPORTED_LANGUAGES.find(l => l.code === settings.targetLanguage)?.name || settings.targetLanguage;

  // Split source text into paragraphs for mapping
  const sourceParagraphs = settings.sourceText
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => p.trim());

  const { data, error } = await supabase.functions.invoke<TranslationResponse>('translate-text', {
    body: {
      sourceText: settings.sourceText,
      sourceLanguage: sourceLanguageName,
      targetLanguage: targetLanguageName,
      tone: settings.tone,
      requirements: settings.requirements,
    },
  });

  if (error) {
    console.error('Translation service error:', error);
    throw new Error(error.message || 'Translation failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.segments || !Array.isArray(data.segments)) {
    throw new Error('Invalid response from translation service');
  }

  // Map the AI segments back to source paragraphs
  const segments: TranslationSegment[] = data.segments.map((seg, index) => ({
    id: seg.id || `seg-${index}`,
    sourceText: sourceParagraphs[index] || '',
    translatedText: seg.translatedText,
    rationale: seg.rationale,
    type: seg.type,
  }));

  return segments;
}
