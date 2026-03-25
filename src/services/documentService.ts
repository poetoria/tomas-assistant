import { supabase } from '@/integrations/supabase/client';

/** Parse a document file and return extracted text */
export async function parseDocument(file: File): Promise<string> {
  // Handle JSON files client-side — no need for edge function
  if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
    return await readJsonFile(file);
  }

  // For PDF/DOCX, send to edge function for AI-powered extraction
  const base64 = await fileToBase64(file);

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

/** Read a JSON file and return its content as formatted text */
async function readJsonFile(file: File): Promise<string> {
  const text = await file.text();
  try {
    const parsed = JSON.parse(text);
    // If it's a structured object, format it nicely
    if (typeof parsed === 'object' && parsed !== null) {
      return formatJsonContent(parsed);
    }
    return text;
  } catch {
    // If JSON parsing fails, return raw text
    return text;
  }
}

/** Format a JSON object into readable text for style guide use */
function formatJsonContent(obj: unknown, indent = 0): string {
  if (typeof obj === 'string') return obj;
  if (typeof obj !== 'object' || obj === null) return String(obj);

  const prefix = '  '.repeat(indent);
  const lines: string[] = [];

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'string') {
        lines.push(`${prefix}- ${item}`);
      } else if (typeof item === 'object' && item !== null) {
        lines.push(formatJsonContent(item, indent));
      } else {
        lines.push(`${prefix}- ${String(item)}`);
      }
    }
  } else {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (typeof value === 'string') {
        lines.push(`${prefix}${label}: ${value}`);
      } else if (Array.isArray(value)) {
        lines.push(`${prefix}${label}:`);
        lines.push(formatJsonContent(value, indent + 1));
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`${prefix}${label}:`);
        lines.push(formatJsonContent(value, indent + 1));
      } else {
        lines.push(`${prefix}${label}: ${String(value)}`);
      }
    }
  }

  return lines.join('\n');
}

/** Convert a file to base64 string */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
