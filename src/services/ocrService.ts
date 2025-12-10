import { supabase } from '@/integrations/supabase/client';

export async function extractTextFromImage(imageData: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('extract-text-ocr', {
    body: { imageData },
  });

  if (error) {
    console.error('OCR error:', error);
    throw new Error(error.message || 'Failed to extract text from image');
  }

  if (!data.success) {
    throw new Error(data.error || 'OCR extraction failed');
  }

  return data.extractedText;
}
