

## Plan: Structured clarification and exploration modes for Tomas

### Problem
The current `parseClarificationOptions` function detects ANY numbered list (1. 2. 3.) in assistant responses and renders them as clickable buttons — even when they're part of a normal answer (e.g. "Here are 3 rules: 1. Use active voice 2. Keep it short 3. Avoid jargon"). This breaks the answer display. There's also no concept of exploration (post-answer suggestions).

### Approach
Use explicit JSON markers in the AI response to distinguish between clarification options, exploration options, and regular content — instead of heuristic regex parsing.

### Changes

**1. Backend prompt update** (`supabase/functions/style-guide-chat/index.ts`)
- Update the system prompt to instruct Tomas to embed structured JSON blocks when clarifying or suggesting next steps
- Clarification format: a `[CLARIFICATION]{"options":["...", "..."]}[/CLARIFICATION]` block at the end of the message when the question is ambiguous
- Exploration format: a `[EXPLORATION]{"options":["...", "..."]}[/EXPLORATION]` block at the end of the message when useful follow-up actions exist
- Rules in prompt: never use both at once; clarification = before answering; exploration = only when there are genuinely useful next steps; options must be verb-led and specific

**2. Parser rewrite** (`src/components/ClarificationOptions.tsx`)
- Replace regex-based numbered-list detection with JSON marker extraction
- New function `parseStructuredOptions(text: string)` returns `{ type: 'clarification' | 'exploration' | null, options: string[], cleanText: string }`
- `cleanText` is the message with the marker block stripped out (so it renders normally)
- Keep `resolveOptionInput` for typed fallback ("1", "2", partial text)
- Rename component to support both modes — show "Choose an option:" for clarification, "Explore further:" for exploration

**3. Chat component updates** (`src/components/StyleGuideChat.tsx`)
- Use `parseStructuredOptions` instead of `parseClarificationOptions`
- Render the `cleanText` (without markers) as the message body
- Show the appropriate button set below the message based on type
- Only show on the last assistant message and only when not loading

**4. Floating assistant** (`src/components/FloatingAssistant.tsx`)
- Apply the same marker parsing and option rendering
- Compact button layout suitable for the smaller widget

### Files to modify
- `supabase/functions/style-guide-chat/index.ts` — prompt changes + redeploy
- `src/components/ClarificationOptions.tsx` — parser rewrite + dual-mode UI
- `src/components/StyleGuideChat.tsx` — use new parser, render clean text
- `src/components/FloatingAssistant.tsx` — add option support

