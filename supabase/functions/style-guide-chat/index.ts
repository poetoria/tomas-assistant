import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

  if (tc.targetAudience?.trim()) parts.push(`- Target audience: ${tc.targetAudience}`);
  const sophMap: Record<string, string> = { general: 'General public', experienced: 'Experienced users', expert: 'Industry experts' };
  if (tc.audienceSophistication && tc.audienceSophistication !== 'general') parts.push(`- Audience sophistication: ${sophMap[tc.audienceSophistication] || tc.audienceSophistication}`);

  const toneMap: Record<string, string> = { formal: 'Formal', neutral: 'Neutral', conversational: 'Conversational' };
  if (tc.toneLevel && tc.toneLevel !== 'neutral') parts.push(`- Tone: ${toneMap[tc.toneLevel] || tc.toneLevel}`);
  const directMap: Record<string, string> = { soft: 'Soft and diplomatic', balanced: 'Balanced', blunt: 'Direct and blunt' };
  if (tc.directness && tc.directness !== 'balanced') parts.push(`- Directness: ${directMap[tc.directness] || tc.directness}`);
  const humourMap: Record<string, string> = { none: 'No humour', light: 'Light, occasional humour', moderate: 'Moderate humour welcome' };
  if (tc.humourLevel && tc.humourLevel !== 'none') parts.push(`- Humour: ${humourMap[tc.humourLevel] || tc.humourLevel}`);

  const intentMap: Record<string, string> = { inform: 'Inform the reader', convert: 'Drive conversion', warn: 'Warn or caution', guide: 'Guide through a process', comply: 'Ensure regulatory compliance' };
  if (tc.contentIntent && tc.contentIntent !== 'inform') parts.push(`- Content intent: ${intentMap[tc.contentIntent] || tc.contentIntent}`);

  if (tc.riskLevel === 'medium') parts.push(`- Risk level: Medium — use clear, precise language. Minimise ambiguity.`);
  if (tc.riskLevel === 'high') parts.push(`- Risk level: High — use strict, unambiguous language. No exaggeration, no superlatives, no implied promises. Every claim must be defensible.`);
  const regMap: Record<string, string> = {
    financial: 'Financial services (FCA-style) — apply financial promotion rules, include required disclaimers',
    healthcare: 'Healthcare — avoid medical claims, use approved terminology',
    gambling: 'Gambling / safer gambling — apply responsible gambling messaging, include safer gambling warnings, avoid encouraging excessive play',
  };
  if (tc.regulatoryMode && tc.regulatoryMode !== 'general') parts.push(`- Regulatory mode: ${regMap[tc.regulatoryMode] || tc.regulatoryMode}`);

  const spellingMap: Record<string, string> = { british: 'British English', american: 'American English', australian: 'Australian English' };
  if (tc.spellingConvention) parts.push(`- Spelling: ${spellingMap[tc.spellingConvention] || tc.spellingConvention}`);
  if (tc.contentTypeFocus?.length) parts.push(`- Content types: ${tc.contentTypeFocus.join(', ')}`);

  if (tc.brandWeAre?.trim()) parts.push(`- Brand personality — we ARE: ${tc.brandWeAre}`);
  if (tc.brandWeAreNot?.trim()) parts.push(`- Brand personality — we are NOT: ${tc.brandWeAreNot}`);

  if (tc.bannedWords?.trim()) parts.push(`- Never use these words/phrases:\n${tc.bannedWords.split('\n').map(w => `  • ${w.trim()}`).filter(w => w !== '  • ').join('\n')}`);
  if (tc.preferredAlternatives?.trim()) parts.push(`- Preferred alternatives:\n${tc.preferredAlternatives.split('\n').map(a => `  • ${a.trim()}`).filter(a => a !== '  • ').join('\n')}`);

  if (tc.prohibitedPatterns?.trim()) parts.push(`- Prohibited patterns (flag these in content):\n${tc.prohibitedPatterns.split('\n').map(p => `  • ${p.trim()}`).filter(p => p !== '  • ').join('\n')}`);
  if (tc.mandatoryRules?.trim()) parts.push(`- Mandatory content rules (content MUST include these where applicable):\n${tc.mandatoryRules.split('\n').map(r => `  • ${r.trim()}`).filter(r => r !== '  • ').join('\n')}`);
  if (tc.decisionRules?.trim()) parts.push(`- Decision rules:\n${tc.decisionRules.split('\n').map(r => `  • ${r.trim()}`).filter(r => r !== '  • ').join('\n')}`);

  return parts.length > 0 ? `## Training & guardrails\n${parts.join('\n')}` : '';
}

