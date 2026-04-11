

## Plan: Restore baseline language rule detection in compliance checker

### Problem
The strict "cite a specific rule" and "do not infer" instructions — added to prevent boilerplate injection — have overcorrected. The model now suppresses legitimate issues like incorrect currency formatting ("40£" → "£40") and grammar errors because it can't point to a *configured* rule. Ask Tomas catches these because it has no such restriction.

### Root cause
Lines 231-244 of the compliance-check system prompt treat ALL issues the same: every one must cite a configured rule, glossary entry, or standard. But standard language conventions (grammar, punctuation, currency formatting, spelling) don't need explicit configuration — they're baseline rules that should always apply.

### Changes

**File: `supabase/functions/compliance-check/index.ts`**

#### 1. Add "baseline rules" category to the system prompt (after line 228, before strict checking rules)

Add a new section that explicitly defines always-on baseline rules:

```
# Baseline language rules (always enforced — no configuration needed)
These are standard writing conventions that apply regardless of what rules are configured:
- Grammar and punctuation errors
- Currency formatting (e.g. symbol before number: "£40" not "40£")
- Number/unit formatting conventions
- Spelling errors (apply the spelling convention configured above)
- Sentence structure errors (e.g. incomplete sentences, dangling modifiers)

You do NOT need a configured rule to flag these. Cite "baseline: [convention name]" as the rule.
```

#### 2. Narrow the "cite a specific rule" instruction (line 231)

Change from:
> "Every issue MUST cite which specific rule, glossary entry, or standard it violates. Issues without a rule citation are not valid."

To:
> "Every issue MUST cite either a baseline language rule OR a specific configured rule, glossary entry, or standard it violates. Issues without any rule citation are not valid."

#### 3. Narrow the "do not infer" instruction (line 240)

Change from:
> "Do NOT infer requirements. Only enforce rules explicitly stated in the style guide, glossary, mandatory rules, or regulatory configuration above."

To:
> "Do NOT infer additional content requirements (disclaimers, warnings, mandatory elements). Baseline language rules (grammar, spelling, currency formatting, punctuation) are always enforceable without explicit configuration."

#### 4. Narrow the "do not flag stylistic preferences" instruction (line 232)

Change from:
> "Do NOT flag stylistic preferences. Only flag actual rule violations."

To:
> "Do NOT flag subjective stylistic preferences (e.g. word choice that is not wrong, just different). Baseline language errors and configured rule violations are always flaggable."

#### 5. Update anti-boilerplate filter to allow baseline-cited issues

In `filterUngroundedIssues` (line 419), when checking if new content is traceable, also allow issues whose `issue` field contains "baseline:" — these are grounded in standard conventions, not configured rules.

### No other changes needed
- Frontend unchanged
- Post-processing pipeline unchanged
- The fix is entirely in the prompt and a small filter adjustment

### Files to modify
- `supabase/functions/compliance-check/index.ts`

