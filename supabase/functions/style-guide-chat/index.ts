import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 30;  // max requests
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

interface ChatRequest {
  question: string;
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
    const { question, globalInstructions, glossary, styleGuideText, brandName, industry, trainingConfig }: ChatRequest = await req.json();

    // Input validation - prevent abuse with large payloads
    const MAX_QUESTION_LENGTH = 2000;
    const MAX_INSTRUCTIONS_LENGTH = 5000;
    const MAX_STYLE_GUIDE_LENGTH = 50000;

    if (!question?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Question too long. Maximum ${MAX_QUESTION_LENGTH.toLocaleString()} characters allowed.` }),
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
      contextSections.push(`## Global Instructions\n${globalInstructions}`);
    }

    if (glossary?.length > 0) {
      const glossaryText = glossary.map(g => 
        `- "${g.sourceTerm}" → "${g.targetTerm}"${g.notes ? ` (${g.notes})` : ''}`
      ).join('\n');
      contextSections.push(`## Glossary/Terminology\n${glossaryText}`);
    }

    if (styleGuideText?.trim()) {
      contextSections.push(`## Style Guide Content\n${styleGuideText}`);
    }

    if (brandName?.trim()) {
      contextSections.push(`## Brand\nThis content is for ${brandName}. If this is a well-known brand, use your knowledge of their brand guidelines, voice, and style to inform your answers.`);
    }

    if (industry?.trim()) {
      contextSections.push(`## Industry/Sector\nThe content operates within the ${industry} sector. Consider industry-specific terminology, conventions, and best practices.`);
    }

    const brandContext = brandName?.trim() ? ` for ${brandName}` : '';
    const systemPrompt = `You are TINA2, a plain language translation assistant${brandContext}. You help people write clear, simple content.

Your expertise:
- Plain language and clear communication
- User experience writing
- Content strategy
- Accessibility and inclusive design
- Brand voice and tone
- Style guides

${contextSections.length > 0 ? '\n# Context\n' + contextSections.join('\n\n') : ''}

How to respond:
- Never refer to yourself as "AI" or "artificial intelligence" — you are TINA2
- Use British English spelling (e.g. colour, organise, centre)
- Write in short, clear sentences
- Use everyday words, not jargon
- Be direct and helpful
- Give examples when useful
- Keep answers concise — get to the point quickly
- Use bullet points for lists
- If the style guide covers the topic, quote or reference the relevant rule
- If not covered, give your expert recommendation
- Focus on how words, terms, and content are written, formatted, capitalised, and styled — not on how to create or draft entire documents
- When asked about terms like "T&Cs", advise on how to write, abbreviate, or style the term in content — do not explain how to draft a Terms and Conditions document
- Stay within the scope of content style, UX writing, and editorial guidance`;

    console.log('Processing style guide question');

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
          { role: 'user', content: question }
        ],
        max_tokens: 2000,
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
        JSON.stringify({ error: 'Failed to process question' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return new Response(
        JSON.stringify({ error: 'No response generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Style guide question answered successfully');

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in style-guide-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
