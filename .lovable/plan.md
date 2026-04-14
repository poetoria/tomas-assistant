

## Final Implementation Plan: AI Architecture Tab

### Overview
Create a new "AI Architecture" tab in Settings that presents Tomas as a governed, structured system. This is a front-end-only, read-only feature with no backend changes.

---

### Files to Create

**`src/components/AIArchitecture.tsx`** (~550 lines)

---

### Files to Modify

**`src/components/SettingsPanel.tsx`**
- Line 2: Add `Network` (or `Cpu`) icon import for the tab
- Line 507: Change `grid-cols-6` → `grid-cols-7`
- After line 513: Add `<TabsTrigger value="architecture"><Cpu className="w-3 h-3" />AI Architecture</TabsTrigger>`
- Add corresponding `<TabsContent value="architecture"><AIArchitecture /></TabsContent>` after the gaps tab content
- Add import for `AIArchitecture` component

---

### Component Structure (`AIArchitecture.tsx`)

#### Top-Level Framing (always visible, not collapsible)

**Governance statement:**
> "Tomas does not generate answers freely. Every response is constrained, checked, and traceable to defined rules."

**Disclaimer:**
> "This view documents how Tomas is structured. It is a curated representation of the system, not a live mirror of the backend."

**Export button** — "Export as JSON" in the top-right area, downloads the full architecture data structure as a `.json` file.

---

#### Section 0 — System Flow

A vertical stepper/timeline built with Tailwind-styled divs and connecting lines. Each step is a small card with:
- Step number (circled)
- Title
- One-line description
- Subtle link text referencing the relevant section below

| Step | Title | Description |
|------|-------|-------------|
| 1 | User input received | The query enters the system and is prepared for processing. |
| 2 | Ambiguity check | Pre-response clarification determines if the query is clear enough to answer. |
| 3 | Mode routing | The system determines whether to use Ask Tomas or Compliance Check. |
| 4 | Context and rule injection | Style guide, glossary, training config, and mandatory rules are assembled into the prompt. |
| 5 | Response generation | The constrained prompt is sent to the AI model to generate a response. |
| 6 | Evaluation and filtering | The response is validated, deduplicated, and checked against guardrails. |
| 7 | Gap detection | Post-response analysis determines if the query revealed missing guidance. |

---

#### Sections 1–7 — Prompt Card Groups

Each section is a `Card` with a title and a one-line description subtitle. Inside each card, prompt cards are rendered as `Accordion` items.

##### Prompt Card Schema

```typescript
interface PromptCard {
  name: string;
  purpose: string;
  trigger: string;
  inputs: string[];
  expectedOutput: string;
  constraints: string[];
  dependencies: string[];
  flowPosition: 'pre-response' | 'generation' | 'post-response' | 'always active';
  representativePromptLogic: string; // core behavioural constraints, copyable
}
```

Each card renders:
- Title (the `name`)
- `flowPosition` as a coloured `Badge` (green = always active, blue = pre-response, purple = generation, orange = post-response)
- Fields displayed as a definition-list layout (label in muted text, value below)
- "Copy" button on the `representativePromptLogic` field using `navigator.clipboard.writeText()`

##### Section 1 — Global System Instructions
*The always-on rules that shape Tomas's baseline behaviour.*

**Card 1: Tomas Identity and Expertise**
- Purpose: Defines who Tomas is — a senior compliance and editorial specialist
- Trigger: Every request
- Inputs: None (hardcoded identity)
- Expected Output: Consistent persona across all interactions
- Constraints: British English only; no speculative advice; no personal opinions
- Dependencies: None
- Flow position: always active
- Representative prompt logic: "You are Tomas, a senior compliance and editorial specialist. You write in British English. You do not guess, speculate, or improvise. Every answer must be grounded in configured rules or standard language conventions."

**Card 2: Response Discipline**
- Purpose: Controls how Tomas structures and scopes answers
- Trigger: Every response generation
- Inputs: User query, detected intent
- Expected Output: Focused, single-intent response matched to query complexity
- Constraints: One question at a time; match response depth to complexity; do not over-answer
- Dependencies: Tomas Identity and Expertise
- Flow position: generation
- Representative prompt logic: "Answer only the question asked. Do not introduce related topics. Match the depth of your response to the complexity of the question. Simple questions get short answers."

