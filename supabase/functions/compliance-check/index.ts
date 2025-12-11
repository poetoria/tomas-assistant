import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRequest {
  content: string;
  globalInstructions: string;
  glossary: Array<{ sourceTerm: string; targetTerm: string; notes?: string }>;
  styleGuideText: string;
  brandName: string;
  industry: string;
}

interface ComplianceIssue {
  id: string;
  originalText: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, globalInstructions, glossary, styleGuideText, brandName, industry }: ComplianceRequest = await req.json();

    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context sections
    let contextSections = [];

    if (globalInstructions?.trim()) {
      contextSections.push(`## Global Instructions/Rules\n${globalInstructions}`);
    }

    if (glossary?.length > 0) {
      const glossaryText = glossary.map(g => 
        `- "${g.sourceTerm}" should be "${g.targetTerm}"${g.notes ? ` (${g.notes})` : ''}`
      ).join('\n');
      contextSections.push(`## Required Terminology\n${glossaryText}`);
    }

    if (styleGuideText?.trim()) {
      contextSections.push(`## Style Guide Rules\n${styleGuideText}`);
    }

    if (brandName?.trim()) {
      contextSections.push(`## Brand Context\nThis content is for ${brandName}.`);
    }

    if (industry?.trim()) {
      contextSections.push(`## Industry Context\nThe content is for the ${industry} sector.`);
    }

    const systemPrompt = `You are an expert Content Designer specializing in content compliance checking. Your task is to analyze content against style guide rules and identify issues.

${contextSections.length > 0 ? '# Style Guide Context\n' + contextSections.join('\n\n') : '# No style guide provided - use general plain language best practices'}

# Your Task
1. Analyze the provided content for compliance issues
2. For each issue found:
   - Quote the problematic text
   - Explain what's wrong
   - Assign severity (high = major violation, medium = moderate concern, low = minor suggestion)
   - Provide a corrected version
3. Create a fully rewritten version with all corrections applied
4. Provide a brief summary

# Response Format
You MUST respond with valid JSON only, no markdown formatting:
{
  "issues": [
    {
      "id": "issue-1",
      "originalText": "the problematic text",
      "issue": "explanation of the problem",
      "severity": "high|medium|low",
      "suggestion": "the corrected text"
    }
  ],
  "rewrittenContent": "the full content with all corrections applied",
  "summary": "brief summary of the compliance check"
}

Focus on:
- Terminology consistency (check glossary)
- Adherence to global instructions
- Style guide rule violations
- Clarity and readability
- Appropriate tone and voice
- Grammar and punctuation`;

    console.log('Processing compliance check');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please check this content for compliance:\n\n${content}` }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to check compliance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      return new Response(
        JSON.stringify({ error: 'No response generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up the response - remove markdown code blocks if present
    resultText = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', resultText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse compliance results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and ensure proper structure
    const issues: ComplianceIssue[] = (result.issues || []).map((issue: any, index: number) => ({
      id: issue.id || `issue-${index + 1}`,
      originalText: issue.originalText || '',
      issue: issue.issue || '',
      severity: ['high', 'medium', 'low'].includes(issue.severity) ? issue.severity : 'medium',
      suggestion: issue.suggestion || '',
    }));

    console.log('Compliance check completed, found', issues.length, 'issues');

    return new Response(
      JSON.stringify({
        issues,
        rewrittenContent: result.rewrittenContent || content,
        summary: result.summary || `Found ${issues.length} issue(s) in the content.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in compliance-check:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
