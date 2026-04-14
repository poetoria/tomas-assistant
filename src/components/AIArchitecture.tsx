// UPDATE STRATEGY
// v1: Static curated content. Acceptable for launch.
// Ownership: This tab is manually maintained. Any change to edge function
// prompts or filtering logic should trigger a review of this tab.
// Long-term: Migrate to a shared ai-architecture.json config file that
// serves as single source of truth for both this documentation view
// and the prompt assembly in edge functions.

import { useState } from 'react';
import { Copy, Download, Check, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

interface PromptCard {
  name: string;
  purpose: string;
  trigger: string;
  inputs: string[];
  expectedOutput: string;
  constraints: string[];
  dependencies: string[];
  flowPosition: 'pre-response' | 'generation' | 'post-response' | 'always active';
  representativePromptLogic: string;
}

interface Section {
  title: string;
  description: string;
  cards: PromptCard[];
}

const FLOW_STEPS = [
  { step: 1, title: 'User input received', description: 'The user selects a mode — Ask Tomas or Compliance Check — and submits a query or content. The input is bundled with the active style guide, glossary, and training configuration.', section: 'Mode Logic' },
  { step: 2, title: 'Ambiguity check', description: 'Ask Tomas only. The system prompt instructs Tomas to detect vague or multi-intent queries and ask a clarifying question before answering.', section: 'Interaction Logic' },
  { step: 3, title: 'Context and rule injection', description: 'The full system prompt is assembled: style guide content, glossary, training config, mandatory rules, banned words, decision rules, and supplemental rules are injected into the prompt.', section: 'Guardrails' },
  { step: 4, title: 'Response generation', description: 'The constrained prompt is sent to the AI model. Ask Tomas generates a single answer. Compliance Check runs a two-pass process: detect all issues, then validate and remove false positives.', section: 'Decision Logic' },
  { step: 5, title: 'Evaluation and filtering', description: 'Compliance Check only. The raw response is parsed as JSON, duplicate issues are removed, and ungrounded suggestions are filtered out before results are returned.', section: 'Evaluation and Filtering' },
  { step: 6, title: 'Gap detection', description: 'Ask Tomas only. An asynchronous post-response process checks whether the query revealed a topic not covered by existing guidance, and logs it if genuinely new.', section: 'Gap Detection Loop' },
];

const SECTIONS: Section[] = [
  {
    title: 'Global System Instructions',
    description: 'The always-on rules that shape Tomas\u2019s baseline behaviour.',
    cards: [
      {
        name: 'Tomas Identity and Expertise',
        purpose: 'Defines who Tomas is \u2014 a senior compliance and editorial specialist',
        trigger: 'Every request',
        inputs: ['None (hardcoded identity)'],
        expectedOutput: 'Consistent persona across all interactions',
        constraints: ['British English only', 'No speculative advice', 'No personal opinions'],
        dependencies: [],
        flowPosition: 'always active',
        representativePromptLogic: 'You are Tomas, a senior compliance and editorial specialist. You write in British English. You do not guess, speculate, or improvise. Every answer must be grounded in configured rules or standard language conventions.',
      },
      {
        name: 'Response Discipline',
        purpose: 'Controls how Tomas structures and scopes answers',
        trigger: 'Every response generation',
        inputs: ['User query', 'Detected intent'],
        expectedOutput: 'Focused, single-intent response matched to query complexity',
        constraints: ['One question at a time', 'Match response depth to complexity', 'Do not over-answer'],
        dependencies: ['Tomas Identity and Expertise'],
        flowPosition: 'generation',
        representativePromptLogic: 'Answer only the question asked. Do not introduce related topics. Match the depth of your response to the complexity of the question. Simple questions get short answers.',
      },
    ],
  },
  {
    title: 'Mode Logic',
    description: 'How Tomas operates in each mode — chat assistance and compliance checking.',
    cards: [
      {
        name: 'Ask Tomas (Chat)',
        purpose: 'Powers the conversational assistant mode',
        trigger: 'User submits a question in the Ask Tomas tab',
        inputs: ['User query', 'Conversation history', 'Full style guide content', 'Glossary', 'Training config', 'Supplemental rules'],
        expectedOutput: 'A grounded answer referencing configured rules where applicable',
        constraints: ['Must cite rules when they exist', 'General expert advice only when no rule covers the topic'],
        dependencies: ['Tomas Identity', 'Response Discipline', 'Context and Rule Injection'],
        flowPosition: 'generation',
        representativePromptLogic: 'Use the style guide, glossary, and training configuration to answer. If the guide covers the topic, cite the relevant rule. If not, provide expert guidance and clearly indicate it is not from a configured rule.',
      },
      {
        name: 'Compliance Check orchestration',
        purpose: 'Orchestrates the two-pass compliance checking pipeline',
        trigger: 'User submits text in the Compliance Check tab',
        inputs: ['User text', 'Style guide', 'Glossary', 'Training config', 'Mandatory rules', 'Regulatory settings', 'Risk level'],
        expectedOutput: 'Structured JSON array of issues with severity, rule citations, and suggested fixes',
        constraints: ['Pass 1 detects all issues', 'Pass 2 validates and removes false positives', 'Every issue must cite a baseline rule or configured rule'],
        dependencies: ['Tomas Identity', 'Guardrails', 'Decision Logic (Priority Hierarchy)'],
        flowPosition: 'generation',
        representativePromptLogic: 'Pass 1: Scan the text and flag every issue. Pass 2: Review each flagged issue. Remove any that cannot be traced to a configured rule or baseline language convention. Every surviving issue must cite its rule source.',
      },
    ],
  },
  {
    title: 'Guardrails',
    description: 'Hard constraints that override all other logic.',
    cards: [
      {
        name: 'Banned Words',
        purpose: 'Flags any use of explicitly prohibited terms',
        trigger: 'During compliance check, when banned words list is configured',
        inputs: ['User text', 'Banned words list from training config'],
        expectedOutput: 'High-severity issue for each banned word found',
        constraints: ['Always high severity', 'No exceptions', 'Exact match and variant detection'],
        dependencies: ['Training config (banned words list)'],
        flowPosition: 'generation',
        representativePromptLogic: 'If any of the following banned words appear in the text, flag each as a HIGH severity issue. No exceptions. Banned words: [injected from config].',
      },
      {
        name: 'Prohibited Patterns',
        purpose: 'Detects structural or formatting patterns that are never allowed',
        trigger: 'During compliance check, when prohibited patterns are configured',
        inputs: ['User text', 'Prohibited patterns from training config'],
        expectedOutput: 'High-severity issue for each pattern match',
        constraints: ['Always high severity', 'Pattern-level matching'],
        dependencies: ['Training config (prohibited patterns list)'],
        flowPosition: 'generation',
        representativePromptLogic: 'Flag any text that matches a prohibited pattern. These are always high severity regardless of context.',
      },
      {
        name: 'Mandatory Content Rules',
        purpose: 'Ensures required elements are present in checked text',
        trigger: 'During compliance check, when mandatory rules are configured',
        inputs: ['User text', 'Mandatory rules from training config'],
        expectedOutput: 'Issue flagged if required content is missing',
        constraints: ['Flag absence, not just incorrect usage'],
        dependencies: ['Training config (mandatory rules list)'],
        flowPosition: 'generation',
        representativePromptLogic: 'Check that the following mandatory elements are present. If any are missing, flag as an issue and cite the specific mandatory rule.',
      },
    ],
  },
  {
    title: 'Decision Logic',
    description: 'The priority hierarchy and conditional rules that govern output.',
    cards: [
      {
        name: 'Rule Priority Hierarchy',
        purpose: 'Defines which rules take precedence when conflicts arise',
        trigger: 'During compliance check issue ranking',
        inputs: ['All applicable rules for a given text segment'],
        expectedOutput: 'Issues ranked by priority level',
        constraints: ['Six-level hierarchy, strictly enforced'],
        dependencies: ['All guardrail and configured rule cards'],
        flowPosition: 'generation',
        representativePromptLogic: 'Priority order: 1. Regulatory/legal requirements, 2. Mandatory content rules, 3. Banned words and prohibited patterns, 4. Glossary and terminology, 5. Style guide rules, 6. Style and tone preferences.',
      },
      {
        name: 'Risk Level Escalation',
        purpose: 'Adjusts checking strictness based on configured risk level',
        trigger: 'During compliance check, based on risk level setting',
        inputs: ['Risk level (low/medium/high)', 'Detected issues'],
        expectedOutput: 'Adjusted severity thresholds',
        constraints: ['Higher risk = stricter checking', 'Lower thresholds for flagging'],
        dependencies: ['Training config (risk level)'],
        flowPosition: 'generation',
        representativePromptLogic: 'At HIGH risk level, flag even minor deviations. At LOW risk level, only flag clear violations. MEDIUM is the default balanced mode.',
      },
      {
        name: 'Decision Rules (If/Then)',
        purpose: 'Applies conditional logic defined in training config',
        trigger: 'During compliance check, when decision rules are configured',
        inputs: ['User text', 'Decision rules from training config'],
        expectedOutput: 'Contextual issues based on conditional matches',
        constraints: ['Only fire when conditions are met', 'Do not infer beyond configured rules'],
        dependencies: ['Training config (decision rules)'],
        flowPosition: 'generation',
        representativePromptLogic: 'Apply the following conditional rules. Each has a condition and an action. Only flag when the condition is clearly met in the text.',
      },
    ],
  },
  {
    title: 'Interaction Logic',
    description: 'How Tomas handles ambiguity and guides users after responding.',
    cards: [
      {
        name: 'Pre-response clarification (ambiguity handling)',
        purpose: 'Detects ambiguous or multi-intent queries before generating a response',
        trigger: 'When the user\u2019s question is unclear, vague, or contains multiple intents',
        inputs: ['User query', 'Style guide context'],
        expectedOutput: 'Clarifying question presented to the user before answering',
        constraints: ['Only trigger when genuine ambiguity exists', 'Do not over-clarify simple questions'],
        dependencies: ['Tomas Identity', 'Response Discipline'],
        flowPosition: 'pre-response',
        representativePromptLogic: 'Before answering, check if the question is ambiguous or contains multiple intents. If so, ask one focused clarifying question. If the question is clear, proceed directly to answering.',
      },
      {
        name: 'Post-response guidance (follow-up options)',
        purpose: 'Provides relevant follow-up options after answering',
        trigger: 'After every Ask Tomas response',
        inputs: ['The question asked', 'The answer given', 'Style guide context'],
        expectedOutput: '2\u20133 relevant follow-up options, verb-led',
        constraints: ['Options must be contextually relevant', 'Verb-led format', 'No generic suggestions'],
        dependencies: ['Ask Tomas (Chat)', 'Response Discipline'],
        flowPosition: 'post-response',
        representativePromptLogic: 'After answering, suggest 2\u20133 follow-up questions the user might ask next. Each should be verb-led, specific to the topic just discussed, and grounded in the style guide where possible.',
      },
    ],
  },
  {
    title: 'Gap Detection Loop',
    description: 'The logic that identifies missing guidance and feeds reviewed rules back into the system.',
    cards: [
      {
        name: 'Noise Filter',
        purpose: 'Skips conversational or trivial queries before gap classification',
        trigger: 'After every Ask Tomas response, before grounding check',
        inputs: ['User query text'],
        expectedOutput: 'Skip signal for non-substantive queries',
        constraints: ['Skip if query < 15 characters', 'Skip if matches conversational patterns (thanks, ok, hello, yes, no, got it, cheers)'],
        dependencies: [],
        flowPosition: 'post-response',
        representativePromptLogic: 'If the user query is fewer than 15 characters or matches common conversational phrases, skip gap detection entirely.',
      },
      {
        name: 'Answer-Based Grounding Check',
        purpose: 'Determines if the question was already covered by existing guidance',
        trigger: 'After noise filter passes, for each substantive query',
        inputs: ['User query', 'Tomas\u2019s full answer'],
        expectedOutput: 'Grounded (skip) or Ungrounded (candidate for gap logging)',
        constraints: ['Treats both direct citations and clear paraphrases as grounded', 'Does not require literal quoting'],
        dependencies: ['Ask Tomas (Chat)'],
        flowPosition: 'post-response',
        representativePromptLogic: 'Examine the assistant\u2019s answer. Does it reference, cite, paraphrase, or clearly draw on a documented rule, style guide section, glossary term, or configured setting? If yes \u2192 grounded, do not log. If the answer is purely general expert advice with no reference to documented sources \u2192 not grounded.',
      },
      {
        name: 'Semantic Deduplication',
        purpose: 'Prevents logging the same underlying topic more than once',
        trigger: 'After grounding check classifies a query as ungrounded',
        inputs: ['New query', 'Existing active gaps (status = new, limit 50)', 'Promoted rule source queries'],
        expectedOutput: 'Duplicate (skip) or New topic (proceed to insert)',
        constraints: ['Checks topic and intent match, not just exact wording', 'Limited to active unresolved gaps and promoted rules'],
        dependencies: ['Gap database', 'Supplemental rules table'],
        flowPosition: 'post-response',
        representativePromptLogic: 'Compare the new question against existing active gaps and promoted rules. Does any existing entry already cover the same topic or intent, even if worded differently? If yes \u2192 skip. If no \u2192 log as new gap.',
      },
      {
        name: 'Gap Insertion',
        purpose: 'Logs a genuinely new content gap for review',
        trigger: 'After deduplication confirms the topic is new',
        inputs: ['User query', 'Classification result'],
        expectedOutput: 'New row in content gaps table with status new',
        constraints: ['Only reaches this point if noise filter, grounding check, and dedup all pass'],
        dependencies: ['Noise Filter', 'Answer-Based Grounding', 'Semantic Deduplication'],
        flowPosition: 'post-response',
        representativePromptLogic: 'Insert the query into the content gaps table. This gap will be visible to administrators for review and potential promotion to a supplemental rule.',
      },
    ],
  },
  {
    title: 'Evaluation and Filtering',
    description: 'How outputs are validated before being returned.',
    cards: [
      {
        name: 'JSON Parse and Repair',
        purpose: 'Ensures compliance check output is valid structured JSON',
        trigger: 'After compliance check response generation',
        inputs: ['Raw AI response text'],
        expectedOutput: 'Valid JSON array of issues',
        constraints: ['Attempts repair if initial parse fails', 'Uses AI-assisted repair as fallback'],
        dependencies: ['Compliance Check orchestration'],
        flowPosition: 'post-response',
        representativePromptLogic: 'Parse the response as JSON. If parsing fails, attempt to extract and repair the JSON structure. If repair fails, use a secondary AI call to reconstruct valid JSON from the raw text.',
      },
      {
        name: 'Issue Deduplication',
        purpose: 'Removes duplicate issues from compliance check results',
        trigger: 'After JSON parsing succeeds',
        inputs: ['Array of parsed issues'],
        expectedOutput: 'Deduplicated array',
        constraints: ['Composite key based on issue text, location, and rule citation'],
        dependencies: ['JSON Parse and Repair'],
        flowPosition: 'post-response',
        representativePromptLogic: 'Remove duplicate issues using a composite key of the issue description, affected text, and cited rule. Keep the first occurrence.',
      },
      {
        name: 'Anti-Boilerplate Filter',
        purpose: 'Removes issues that suggest adding content not traceable to configured rules',
        trigger: 'After deduplication',
        inputs: ['Deduplicated issues array'],
        expectedOutput: 'Filtered array with ungrounded suggestions removed',
        constraints: ['Checks if suggested new content can be traced to a specific rule', 'Allows baseline language rule citations'],
        dependencies: ['Issue Deduplication', 'Guardrails'],
        flowPosition: 'post-response',
        representativePromptLogic: 'If an issue suggests adding new content (disclaimer, warning, sentence), verify the suggestion is traceable to a configured rule or baseline language convention. Remove suggestions that cannot be traced to any rule source.',
      },
    ],
  },
];

const FLOW_BADGE_STYLES: Record<string, string> = {
  'always active': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  'pre-response': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'generation': 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
  'post-response': 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
};

function PromptCardView({ card }: { card: PromptCard }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(card.representativePromptLogic);
    setCopied(true);
    toast({ title: 'Copied', description: 'Representative prompt logic copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={FLOW_BADGE_STYLES[card.flowPosition]}>
          {card.flowPosition}
        </Badge>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
        <span className="text-muted-foreground font-medium">Purpose</span>
        <span>{card.purpose}</span>

        <span className="text-muted-foreground font-medium">Trigger</span>
        <span>{card.trigger}</span>

        <span className="text-muted-foreground font-medium">Inputs</span>
        <span>{card.inputs.join(', ')}</span>

        <span className="text-muted-foreground font-medium">Expected output</span>
        <span>{card.expectedOutput}</span>

        <span className="text-muted-foreground font-medium">Constraints</span>
        <ul className="list-disc list-inside space-y-0.5">
          {card.constraints.map((c, i) => <li key={i}>{c}</li>)}
        </ul>

        {card.dependencies.length > 0 && (
          <>
            <span className="text-muted-foreground font-medium">Dependencies</span>
            <span>{card.dependencies.join(', ')}</span>
          </>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-muted-foreground font-medium">Representative prompt logic</span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
            {copied ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
          </Button>
        </div>
        <div className="bg-muted/50 border rounded-lg p-3 text-sm italic leading-relaxed">
          &ldquo;{card.representativePromptLogic}&rdquo;
        </div>
      </div>
    </div>
  );
}

export function AIArchitecture() {
  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      lastReviewed: 'April 2026',
      systemFlow: FLOW_STEPS,
      sections: SECTIONS,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tomas-ai-architecture.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Top framing */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Tomas does not generate answers freely. Every response is constrained, checked, and traceable to defined rules.
            </p>
            <p className="text-sm text-muted-foreground">
              This view documents how Tomas is structured. It is a curated representation of the system, not a live mirror of the backend.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="shrink-0">
            <Download className="w-3.5 h-3.5 mr-1.5" />Export as JSON
          </Button>
        </div>
      </div>

      {/* System Flow */}
      <Card>
        <CardHeader>
          <CardTitle>System flow</CardTitle>
          <CardDescription>The lifecycle of a request through Tomas, step by step.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative pl-8">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.step} className="relative pb-6 last:pb-0">
                {/* Connecting line */}
                {i < FLOW_STEPS.length - 1 && (
                  <div className="absolute left-[-20px] top-8 bottom-0 w-0.5 bg-border" />
                )}
                {/* Step circle */}
                <div className="absolute left-[-28px] top-0.5 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {step.step}
                </div>
                {/* Content */}
                <div>
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">See: {step.section}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {SECTIONS.map((section, sIdx) => (
        <Card key={sIdx}>
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {section.cards.map((card, cIdx) => (
                <AccordionItem key={cIdx} value={`${sIdx}-${cIdx}`}>
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>{card.name}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${FLOW_BADGE_STYLES[card.flowPosition]}`}>
                        {card.flowPosition}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <PromptCardView card={card} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}

      {/* Footer */}
      <div className="border-t pt-4 space-y-1">
        <p className="text-xs text-muted-foreground">Last reviewed: April 2026</p>
        <p className="text-xs text-muted-foreground/70">
          This tab is manually maintained and should be reviewed when system prompts or logic change.
        </p>
      </div>
    </div>
  );
}
