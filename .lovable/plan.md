

## Analysis

The previous plan identified two fixes but was never implemented (it was in plan mode only). The issue remains: the example prompt "How do we write T&Cs?" is ambiguous — the AI can interpret it as "how to draft a T&C document" rather than "how to style the term T&Cs in copy."

When you type manually, you likely phrase it slightly differently or the AI happens to interpret it correctly. The example prompt button sets the exact same text, but the ambiguity means the AI sometimes gets it wrong.

## Plan

### 1. Reword the ambiguous example prompt
**File:** `src/components/StyleGuideChat.tsx` (lines 175, 180)

Change:
- `"How do we write T&Cs?"` → `"How should we style the term T&Cs in copy?"`

### 2. Add scope guardrails to the system prompt
**File:** `supabase/functions/style-guide-chat/index.ts`

Add to the system prompt instructions:

```
- Focus on how words, terms, and content are written, formatted, capitalised, and styled — not on how to create or draft entire documents
- When asked about terms like "T&Cs", advise on how to write, abbreviate, or style the term in content — do not explain how to draft a Terms and Conditions document
- Stay within the scope of content style, UX writing, and editorial guidance
```

This ensures even if someone asks an ambiguous question, the AI stays within style guide scope.

### Technical details

- Two files changed, no structural changes
- The system prompt change also protects against future ambiguous questions from users typing freely

