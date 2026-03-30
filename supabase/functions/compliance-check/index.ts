import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 20;  // max requests
const RATE_LIMIT_WINDOW_MS = 60000;  // per minute

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

interface TrainingConfig {
  targetAudience?: string;
  readingLevel?: 'simple' | 'standard' | 'advanced';
  spellingConvention?: 'british' | 'american' | 'australian';
  contentTypeFocus?: string[];
  bannedWords?: string;
  preferredAlternatives?: string;
}

interface ComplianceRequest {
  content: string;
  globalInstructions: string;
  glossary: Array<{ sourceTerm: string; targetTerm: string; notes?: string }>;
  styleGuideText: string;
  brandName: string;
  industry: string;
  trainingConfig?: TrainingConfig;
}

function buildTrainingSection(tc?: TrainingConfig): string {
  if (!tc) return '';
  const parts: string[] = [];
  if (tc.targetAudience?.trim()) parts.push(`- Target audience: ${tc.targetAudience}`);
  const levelMap = { simple: 'Simple (age 9–11)', standard: 'Standard (age 12–15)', advanced: 'Advanced (age 16+)' };
  if (tc.readingLevel && tc.readingLevel !== 'standard') parts.push(`- Reading level: ${levelMap[tc.readingLevel]}`);
  const spellingMap = { british: 'British English', american: 'American English', australian: 'Australian English' };
  if (tc.spellingConvention) parts.push(`- Spelling convention: ${spellingMap[tc.spellingConvention]}`);
  if (tc.contentTypeFocus?.length) parts.push(`- Content types: ${tc.contentTypeFocus.join(', ')}`);
  if (tc.bannedWords?.trim()) parts.push(`- Never use these words/phrases:\n${tc.bannedWords.split('\n').map(w => `  • ${w.trim()}`).filter(w => w !== '  • ').join('\n')}`);
  if (tc.preferredAlternatives?.trim()) parts.push(`- Preferred alternatives:\n${tc.preferredAlternatives.split('\n').map(a => `  • ${a.trim()}`).filter(a => a !== '  • ').join('\n')}`);
  return parts.length > 0 ? `## Training configuration\n${parts.join('\n')}` : '';
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

  // Rate limiting check
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { content, globalInstructions, glossary, styleGuideText, brandName, industry }: ComplianceRequest = await req.json();

    // Input validation - prevent abuse with large payloads
    const MAX_CONTENT_LENGTH = 5000; // ~250 words as specified in UI
    const MAX_INSTRUCTIONS_LENGTH = 5000;
    const MAX_STYLE_GUIDE_LENGTH = 50000;

    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Content too long. Maximum ${MAX_CONTENT_LENGTH.toLocaleString()} characters (~250 words) allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (globalInstructions && globalInstructions.length > MAX_INSTRUCTIONS_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Global instructions too long. Maximum ${MAX_INSTRUCTIONS_LENGTH.toLocaleString()} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (styleGuideText && styleGuideText.length > MAX_STYLE_GUIDE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Style guide too long. Maximum ${MAX_STYLE_GUIDE_LENGTH.toLocaleString()} characters allowed.` }),
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

    const brandContext = brandName?.trim() ? ` for ${brandName}` : '';
    const systemPrompt = `You are TINA2, a plain language translation assistant${brandContext}. Check content against style guide rules and find issues.

${contextSections.length > 0 ? '# Style Guide Context\n' + contextSections.join('\n\n') : '# No style guide provided — use plain language best practices'}

# Your task
1. Find problems in the content
2. For each problem:
   - Quote the text that needs changing
   - Explain the issue in one short sentence
   - Set severity: high (breaks a rule), medium (could be clearer), low (minor improvement)
   - Give the corrected text
3. Write a fully corrected version
4. Write a one-sentence summary

# Writing style
- Never refer to yourself as "AI" or "artificial intelligence" — you are TINA2
- Use British English spelling
- Write in short, clear sentences
- Use everyday words

# Response format
Return valid JSON only. No markdown formatting.
{
  "issues": [
    {
      "id": "issue-1",
      "originalText": "the text with the problem",
      "issue": "short explanation of the problem",
      "severity": "high|medium|low",
      "suggestion": "the corrected text"
    }
  ],
  "rewrittenContent": "the full content with all fixes applied",
  "summary": "one sentence describing what was found"
}

Check for:
- Wrong terminology (check glossary)
- Rule violations
- Unclear writing
- Wrong tone
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
      console.error('Failed to parse AI response as JSON, attempting extraction:', resultText);
      
      // Try to extract JSON object from the response
      const jsonMatch = resultText.match(/\{[\s\S]*"issues"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Try to build a valid response from partial data
          const issuesMatch = resultText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
          const rewrittenMatch = resultText.match(/"rewrittenContent"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
          const summaryMatch = resultText.match(/"summary"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
          
          if (issuesMatch) {
            try {
              const issues = JSON.parse(issuesMatch[0]);
              result = {
                issues,
                rewrittenContent: rewrittenMatch ? rewrittenMatch[1].replace(/\\"/g, '"') : '',
                summary: summaryMatch ? summaryMatch[1].replace(/\\"/g, '"') : `Found ${issues.length} issue(s).`
              };
            } catch (e2) {
              console.error('Failed to extract issues array:', e2);
            }
          }
        }
      }
      
      if (!result) {
        return new Response(
          JSON.stringify({ error: 'Failed to parse compliance results. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
