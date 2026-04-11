

## Plan: Deterministic compliance checking with self-validation

### Problem
The compliance checker produces different results on repeated runs of identical content. Suggested rewrites don't survive a fresh check, creating circular contradictions.

### Root causes in current code
1. No `temperature` set (defaults to non-zero) — same input produces different output each run
2. Suggestions are never validated — the rewrite is returned without checking it against the same rules
3. Prompt allows subjective flagging ("unclear writing", "wrong tone") with no rule citation requirement
4. No rule priority hierarchy — conflicting suggestions can contradict each other
5. No deduplication — overlapping issues create noise and instability

---

### Changes

**File: `supabase/functions/compliance-check/index.ts`**

#### 1. Deterministic model settings
- Set `temperature: 0` on all AI calls
- Use a fixed `seed` value (e.g. `42`) for additional reproducibility

#### 2. Two-pass validation with a hard stop
After Pass 1 produces issues + rewrittenContent:
- **Pass 2**: Check the rewrittenContent using the exact same system prompt, context sections, content type, and model settings
- If Pass 2 finds issues in the rewrite, revise the rewrite once using Pass 2's output
- **Hard stop**: Maximum 2 passes total. If the rewrite still has issues after one revision, return the best version with a flag: `"validationNote": "Some suggestions could not be fully reconciled"` — do not loop further

#### 3. Rule priority hierarchy in the prompt
Add explicit priority ordering so the model resolves conflicts consistently:

```text
# Rule priority (highest to lowest)
1. Regulatory / legal requirements — always enforced
2. Prohibited patterns — always flagged
3. Mandatory content rules — flag if missing
4. Terminology / glossary — use required terms
5. Clarity — fix ambiguity only where meaning is unclear
6. Style / tone — flag only if it contradicts a defined brand rule

Do NOT flag stylistic preferences. Every issue must cite which rule or category it violates.
```

#### 4. Anti-drift prompt rules
Add to the system prompt:
- "Every issue MUST cite which specific rule, glossary entry, or standard it violates."
- "Do not flag text that is already compliant. If content satisfies the rules, return zero issues."
- "Do not suggest alternative phrasings for compliant text."
- "Your rewrittenContent MUST comply with all the same rules. Do not introduce new violations."
- "If two rules conflict, apply the higher-priority rule."

#### 5. Deduplication pass
Before returning results, deduplicate issues in code:
- If two issues reference the same `originalText` (or substantially overlapping text), keep the higher-severity one
- If two suggestions target the same span, merge them into one issue with the combined fix

#### 6. Validation metadata in response
Add to the response JSON:
- `"validated": true|false` — whether the rewrite passed its own check
- `"validationNote"` — optional explanation if validation found residual issues

#### 7. Same prompt for both passes
Extract the system prompt construction into a reusable function. Both Pass 1 and Pass 2 must use the identical prompt, context, content type, model, temperature, and seed. The only difference is the content being checked (original vs rewrite).

---

**File: `src/components/ComplianceChecker.tsx`**

#### 1. Show validation status
In the Results Summary card, add:
- If `validated === true`: "Suggestions verified — all fixes pass the same rules"
- If `validated === false` with a note: show the validation note so the user knows

No other UI changes needed — this is a backend consistency fix.

---

### What this does NOT do
- Does not add session memory or history tracking
- Does not blanket-protect previously suggested wording — rewrites can still fail validation if they violate a higher-priority rule
- Does not loop indefinitely — hard stop after 2 passes

### Files to modify
- `supabase/functions/compliance-check/index.ts` — temperature, seed, two-pass validation, rule priority, deduplication, prompt hardening
- `src/components/ComplianceChecker.tsx` — validation status indicator