##### Section 2 — Mode Logic
*How Tomas routes between chat assistance and compliance checking.*

**Card 3: Ask Tomas (Chat)**
- Purpose: Powers the conversational assistant mode
- Trigger: User submits a question in the Ask Tomas tab
- Inputs: User query, conversation history, full style guide content, glossary, training config, supplemental rules
- Expected Output: A grounded answer referencing configured rules where applicable
- Constraints: Must cite rules when they exist; general expert advice only when no rule covers the topic
- Dependencies: Tomas Identity, Response Discipline, Context and Rule Injection
- Flow position: generation
- Representative prompt logic: "Use the style guide, glossary, and training configuration to answer. If the guide covers the topic, cite the relevant rule. If not, provide expert guidance and clearly indicate it is not from a configured rule."

**Card 4: Compliance Check orchestration**
- Purpose: Orchestrates the two-pass compliance checking pipeline
- Trigger: User submits text in the Compliance Check tab
- Inputs: User text, style guide, glossary, training config, mandatory rules, regulatory settings, risk level
- Expected Output: Structured JSON array of issues with severity, rule citations, and suggested fixes
- Constraints: Pass 1 detects all issues; Pass 2 validates and removes false positives; every issue must cite a baseline rule or configured rule
- Dependencies: Tomas Identity, Guardrails, Decision Logic (Priority Hierarchy)
- Flow position: generation
- Representative prompt logic: "Pass 1: Scan the text and flag every issue. Pass 2: Review each flagged issue. Remove any that cannot be traced to a configured rule or baseline language convention. Every surviving issue must cite its rule source."

##### Section 3 — Guardrails
*Hard constraints that override all other logic.*

**Card 5: Banned Words**
- Purpose: Flags any use of explicitly prohibited terms
- Trigger: During compliance check, when banned words list is configured
- Inputs: User text, banned words list from training config
- Expected Output: High-severity issue for each banned word found
- Constraints: Always high severity; no exceptions; exact match and variant detection
- Dependencies: Training config (banned words list)
- Flow position: generation
- Representative prompt logic: "If any of the following banned words appear in the text, flag each as a HIGH severity issue. No exceptions. Banned words: [injected from config]."

**Card 6: Prohibited Patterns**
- Purpose: Detects structural or formatting patterns that are never allowed
- Trigger: During compliance check, when prohibited patterns are configured
- Inputs: User text, prohibited patterns from training config
- Expected Output: High-severity issue for each pattern match
- Constraints: Always high severity; pattern-level matching
- Dependencies: Training config (prohibited patterns list)
- Flow position: generation
- Representative prompt logic: "Flag any text that matches a prohibited pattern. These are always high severity regardless of context."

**Card 7: Mandatory Content Rules**
- Purpose: Ensures required elements are present in checked text
- Trigger: During compliance check, when mandatory rules are configured
- Inputs: User text, mandatory rules from training config
- Expected Output: Issue flagged if required content is missing
- Constraints: Flag absence, not just incorrect usage
- Dependencies: Training config (mandatory rules list)
- Flow position: generation
- Representative prompt logic: "Check that the following mandatory elements are present. If any are missing, flag as an issue and cite the specific mandatory rule."

##### Section 4 — Decision Logic
*The priority hierarchy and conditional rules that govern output.*

**Card 8: Rule Priority Hierarchy**
- Purpose: Defines which rules take precedence when conflicts arise
- Trigger: During compliance check issue ranking
- Inputs: All applicable rules for a given text segment
- Expected Output: Issues ranked by priority level
- Constraints: Six-level hierarchy, strictly enforced
- Dependencies: All guardrail and configured rule cards
- Flow position: generation
- Representative prompt logic: "Priority order: 1. Regulatory/legal requirements, 2. Mandatory content rules, 3. Banned words and prohibited patterns, 4. Glossary and terminology, 5. Style guide rules, 6. Style and tone preferences."

**Card 9: Risk Level Escalation**
- Purpose: Adjusts checking strictness based on configured risk level
- Trigger: During compliance check, based on risk level setting
- Inputs: Risk level (low/medium/high), detected issues
- Expected Output: Adjusted severity thresholds
- Constraints: Higher risk = stricter checking, lower thresholds for flagging
- Dependencies: Training config (risk level)
- Flow position: generation
- Representative prompt logic: "At HIGH risk level, flag even minor deviations. At LOW risk level, only flag clear violations. MEDIUM is the default balanced mode."

