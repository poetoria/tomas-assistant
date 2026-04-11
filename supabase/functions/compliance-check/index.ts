import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 20;
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

interface ComplianceRequest {
  content: string;
  globalInstructions: string;
  glossary: Array<{ sourceTerm: string; targetTerm: string; notes?: string }>;
  styleGuideText: string;
  brandName: string;
  industry: string;
  trainingConfig?: TrainingConfig;
  contentType?: string;
}

interface ComplianceIssue {
  id: string;
  originalText: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
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
    financial: 'Financial services (FCA-style) — flag misleading financial claims. Do NOT add disclaimers unless a mandatory content rule explicitly requires them.',
    healthcare: 'Healthcare — avoid medical claims, use approved terminology',
    gambling: 'Gambling / safer gambling — flag language that encourages excessive play or makes misleading claims. Do NOT add generic safer gambling disclaimers unless a mandatory content rule explicitly requires them.',
  };
  if (tc.regulatoryMode && tc.regulatoryMode !== 'general') parts.push(`- Regulatory mode: ${regMap[tc.regulatoryMode] || tc.regulatoryMode}`);

  const spellingMap: Record<string, string> = { british: 'British English', american: 'American English', australian: 'Australian English' };
  if (tc.spellingConvention) parts.push(`- Spelling: ${spellingMap[tc.spellingConvention] || tc.spellingConvention}`);
  if (tc.contentTypeFocus?.length) parts.push(`- Content types: ${tc.contentTypeFocus.join(', ')}`);

  if (tc.brandWeAre?.trim()) parts.push(`- Brand personality — we ARE: ${tc.brandWeAre}`);
  if (tc.brandWeAreNot?.trim()) parts.push(`- Brand personality — we are NOT: ${tc.brandWeAreNot}`);

  if (tc.bannedWords?.trim()) parts.push(`- Never use these words/phrases:\n${tc.bannedWords.split('\n').map(w => `  • ${w.trim()}`).filter(w => w !== '  • ').join('\n')}`);
  if (tc.preferredAlternatives?.trim()) parts.push(`- Preferred alternatives:\n${tc.preferredAlternatives.split('\n').map(a => `  • ${a.trim()}`).filter(a => a !== '  • ').join('\n')}`);
  if (tc.prohibitedPatterns?.trim()) parts.push(`- Prohibited patterns (flag these as issues):\n${tc.prohibitedPatterns.split('\n').map(p => `  • ${p.trim()}`).filter(p => p !== '  • ').join('\n')}`);
  if (tc.mandatoryRules?.trim()) parts.push(`- Mandatory content rules (content MUST include these where applicable):\n${tc.mandatoryRules.split('\n').map(r => `  • ${r.trim()}`).filter(r => r !== '  • ').join('\n')}`);
  if (tc.decisionRules?.trim()) parts.push(`- Decision rules:\n${tc.decisionRules.split('\n').map(r => `  • ${r.trim()}`).filter(r => r !== '  • ').join('\n')}`);

  return parts.length > 0 ? `## Training & guardrails\n${parts.join('\n')}` : '';
}

function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

// Build the system prompt — used identically for both passes
function buildSystemPrompt(contextSections: string[], brandName?: string): string {
  const brandContext = brandName?.trim() ? ` for ${brandName}` : '';
  return `You are Tomas, an AI-powered content governance assistant${brandContext}. Check content against style guide rules and find issues.

${contextSections.length > 0 ? '# Style Guide Context\n' + contextSections.join('\n\n') : '# No style guide provided — use plain language best practices'}

# Rule priority (highest to lowest)
1. Regulatory / legal requirements — always enforced, always highest severity
2. Prohibited patterns — always flagged as high severity
3. Mandatory content rules — flag if missing, high severity
4. Terminology / glossary — use required terms, medium severity
5. Clarity — fix ambiguity only where meaning is genuinely unclear, low-medium severity
6. Style / tone — flag ONLY if it directly contradicts a defined brand rule, low severity

# Your task
1. Find problems in the content
2. For each problem:
   - Quote the exact text that needs changing
   - Cite which specific rule, glossary entry, prohibited pattern, or standard is being violated
   - Explain the issue in one short sentence referencing the rule
   - Set severity based on the rule priority above
   - Give the corrected text
3. Write the content with ONLY the identified issues fixed. Keep everything else unchanged. Do not restructure, expand, or add content beyond what is needed to resolve flagged issues. (rewrittenContent)
4. Write a one-sentence summary

# Strict checking rules
- Every issue MUST cite which specific rule, glossary entry, or standard it violates. Issues without a rule citation are not valid.
- Do NOT flag stylistic preferences. Only flag actual rule violations.
- Do NOT suggest alternative phrasings for text that is already compliant.
- Do NOT flag text that already satisfies the rules — if content is compliant, return zero issues.
- Your rewrittenContent MUST comply with all the same rules you are checking against. Do not introduce new violations in the rewrite.
- If two rules conflict, apply the higher-priority rule from the priority list above.
- Be deterministic: apply rules mechanically and consistently. The same content under the same rules must always produce the same result.

IMPORTANT compliance checks:
- Check all prohibited patterns and flag them as high severity
- Check mandatory content rules — if required elements are missing, flag as high severity
- Apply decision rules where relevant
- Higher risk levels require stricter language checks — flag any ambiguity or exaggeration

# Writing style
- Never refer to yourself as "AI" or "artificial intelligence" — you are Tomas
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
      "issue": "short explanation citing the specific rule violated",
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
- Prohibited patterns
- Missing mandatory elements
- Genuinely unclear writing (not style preferences)
- Grammar and punctuation
- Risk and regulatory compliance`;
}

