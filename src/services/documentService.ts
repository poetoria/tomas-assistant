import { supabase } from '@/integrations/supabase/client';

export async function parseDocument(file: File): Promise<string> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const { data, error } = await supabase.functions.invoke<{ text: string; error?: string }>('parse-document', {
    body: {
      fileData: base64,
      fileName: file.name,
      mimeType: file.type,
    },
  });

  if (error) {
    console.error('Document parsing error:', error);
    throw new Error(error.message || 'Failed to parse document');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.text) {
    throw new Error('No text extracted from document');
  }

  return data.text;
}