**Card 10: Decision Rules (If/Then)**
- Purpose: Applies conditional logic defined in training config
- Trigger: During compliance check, when decision rules are configured
- Inputs: User text, decision rules from training config
- Expected Output: Contextual issues based on conditional matches
- Constraints: Only fire when conditions are met; do not infer beyond configured rules
- Dependencies: Training config (decision rules)
- Flow position: generation
- Representative prompt logic: "Apply the following conditional rules. Each has a condition and an action. Only flag when the condition is clearly met in the text."

##### Section 5 — Interaction Logic
*How Tomas handles ambiguity and guides users after responding.*

**Card 11: Pre-response clarification (ambiguity handling)**
- Purpose: Detects ambiguous or multi-intent queries before generating a response
- Trigger: When the user's question is unclear, vague, or contains multiple intents
- Inputs: User query, style guide context
- Expected Output: Clarifying question presented to the user before answering
- Constraints: Only trigger when genuine ambiguity exists; do not over-clarify simple questions
- Dependencies: Tomas Identity, Response Discipline
- Flow position: pre-response
- Representative prompt logic: "Before answering, check if the question is ambiguous or contains multiple intents. If so, ask one focused clarifying question. If the question is clear, proceed directly to answering."

**Card 12: Post-response guidance (follow-up options)**
- Purpose: Provides relevant follow-up options after answering
- Trigger: After every Ask Tomas response
- Inputs: The question asked, the answer given, style guide context
- Expected Output: 2–3 relevant follow-up options, verb-led
- Constraints: Options must be contextually relevant; verb-led format; no generic suggestions
- Dependencies: Ask Tomas (Chat), Response Discipline
- Flow position: post-response
- Representative prompt logic: "After answering, suggest 2–3 follow-up questions the user might ask next. Each should be verb-led, specific to the topic just discussed, and grounded in the style guide where possible."

##### Section 6 — Gap Detection Loop
*The logic that identifies missing guidance and feeds reviewed rules back into the system.*

**Card 13: Noise Filter**
- Purpose: Skips conversational or trivial queries before gap classification
- Trigger: After every Ask Tomas response, before grounding check
- Inputs: User query text
- Expected Output: Skip signal for non-substantive queries
- Constraints: Skip if query < 15 characters or matches conversational patterns (thanks, ok, hello, yes, no, got it, cheers)
- Dependencies: None
- Flow position: post-response
- Representative prompt logic: "If the user query is fewer than 15 characters or matches common conversational phrases, skip gap detection entirely."

**Card 14: Answer-Based Grounding Check**
- Purpose: Determines if the question was already covered by existing guidance
- Trigger: After noise filter passes, for each substantive query
- Inputs: User query, Tomas's full answer
- Expected Output: Grounded (skip) or Ungrounded (candidate for gap logging)
- Constraints: Treats both direct citations and clear paraphrases of documented rules as grounded; does not require literal quoting
- Dependencies: Ask Tomas (Chat) — relies on the answer already being generated with full style guide context
- Flow position: post-response
- Representative prompt logic: "Examine the assistant's answer. Does it reference, cite, paraphrase, or clearly draw on a documented rule, style guide section, glossary term, or configured setting? If yes → grounded, do not log. If the answer is purely general expert advice with no reference to documented sources → not grounded."

**Card 15: Semantic Deduplication**
- Purpose: Prevents logging the same underlying topic more than once
- Trigger: After grounding check classifies a query as ungrounded
- Inputs: New query, list of existing active gaps (status = 'new', limit 50 most recent), promoted rule source queries
- Expected Output: Duplicate (skip) or New topic (proceed to insert)
- Constraints: Checks topic and intent match, not just exact wording; limited to active unresolved gaps and promoted rules
- Dependencies: Gap database, supplemental rules table
- Flow position: post-response
- Representative prompt logic: "Compare the new question against existing active gaps and promoted rules. Does any existing entry already cover the same topic or intent, even if worded differently? If yes → skip. If no → log as new gap."

