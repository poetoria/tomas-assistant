import { supabase } from '@/integrations/supabase/client';

export async function fetchStyleGuideFromUrl(url: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ success: boolean; markdown?: string; error?: string }>('fetch-style-guide-url', {
    body: { url },
  });

  if (error) {
    console.error('URL fetch error:', error);
    throw new Error(error.message || 'Failed to fetch URL');
  }

  if (!data?.success || !data?.markdown) {
    throw new Error(data?.error || 'No content extracted from URL');
  }

  return data.markdown;
}
