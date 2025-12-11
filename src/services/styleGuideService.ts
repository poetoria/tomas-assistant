import { supabase } from '@/integrations/supabase/client';
import type { StyleGuideSettings, ComplianceResult } from '@/types/translation';

export async function askStyleGuideQuestion(
  question: string,
  settings: StyleGuideSettings
): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ answer: string; error?: string }>('style-guide-chat', {
    body: {
      question,
      globalInstructions: settings.globalInstructions,
      glossary: settings.glossary,
      styleGuideText: settings.extractedStyleGuideText,
      brandName: settings.brandName,
      industry: settings.industry,
    },
  });

  if (error) {
    console.error('Style guide chat error:', error);
    throw new Error(error.message || 'Failed to get response');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.answer) {
    throw new Error('No response received');
  }

  return data.answer;
}

export async function checkCompliance(
  content: string,
  settings: StyleGuideSettings
): Promise<ComplianceResult> {
  const { data, error } = await supabase.functions.invoke<ComplianceResult & { error?: string }>('compliance-check', {
    body: {
      content,
      globalInstructions: settings.globalInstructions,
      glossary: settings.glossary,
      styleGuideText: settings.extractedStyleGuideText,
      brandName: settings.brandName,
      industry: settings.industry,
    },
  });

  if (error) {
    console.error('Compliance check error:', error);
    throw new Error(error.message || 'Failed to check compliance');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.issues || !data?.rewrittenContent) {
    throw new Error('Invalid response from compliance check');
  }

  return {
    issues: data.issues,
    rewrittenContent: data.rewrittenContent,
    summary: data.summary || 'Compliance check complete.',
  };
}
