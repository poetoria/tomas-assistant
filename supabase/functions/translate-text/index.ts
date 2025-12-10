import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  try {
    const { sourceText, sourceLanguage, targetLanguage, tone, requirements } = await req.json() as TranslationRequest;
    
    console.log(`Translation request: ${sourceLanguage} -> ${targetLanguage}, tone: ${tone}`);
    console.log(`Source text length: ${sourceText.length} characters`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const toneInstructions = tone === 'functional' 
      ? `Use a FUNCTIONAL tone: Clear, direct, and easy to understand. Focus on accuracy and clarity. Preserve technical terms and formatting. Avoid embellishment.`
      : `Use a MARKETING tone: Persuasive and culturally adapted. Use emotional appeal and natural phrasing appropriate for the target culture. Adapt idioms and expressions to resonate with the target audience.`;

    const requirementsText = requirements?.trim() 
      ? `\n\nAdditional requirements from the user:\n${requirements}`
      : '';

    const systemPrompt = `You are TINA, a professional plain-language translation assistant. Your goal is to provide high-quality, accurate translations that are easy to understand.

${toneInstructions}
${requirementsText}

IMPORTANT INSTRUCTIONS:
1. Split the source text into logical segments (paragraphs, headings, list items)
2. For each segment, provide:
   - translatedText: The translated text
   - rationale: A brief explanation (1-2 sentences) of key translation choices or cultural adaptations
   - type: One of "paragraph", "heading", "button", or "list-item"
3. Preserve the original structure and formatting
4. Return ONLY valid JSON array, no markdown code blocks or other text

Example output format:
[
  {
    "translatedText": "Translated text here",
    "rationale": "Explanation of translation choices",
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

    // Add IDs to segments
    const segmentsWithIds = segments.map((seg: any, index: number) => ({
      id: `seg-${index}`,
      sourceText: '', // Will be filled by frontend
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