// Model settings — identical for all passes
const MODEL_SETTINGS = {
  model: 'google/gemini-2.5-flash',
  temperature: 0,
  seed: 42,
  max_tokens: 4000,
};

// Call the AI with given content and system prompt
async function callAI(systemPrompt: string, content: string, apiKey: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...MODEL_SETTINGS,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please check this content for compliance:\n\n${content}` }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    if (response.status === 429) throw new Error('RATE_LIMIT');
    if (response.status === 402) throw new Error('USAGE_LIMIT');
    throw new Error('AI_ERROR');
  }

  const data = await response.json();
  const resultText = data.choices?.[0]?.message?.content;
  if (!resultText) throw new Error('NO_RESPONSE');
  return resultText;
}

// Parse AI response text into structured result
function parseAIResponse(resultText: string): { issues: ComplianceIssue[]; rewrittenContent: string; summary: string } | null {
  const cleaned = resultText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let result: any;
  try {
    result = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*"issues"[\s\S]*\}/);
    if (jsonMatch) {
      try { result = JSON.parse(jsonMatch[0]); } catch {}
    }
    if (!result) {
      const issuesMatch = cleaned.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (issuesMatch) {
        try {
          const issues = JSON.parse(issuesMatch[0]);
          result = { issues, rewrittenContent: '', summary: `Found ${issues.length} issue(s).` };
        } catch {}
      }
    }
  }

  if (!result) return null;

  const issues: ComplianceIssue[] = (result.issues || []).map((issue: any, index: number) => ({
    id: issue.id || `issue-${index + 1}`,
    originalText: issue.originalText || '',
    issue: issue.issue || '',
    severity: ['high', 'medium', 'low'].includes(issue.severity) ? issue.severity : 'medium',
    suggestion: issue.suggestion || '',
  }));

  return {
    issues,
    rewrittenContent: result.rewrittenContent || '',
    summary: result.summary || `Found ${issues.length} issue(s) in the content.`,
  };
}

// Deduplicate issues: if two target the same originalText, keep the higher-severity one
function deduplicateIssues(issues: ComplianceIssue[]): ComplianceIssue[] {
  const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const seen = new Map<string, ComplianceIssue>();

  for (const issue of issues) {
    const key = issue.originalText.trim().toLowerCase();
    const existing = seen.get(key);
    if (!existing || (severityRank[issue.severity] || 0) > (severityRank[existing.severity] || 0)) {
      seen.set(key, issue);
    }
  }

  return Array.from(seen.values());
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { content, globalInstructions, glossary, styleGuideText, brandName, industry, trainingConfig, contentType }: ComplianceRequest = await req.json();

    const MAX_CONTENT_LENGTH = 5000;
    const MAX_INSTRUCTIONS_LENGTH = 5000;
    const MAX_STYLE_GUIDE_LENGTH = 200000;

    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return new Response(JSON.stringify({ error: `Content too long. Maximum ${MAX_CONTENT_LENGTH.toLocaleString()} characters.` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (globalInstructions && globalInstructions.length > MAX_INSTRUCTIONS_LENGTH) {
      return new Response(JSON.stringify({ error: 'Instructions too long.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (styleGuideText && styleGuideText.length > MAX_STYLE_GUIDE_LENGTH) {
      return new Response(JSON.stringify({ error: 'Style guide too long.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch supplemental rules
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

    // Build context sections (shared between passes)
    const contextSections: string[] = [];
    if (globalInstructions?.trim()) contextSections.push(`## Global Instructions/Rules\n${globalInstructions}`);
    if (glossary?.length > 0) {
      contextSections.push(`## Required Terminology\n${glossary.map(g => `- "${g.sourceTerm}" should be "${g.targetTerm}"${g.notes ? ` (${g.notes})` : ''}`).join('\n')}`);
    }
    if (styleGuideText?.trim()) contextSections.push(`## Style Guide Rules\n${styleGuideText}`);
    if (supplementalRulesText) contextSections.push(`## Supplemental Rules (working rules added by admins)\n${supplementalRulesText}`);
    if (brandName?.trim()) contextSections.push(`## Brand Context\nThis content is for ${brandName}.\n\nIMPORTANT: When the user says "we", "our", or "us", they are referring to ${brandName}.`);
    if (industry?.trim()) contextSections.push(`## Industry Context\nThe content is for the ${industry} sector.`);

    const trainingSection = buildTrainingSection(trainingConfig);
    if (trainingSection) contextSections.push(trainingSection);
    if (contentType?.trim() && contentType !== 'Other') contextSections.push(`## Content Type\nThe user has classified this content as: ${contentType}. Apply compliance rules most relevant to this content type.`);

    const systemPrompt = buildSystemPrompt(contextSections, brandName);

    // === PASS 1: Check original content ===
    console.log('Pass 1: Checking original content');
    let pass1Text: string;
    try {
      pass1Text = await callAI(systemPrompt, content, LOVABLE_API_KEY);
    } catch (e: any) {
      if (e.message === 'RATE_LIMIT') return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (e.message === 'USAGE_LIMIT') return new Response(JSON.stringify({ error: 'Usage limit reached.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (e.message === 'NO_RESPONSE') return new Response(JSON.stringify({ error: 'No response generated' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'Failed to check compliance' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const pass1Result = parseAIResponse(pass1Text);
    if (!pass1Result) {
      return new Response(JSON.stringify({ error: 'Failed to parse compliance results. Please try again.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Deduplicate pass 1 issues
    pass1Result.issues = deduplicateIssues(pass1Result.issues);

    // If no issues found, return immediately — content is compliant
    if (pass1Result.issues.length === 0) {
      console.log('Pass 1: No issues found, content is compliant');
      return new Response(
        JSON.stringify({
          issues: [],
          rewrittenContent: content,
          summary: pass1Result.summary || 'No issues found. Content is compliant.',
          validated: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === PASS 2: Validate the rewrite ===
    console.log('Pass 2: Validating rewritten content');
    let validated = true;
    let validationNote: string | undefined;
    let finalRewrite = pass1Result.rewrittenContent || content;

    try {
      const pass2Text = await callAI(systemPrompt, finalRewrite, LOVABLE_API_KEY);
      const pass2Result = parseAIResponse(pass2Text);

      if (pass2Result && pass2Result.issues.length > 0) {
        console.log(`Pass 2: Found ${pass2Result.issues.length} issues in the rewrite, applying revision`);
        // The rewrite itself has issues — use pass 2's revised version
        if (pass2Result.rewrittenContent?.trim()) {
          finalRewrite = pass2Result.rewrittenContent;
        }
        // Check if pass 2's rewrite is better (fewer issues) — hard stop here, no pass 3
        validated = false;
        validationNote = `${pass2Result.issues.length} issue(s) were found in the initial rewrite and have been corrected. Some suggestions may not be fully reconciled.`;
      } else {
        console.log('Pass 2: Rewrite passed validation');
        validated = true;
      }
    } catch (e) {
      // If pass 2 fails, still return pass 1 results with a note
      console.error('Pass 2 validation failed:', e);
      validated = false;
      validationNote = 'Suggestion validation could not be completed. Please review suggestions carefully.';
    }

    console.log('Compliance check completed, found', pass1Result.issues.length, 'issues, validated:', validated);

    return new Response(
      JSON.stringify({
        issues: pass1Result.issues,
        rewrittenContent: finalRewrite,
        summary: pass1Result.summary,
        validated,
        validationNote,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in compliance-check:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
