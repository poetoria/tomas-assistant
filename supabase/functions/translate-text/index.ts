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

interface TranslationRequest {
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  tone: 'functional' | 'marketing';
  requirements?: string;
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
    const { sourceText, sourceLanguage, targetLanguage, tone, requirements } = await req.json() as TranslationRequest;
    
    // Input validation - prevent abuse with large payloads
    const MAX_SOURCE_TEXT_LENGTH = 50000;
    const MAX_REQUIREMENTS_LENGTH = 2000;
    
    if (!sourceText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Source text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (sourceText.length > MAX_SOURCE_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text too long. Maximum ${MAX_SOURCE_TEXT_LENGTH.toLocaleString()} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (requirements && requirements.length > MAX_REQUIREMENTS_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Requirements too long. Maximum ${MAX_REQUIREMENTS_LENGTH.toLocaleString()} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Translation request: ${sourceLanguage} -> ${targetLanguage}, tone: ${tone}`);
    console.log(`Source text length: ${sourceText.length} characters`);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const toneInstructions = tone === 'functional' 
      ? `Tone: FUNCTIONAL — Clear, direct, easy to understand. Focus on accuracy. Keep technical terms. No embellishment.`
      : `Tone: MARKETING — Persuasive, culturally adapted. Use natural phrasing for the target culture. Adapt idioms to resonate with the audience.`;

    const requirementsText = requirements?.trim() 
      ? `\n\nUser requirements:\n${requirements}`
      : '';

    const systemPrompt = `You are TINA, a plain-language translation assistant. Translate text clearly and accurately.

${toneInstructions}
${requirementsText}

Instructions:
1. Split the text into short segments (1-3 sentences each)
2. For each segment, provide:
   - sourceText: The exact original text
   - translatedText: The translation
   - rationale: One short sentence explaining key choices
   - type: "paragraph", "heading", "button", or "list-item"
3. Write rationales in British English, using simple everyday words
4. Keep rationales brief — just note anything unusual or important
5. Return valid JSON only, no markdown

Format:
[
  {
    "sourceText": "Original text",
    "translatedText": "Translated text",
    "rationale": "Brief note on translation choices",
    "type": "paragraph"
  }
]`;

    const userPrompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}:

${sourceText}`;

    console.log('Calling Lovable AI gateway...');

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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI usage limit reached. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const aiContent = data.choices?.[0]?.message?.content;
    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the AI response
    let segments;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      segments = JSON.parse(cleanContent);
      console.log(`Parsed ${segments.length} translation segments`);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI content:', aiContent);
      throw new Error('Failed to parse translation response');
    }

    // Add IDs to segments and include source text from AI
    const segmentsWithIds = segments.map((seg: any, index: number) => ({
      id: `seg-${index}`,
      sourceText: seg.sourceText || seg.source_text || '',
      translatedText: seg.translatedText || seg.translated_text || '',
      rationale: seg.rationale || seg.explanation || 'Translation completed.',
      type: seg.type || 'paragraph',
    }));

    return new Response(JSON.stringify({ segments: segmentsWithIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in translate-text function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Translation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
