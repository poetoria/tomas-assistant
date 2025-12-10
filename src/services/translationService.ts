import { supabase } from '@/integrations/supabase/client';
import type { TranslationSegment, TranslationSettings } from '@/types/translation';
import { SUPPORTED_LANGUAGES } from '@/types/translation';

interface TranslationResponse {
  segments: Array<{
    id: string;
    sourceText: string;
    translatedText: string;
    rationale: string;
    type: 'paragraph' | 'heading' | 'button' | 'list-item';
  }>;
  error?: string;
}

// Helper to strip HTML tags and convert to plain text with proper paragraph breaks
function htmlToPlainText(html: string): string {
  // Replace block elements with paragraph markers
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '') // Remove all remaining HTML tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .trim();
  
  return text;
}

export async function translateText(settings: TranslationSettings): Promise<TranslationSegment[]> {
  const sourceLanguageName = SUPPORTED_LANGUAGES.find(l => l.code === settings.sourceLanguage)?.name || settings.sourceLanguage;
  const targetLanguageName = SUPPORTED_LANGUAGES.find(l => l.code === settings.targetLanguage)?.name || settings.targetLanguage;

  // Convert HTML to plain text for translation
  const plainSourceText = htmlToPlainText(settings.sourceText);

  const { data, error } = await supabase.functions.invoke<TranslationResponse>('translate-text', {
    body: {
      sourceText: plainSourceText,
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

  // Map the segments from the API response - sourceText is now included from the backend
  const segments: TranslationSegment[] = data.segments.map((seg, index) => ({
    id: seg.id || `seg-${index}`,
    sourceText: seg.sourceText || '',
    translatedText: seg.translatedText,
    rationale: seg.rationale,
    type: seg.type,
  }));

  return segments;
}
