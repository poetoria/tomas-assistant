

## Plan: Fix inconsistent result presentation in compliance checker

### Problem
When the anti-boilerplate filter or deduplication removes all issues from pass 1, the backend returns `issues: []` but keeps the **original pass 1 summary** which says something like "issues with currency formatting were corrected." The UI then shows contradictory states: "0 issues / No issues found" alongside a summary claiming corrections were made, plus a "Rewritten Content" section showing unchanged text.

### Root causes

**Backend (lines 604-613):** When all issues are filtered out post-processing, the code returns `summary: pass1Result.summary` — which is the AI's original summary that described the issues it found *before* filtering. It should be overridden to reflect that zero issues remain.

**Frontend (lines 461-495):** The "Rewritten Content" card is always shown when `result` exists, even when there are zero issues and the rewritten content is identical to the original input.

### Changes

**File: `supabase/functions/compliance-check/index.ts`**

1. **Override summary when issues are filtered to zero (line 609):** Change from `pass1Result.summary || 'No issues found...'` to always use `'No issues found. Content is compliant.'` — the original AI summary is no longer relevant since all its issues were removed.

**File: `src/components/ComplianceChecker.tsx`**

2. **Hide "Rewritten Content" card when there are no issues (line 461-495):** Only render the Rewritten Content card when `result.issues.length > 0`. If the checker found nothing to fix, there's no rewrite to show.

3. **Align summary display:** When `result.issues.length === 0`, the summary section should clearly show a clean-pass state without contradictory language about corrections.

### Files to modify
- `supabase/functions/compliance-check/index.ts` — override summary on zero-issue result
- `src/components/ComplianceChecker.tsx` — conditionally hide rewritten content card