**Card 16: Gap Insertion**
- Purpose: Logs a genuinely new content gap for review
- Trigger: After deduplication confirms the topic is new
- Inputs: User query, classification result
- Expected Output: New row in style_guide_gaps table with status 'new'
- Constraints: Only reaches this point if noise filter, grounding check, and dedup all pass
- Dependencies: Noise Filter, Answer-Based Grounding, Semantic Deduplication
- Flow position: post-response
- Representative prompt logic: "Insert the query into the content gaps table. This gap will be visible to administrators for review and potential promotion to a supplemental rule."

##### Section 7 — Evaluation and Filtering
*How outputs are validated before being returned.*

**Card 17: JSON Parse and Repair**
- Purpose: Ensures compliance check output is valid structured JSON
- Trigger: After compliance check response generation
- Inputs: Raw AI response text
- Expected Output: Valid JSON array of issues
- Constraints: Attempts repair if initial parse fails; uses AI-assisted repair as fallback
- Dependencies: Compliance Check orchestration
- Flow position: post-response
- Representative prompt logic: "Parse the response as JSON. If parsing fails, attempt to extract and repair the JSON structure. If repair fails, use a secondary AI call to reconstruct valid JSON from the raw text."

**Card 18: Issue Deduplication**
- Purpose: Removes duplicate issues from compliance check results
- Trigger: After JSON parsing succeeds
- Inputs: Array of parsed issues
- Expected Output: Deduplicated array
- Constraints: Composite key based on issue text, location, and rule citation
- Dependencies: JSON Parse and Repair
- Flow position: post-response
- Representative prompt logic: "Remove duplicate issues using a composite key of the issue description, affected text, and cited rule. Keep the first occurrence."

**Card 19: Anti-Boilerplate Filter**
- Purpose: Removes issues that suggest adding content not traceable to configured rules
- Trigger: After deduplication
- Inputs: Deduplicated issues array
- Expected Output: Filtered array with ungrounded "add this content" issues removed
- Constraints: Checks if suggested new content can be traced to a specific rule; allows baseline language rule citations
- Dependencies: Issue Deduplication, Guardrails
- Flow position: post-response
- Representative prompt logic: "If an issue suggests adding new content (disclaimer, warning, sentence), verify the suggestion is traceable to a configured rule or baseline language convention. Remove suggestions that cannot be traced to any rule source."

---

#### Footer

**Last reviewed indicator:**
> "Last reviewed: April 2026"

**Update strategy notice (subtle, muted text):**
> "This tab is manually maintained and should be reviewed when system prompts or logic change."

**Code comment in component (not rendered):**
```typescript
// UPDATE STRATEGY
// v1: Static curated content. Acceptable for launch.
// Ownership: This tab is manually maintained. Any change to edge function
// prompts or filtering logic should trigger a review of this tab.
// Long-term: Migrate to a shared ai-architecture.json config file that
// serves as single source of truth for both this documentation view
// and the prompt assembly in edge functions.
```

---

### UI Implementation Details

- System Flow stepper: Tailwind divs with `border-l-2` connecting lines, numbered circles (`w-8 h-8 rounded-full` with step number), and card-style step descriptions
- Section headers: `Card` component with `CardTitle` + `CardDescription` (the one-line subtitle)
- Prompt cards: `Accordion` + `AccordionItem` inside each section card
- Flow position: `Badge` component with colour coding — green (always active), blue (pre-response), purple (generation), orange (post-response)
- Card fields: Definition-list layout using grid (`grid-cols-[auto_1fr]`) with muted labels
- Copy button: Small `Button variant="ghost" size="sm"` next to representative prompt logic, uses `navigator.clipboard.writeText()`, shows toast on copy
- Export: Top-level button that serialises the full data structure to JSON and triggers download via `URL.createObjectURL()` + anchor click
- Scrollable: Component wrapped in the existing settings scroll context

---

### Summary of All Changes

| File | Action | Details |
|------|--------|---------|
| `src/components/AIArchitecture.tsx` | Create | ~550 lines. Full architecture view component with all data, sections, and UI. |
| `src/components/SettingsPanel.tsx` | Modify | Add import, change `grid-cols-6` → `grid-cols-7`, add TabsTrigger + TabsContent for "AI Architecture" tab. |