function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
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

    // Fetch supplemental rules from DB
    const supabase = getSupabaseClient();
    let supplementalRulesText = '';
    try {
      const { data: rules } = await supabase
        .from('supplemental_rules')
        .select('rule_text')
        .order('created_at', { ascending: true });
      if (rules?.length) {
        supplementalRulesText = rules.map((r: any) => `- ${r.rule_text}`).join('\n');
      }
    } catch (e) {
      console.error('Failed to fetch supplemental rules:', e);
    }

    const contextSections = [];
    if (globalInstructions?.trim()) contextSections.push(`## Global Instructions\n${globalInstructions}`);
    if (glossary?.length > 0) {
      contextSections.push(`## Glossary/Terminology\n${glossary.map(g => `- "${g.sourceTerm}" → "${g.targetTerm}"${g.notes ? ` (${g.notes})` : ''}`).join('\n')}`);
    }
    if (styleGuideText?.trim()) contextSections.push(`## Style Guide Content\n${styleGuideText}`);
    if (supplementalRulesText) contextSections.push(`## Supplemental Rules (working rules added by admins)\n${supplementalRulesText}`);
    if (brandName?.trim()) contextSections.push(`## Brand\nThis content is for ${brandName}. If this is a well-known brand, use your knowledge of their brand guidelines, voice, and style to inform your answers.\n\nIMPORTANT: When the user says "we", "our", or "us", they are referring to ${brandName}. Interpret all questions accordingly.`);
    if (industry?.trim()) contextSections.push(`## Industry/Sector\nThe content operates within the ${industry} sector.`);

    const trainingSection = buildTrainingSection(trainingConfig);
    if (trainingSection) contextSections.push(trainingSection);

    const brandContext = brandName?.trim() ? ` for ${brandName}` : '';
    const systemPrompt = `You are Tomas, an AI-powered content governance assistant${brandContext}. You answer questions about content style, formatting, and brand voice. You do not generate, draft, or write copy.

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
- If not covered, say so clearly and explain any general best-practice principle that may apply
- Focus on how words, terms, and content are written, formatted, capitalised, and styled — not on how to create or draft entire documents
- When asked about terms like "T&Cs", advise on how to write, abbreviate, or style the term in content — do not explain how to draft a Terms and Conditions document
- Stay within the scope of content style, UX writing, and editorial guidance

Content generation boundary (STRICT):
- You do NOT generate, draft, write, or compose content, copy, or text on behalf of the user.
- If asked to "write", "draft", "create", or "generate" content, decline clearly. Explain that your role is to answer questions about style rules and provide guidance — not to produce copy.
- The ONLY form of content you produce is short illustrative examples (good vs bad) to explain a rule. These must be clearly labelled as examples, not delivered as usable copy.
- Acceptable: "Here's how that would look following the style guide: ✅ 'Deposit now' / ❌ 'Make a deposit today!'"
- Not acceptable: Writing a full paragraph, tagline, email, headline, CTA set, or any draft the user could copy-paste as finished work.
- If the user asks you to rewrite their text, redirect: explain what rules apply and show a short example of how to apply them — do not rewrite the full text for them.

Response discipline (STRICT):
- Each response must address ONLY the single intent the user asked about. Never combine multiple intents.
- Once intent is resolved (via clarification or inference), do NOT reopen interpretation. Never say "If you meant…", "If you're asking about…", or "Alternatively…".
- Only include information directly required to answer the question. Do NOT add adjacent topics, related features, or general background unless essential.
- Only reference or quote the style guide when the user explicitly asks about it OR the resolved intent requires it. Do NOT inject style guide context into unrelated questions.
- Match answer depth to question complexity: simple question → short answer; complex question → structured answer. Avoid over-explaining, speculation, and unnecessary examples.
- Do NOT introduce grammar checks, style guide explanations, or tool capabilities unless explicitly requested.
- End cleanly. Do not add unsolicited next steps — exploration mode handles that separately.

IMPORTANT — Structured interactive options:
You have TWO modes for presenting interactive options. Use JSON marker blocks — the UI will render them as clickable buttons.

OPTION TEXT RULES (apply to both modes):
- Maximum 3–6 words per option. Never full sentences.
- Always verb-led: "Show examples", "Rewrite as UI copy", "Use plain language"
- Never descriptive labels: "Clarity and consistency" is BAD. "Improve clarity" is GOOD.
- No explanations inside options. Keep explanations in your main response text.

MODE 1: CLARIFICATION (before answering)
Trigger ONLY when you cannot confidently interpret the user's question (ambiguous, multiple possible meanings).
- Analyse the actual words in the user's query. Identify key terms and infer plausible meanings.
- Generate 2–4 options where each represents a different interpretation of what the user likely meant.
- Write a short prompt (1 sentence max), then append:
[CLARIFICATION]{"options":["Check spelling rules","Review tone guidance","Fix capitalisation"]}[/CLARIFICATION]
- Do NOT write long paragraphs before the marker.

CRITICAL — option content rules for clarification:
- Every option MUST be derived from the user's actual words, not generic help actions.
- NEVER use these as options: "Rephrase your question", "Provide more detail", "Explain unfamiliar terms", "Ask about the style guide", "Clarify your question", "Provide context". These are internal fallback behaviours, NOT user-facing choices.
- Each option must be a plausible interpretation of the user's intent based on the words they actually used.
- Even for garbled input, attempt 2–3 meaningful guesses from the words present.
- Example: user says "how alligator style guide unibet?" →
  Good: ["Explain 'alligator' term", "Rewrite in Unibet style", "Fix this sentence"]
  Bad: ["Provide more detail", "Rephrase your question", "Explain unfamiliar terms"]

MODE 2: EXPLORATION (after answering)
Trigger ONLY when your answer is complete AND there are genuinely useful, distinct next steps.
- Write your full answer first, then append:
[EXPLORATION]{"options":["Show examples","Rewrite as UI copy","Apply to product"]}[/EXPLORATION]
- 2–4 options. Each verb-led, specific, leading to different output.
- Do NOT activate if the question is fully answered with no useful follow-up.

RULES:
- NEVER use both modes in the same response.
- NEVER turn answer content (lists, headings) into options.
- If the question is clear, just answer it — no markers needed.`;

    console.log('Processing style guide question');

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];
    if (conversationHistory?.length) {
      const recent = conversationHistory.slice(-10);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
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

    // Gap detection: only log genuinely missing topics, only once per topic
    // Runs asynchronously — never blocks the main response
    const hasStyleGuide = !!styleGuideText?.trim() || !!supplementalRulesText;
    if (hasStyleGuide) {
      (async () => {
        try {
          // Step 1: Skip conversational noise
          const trimmedQ = question.trim();
          if (trimmedQ.length < 15) { console.log('Gap skip: too short'); return; }
          const noisePatterns = /^(thanks|thank you|cheers|ok|okay|yes|no|got it|hello|hi|hey|sure|great|cool|good|nice|yep|nope|ta|brilliant|perfect|lovely|fine|noted)\b/i;
          if (noisePatterns.test(trimmedQ)) { console.log('Gap skip: conversational noise'); return; }

          // Step 2: Answer-based grounding — check if Tomas cited documented rules
          const groundingResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                {
                  role: 'system',
                  content: `You determine whether an AI assistant's answer was grounded in documented style guide rules or was purely improvised expert advice.

IMPORTANT: If the assistant DECLINED to generate content and instead redirected the user to style rules or general guidance, that is NOT grounded. A refusal or redirect does not count as answering the user's question from documented sources. Evaluate whether the user's underlying topic is actually covered by specific, documented rules.

An answer is GROUNDED if it:
- Cites, quotes, or references a specific rule, section, or guideline that directly addresses the user's topic
- Clearly paraphrases or applies a documented rule to the user's specific question
- References a glossary term, configured setting, or supplemental rule relevant to the topic asked about

An answer is NOT GROUNDED if it:
- Declines to generate content and redirects to general style principles
- Gives general expert advice without referencing a documented source specific to the user's topic
- Uses phrases like "I'd recommend", "best practice is", "generally" without tying it to a specific documented rule
- Improvises an answer because no documented guidance exists
- References style guide rules only to explain why it cannot help, not to answer the user's actual question

Respond with ONLY valid JSON: {"grounded": true} or {"grounded": false, "signal": "brief reason why this wasn't covered"}`,
                },
                {
                  role: 'user',
                  content: `User question: ${question}\n\nAssistant answer: ${answer.slice(0, 2000)}`,
                },
              ],
              max_tokens: 100,
            }),
          });

          if (!groundingResponse.ok) { console.error('Grounding classifier failed:', groundingResponse.status); return; }

          const groundingData = await groundingResponse.json();
          let groundingText = groundingData.choices?.[0]?.message?.content || '';
          groundingText = groundingText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

          let classification;
          try { classification = JSON.parse(groundingText); } catch { console.error('Failed to parse grounding classification'); return; }

          if (classification.grounded) { console.log('Gap skip: answer is grounded in documented rules'); return; }

          // Step 3: Semantic deduplication — check existing gaps and promoted rules
          const normalizedQuery = trimmedQ.toLowerCase().replace(/\s+/g, ' ');

          // Fetch active gaps and promoted rule queries
          const [gapsResult, rulesResult] = await Promise.all([
            supabase.from('style_guide_gaps').select('user_query').eq('status', 'new').order('created_at', { ascending: false }).limit(50),
            supabase.from('supplemental_rules').select('source_query').not('source_query', 'is', null).limit(50),
          ]);

          const existingQueries: string[] = [];
          if (gapsResult.data) existingQueries.push(...gapsResult.data.map((g: any) => g.user_query));
          if (rulesResult.data) existingQueries.push(...rulesResult.data.filter((r: any) => r.source_query).map((r: any) => r.source_query));

          // Quick exact-match check first
          const exactMatch = existingQueries.some(eq => eq.toLowerCase().replace(/\s+/g, ' ').trim() === normalizedQuery);
          if (exactMatch) { console.log('Gap skip: exact duplicate found'); return; }

          // Semantic dedup via lightweight AI call
          if (existingQueries.length > 0) {
            const existingList = existingQueries.slice(0, 50).map((q, i) => `${i + 1}. ${q}`).join('\n');
            const dedupResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash-lite',
                messages: [
                  {
                    role: 'system',
                    content: 'You check whether a new question covers the same topic or intent as any existing entry. Reply with ONLY "YES" or "NO". YES means the topic is already covered by at least one existing entry. NO means it is a genuinely new topic.',
                  },
                  {
                    role: 'user',
                    content: `New question: "${question}"\n\nExisting entries:\n${existingList}`,
                  },
                ],
                max_tokens: 5,
              }),
            });

            if (dedupResponse.ok) {
              const dedupData = await dedupResponse.json();
              const dedupAnswer = (dedupData.choices?.[0]?.message?.content || '').trim().toUpperCase();
              if (dedupAnswer.startsWith('YES')) { console.log('Gap skip: semantic duplicate found'); return; }
            }
          }

          // Step 4: Insert the gap — genuinely new, uncovered topic
          await supabase.from('style_guide_gaps').insert({
            user_query: question.slice(0, 2000),
            tomas_response: answer.slice(0, 5000),
            confidence_signal: classification.signal || 'Not covered by documented rules',
            status: 'new',
          });
          console.log('Gap logged (new topic):', question.slice(0, 80));

        } catch (e) {
          console.error('Gap detection error:', e);
        }
      })();
    }

    return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in style-guide-chat:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
