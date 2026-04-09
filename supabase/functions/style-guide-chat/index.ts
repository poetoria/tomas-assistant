import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_REQUESTS) return false;
  record.count++;
  return true;
}

interface TrainingConfig {
  targetAudience?: string;
  readingLevel?: string;
  spellingConvention?: string;
  contentTypeFocus?: string[];
  bannedWords?: string;
  preferredAlternatives?: string;
  toneLevel?: string;
  directness?: string;
  humourLevel?: string;
  riskLevel?: string;
  regulatoryMode?: string;
  contentIntent?: string;
  audienceSophistication?: string;
  brandWeAre?: string;
  brandWeAreNot?: string;
  prohibitedPatterns?: string;
  mandatoryRules?: string;
  decisionRules?: string;
}

interface ChatRequest {
  question: string;
  globalInstructions: string;
  glossary: Array<{ sourceTerm: string; targetTerm: string; notes?: string }>;
  styleGuideText: string;
  brandName: string;
  industry: string;
  trainingConfig?: TrainingConfig;
  conversationHistory?: Array<{ role: string; content: string }>;
}

function buildTrainingSection(tc?: TrainingConfig): string {
  if (!tc) return '';
  const parts: string[] = [];

  // Audience & target
  if (tc.targetAudience?.trim()) parts.push(`- Target audience: ${tc.targetAudience}`);
  const sophMap: Record<string, string> = { general: 'General public', experienced: 'Experienced users', expert: 'Industry experts' };
  if (tc.audienceSophistication && tc.audienceSophistication !== 'general') parts.push(`- Audience sophistication: ${sophMap[tc.audienceSophistication] || tc.audienceSophistication}`);

  // Voice & tone
  const toneMap: Record<string, string> = { formal: 'Formal', neutral: 'Neutral', conversational: 'Conversational' };
  if (tc.toneLevel && tc.toneLevel !== 'neutral') parts.push(`- Tone: ${toneMap[tc.toneLevel] || tc.toneLevel}`);
  const directMap: Record<string, string> = { soft: 'Soft and diplomatic', balanced: 'Balanced', blunt: 'Direct and blunt' };
  if (tc.directness && tc.directness !== 'balanced') parts.push(`- Directness: ${directMap[tc.directness] || tc.directness}`);
  const humourMap: Record<string, string> = { none: 'No humour', light: 'Light, occasional humour', moderate: 'Moderate humour welcome' };
  if (tc.humourLevel && tc.humourLevel !== 'none') parts.push(`- Humour: ${humourMap[tc.humourLevel] || tc.humourLevel}`);

  // Content intent
  const intentMap: Record<string, string> = { inform: 'Inform the reader', convert: 'Drive conversion', warn: 'Warn or caution', guide: 'Guide through a process', comply: 'Ensure regulatory compliance' };
  if (tc.contentIntent && tc.contentIntent !== 'inform') parts.push(`- Content intent: ${intentMap[tc.contentIntent] || tc.contentIntent}`);

  // Risk & regulatory
  if (tc.riskLevel === 'medium') parts.push(`- Risk level: Medium — use clear, precise language. Minimise ambiguity.`);
  if (tc.riskLevel === 'high') parts.push(`- Risk level: High — use strict, unambiguous language. No exaggeration, no superlatives, no implied promises. Every claim must be defensible.`);
  const regMap: Record<string, string> = {
    financial: 'Financial services (FCA-style) — apply financial promotion rules, include required disclaimers',
    healthcare: 'Healthcare — avoid medical claims, use approved terminology',
    gambling: 'Gambling / safer gambling — apply responsible gambling messaging, include safer gambling warnings, avoid encouraging excessive play',
  };
  if (tc.regulatoryMode && tc.regulatoryMode !== 'general') parts.push(`- Regulatory mode: ${regMap[tc.regulatoryMode] || tc.regulatoryMode}`);

  // Spelling
  const spellingMap: Record<string, string> = { british: 'British English', american: 'American English', australian: 'Australian English' };
  if (tc.spellingConvention) parts.push(`- Spelling: ${spellingMap[tc.spellingConvention] || tc.spellingConvention}`);
  if (tc.contentTypeFocus?.length) parts.push(`- Content types: ${tc.contentTypeFocus.join(', ')}`);

  // Brand personality
  if (tc.brandWeAre?.trim()) parts.push(`- Brand personality — we ARE: ${tc.brandWeAre}`);
  if (tc.brandWeAreNot?.trim()) parts.push(`- Brand personality — we are NOT: ${tc.brandWeAreNot}`);

  // Banned words
  if (tc.bannedWords?.trim()) parts.push(`- Never use these words/phrases:\n${tc.bannedWords.split('\n').map(w => `  • ${w.trim()}`).filter(w => w !== '  • ').join('\n')}`);
  if (tc.preferredAlternatives?.trim()) parts.push(`- Preferred alternatives:\n${tc.preferredAlternatives.split('\n').map(a => `  • ${a.trim()}`).filter(a => a !== '  • ').join('\n')}`);

  // Prohibited patterns
  if (tc.prohibitedPatterns?.trim()) parts.push(`- Prohibited patterns (flag these in content):\n${tc.prohibitedPatterns.split('\n').map(p => `  • ${p.trim()}`).filter(p => p !== '  • ').join('\n')}`);

  // Mandatory rules
  if (tc.mandatoryRules?.trim()) parts.push(`- Mandatory content rules (content MUST include these where applicable):\n${tc.mandatoryRules.split('\n').map(r => `  • ${r.trim()}`).filter(r => r !== '  • ').join('\n')}`);

  // Decision rules
  if (tc.decisionRules?.trim()) parts.push(`- Decision rules:\n${tc.decisionRules.split('\n').map(r => `  • ${r.trim()}`).filter(r => r !== '  • ').join('\n')}`);

  return parts.length > 0 ? `## Training & guardrails\n${parts.join('\n')}` : '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { question, globalInstructions, glossary, styleGuideText, brandName, industry, trainingConfig, conversationHistory }: ChatRequest = await req.json();

    const MAX_QUESTION_LENGTH = 2000;
    const MAX_INSTRUCTIONS_LENGTH = 5000;
    const MAX_STYLE_GUIDE_LENGTH = 200000;

    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'Question is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return new Response(JSON.stringify({ error: `Question too long. Maximum ${MAX_QUESTION_LENGTH.toLocaleString()} characters.` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (globalInstructions && globalInstructions.length > MAX_INSTRUCTIONS_LENGTH) {
      return new Response(JSON.stringify({ error: `Instructions too long.` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (styleGuideText && styleGuideText.length > MAX_STYLE_GUIDE_LENGTH) {
      return new Response(JSON.stringify({ error: `Style guide too long.` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const contextSections = [];
    if (globalInstructions?.trim()) contextSections.push(`## Global Instructions\n${globalInstructions}`);
    if (glossary?.length > 0) {
      contextSections.push(`## Glossary/Terminology\n${glossary.map(g => `- "${g.sourceTerm}" → "${g.targetTerm}"${g.notes ? ` (${g.notes})` : ''}`).join('\n')}`);
    }
    if (styleGuideText?.trim()) contextSections.push(`## Style Guide Content\n${styleGuideText}`);
    if (brandName?.trim()) contextSections.push(`## Brand\nThis content is for ${brandName}. If this is a well-known brand, use your knowledge of their brand guidelines, voice, and style to inform your answers.\n\nIMPORTANT: When the user says "we", "our", or "us", they are referring to ${brandName}. Interpret all questions accordingly.`);
    if (industry?.trim()) contextSections.push(`## Industry/Sector\nThe content operates within the ${industry} sector.`);

    const trainingSection = buildTrainingSection(trainingConfig);
    if (trainingSection) contextSections.push(trainingSection);

    const brandContext = brandName?.trim() ? ` for ${brandName}` : '';
    const systemPrompt = `You are Tomas, an AI-powered content governance assistant${brandContext}. You help people write clear, on-brand content.

Your expertise:
- Plain language and clear communication
- User experience writing
- Content strategy
- Accessibility and inclusive design
- Brand voice and tone
- Style guides

${contextSections.length > 0 ? '\n# Context\n' + contextSections.join('\n\n') : ''}

How to respond:
- Never refer to yourself as "AI" or "artificial intelligence" — you are Tomas
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

    // Build messages array with conversation history
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];
    if (conversationHistory?.length) {
      // Include last N messages for context
      const recent = conversationHistory.slice(-10);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    // Only add the current question if it's not already the last message in history
    const lastHistoryMsg = conversationHistory?.[conversationHistory.length - 1];
    if (!lastHistoryMsg || lastHistoryMsg.content !== question || lastHistoryMsg.role !== 'user') {
      messages.push({ role: 'user', content: question });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Usage limit reached.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'Failed to process question' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;
    if (!answer) return new Response(JSON.stringify({ error: 'No response generated' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    console.log('Style guide question answered successfully');
    return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in style-guide-chat:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
