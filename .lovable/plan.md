

## Plan: Fix generic clarification options

### Problem
When Tomas encounters unclear input (e.g. "how alligator style guide unibet?"), it generates generic helper actions like "Explain unfamiliar terms", "Provide more detail", "Rephrase your question" — these are useless system actions, not interpretations of what the user might mean.

### Solution
Update the clarification instructions in the system prompt to explicitly require interpretation-based options derived from the user's actual words, and ban generic fallback phrases.

### File: `supabase/functions/style-guide-chat/index.ts`

Update the MODE 1: CLARIFICATION section (lines ~219–225) to:

- **Ban generic options**: Explicitly list prohibited option patterns: "Rephrase your question", "Provide more detail", "Explain unfamiliar terms", "Ask about the style guide", etc.
- **Require word-level analysis**: Instruct Tomas to extract key words from the user's input and generate plausible meanings from those words.
- **Add example**: Show a concrete example of messy input → good interpretation options.
- **Minimum viable interpretation**: Even for garbled input, attempt 2–3 meaningful guesses based on the words present.

The updated clarification block will read approximately:

```
MODE 1: CLARIFICATION (before answering)
Trigger ONLY when you cannot confidently interpret the user's question.
- Analyse the actual words in the user's query. Identify key terms and infer plausible meanings.
- Generate 2–4 options where each represents a different interpretation of what the user likely meant.
- Write a short prompt (1 sentence max), then append the marker.

CRITICAL — option content rules for clarification:
- Every option MUST be derived from the user's actual words, not generic help actions.
- NEVER use these as options: "Rephrase your question", "Provide more detail", 
  "Explain unfamiliar terms", "Ask about the style guide", "Clarify your question".
  These are internal fallback behaviours, not user-facing choices.
- Each option must be a plausible interpretation of the user's intent.
- Example: user says "how alligator style guide unibet?" →
  Good: ["Explain what 'alligator' means", "Rewrite this in Unibet style", "Fix this sentence"]
  Bad: ["Provide more detail", "Rephrase your question", "Explain unfamiliar terms"]
```

Then redeploy the edge function.

### Files to modify
- `supabase/functions/style-guide-chat/index.ts` — prompt update + redeploy

