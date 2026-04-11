

## Plan: Tighten compliance checker to minimal, rule-cited fixes only

### Problem
The checker over-corrects — injecting generic boilerplate ("terms and conditions apply", "BeGambleAware.org") not tied to any configured rule. The prompt conflictingly says "cite a rule for every issue" while also saying "include safer gambling warnings" and "check mandatory content rules."

### Changes

**File: `supabase/functions/compliance-check/index.ts`**

#### 1. Minimal-edit principle (add after line 146)
Add these rules to the system prompt in `buildSystemPrompt`:
- "Make the SMALLEST change that resolves each issue. Do not expand, pad, or restructure content beyond what is needed."
- "Do NOT add disclaimers, warnings, or boilerplate unless a specific mandatory content rule listed above explicitly requires it."
- "Do NOT infer requirements. Only enforce rules explicitly stated in the style guide, glossary, mandatory rules, or regulatory configuration above."
- "If no mandatory rule requires a specific disclaimer or warning, do not add one."
- "Your rewrittenContent should be as close to the original as possible, changing only what is necessary."

#### 2. Tighten regulatory mode descriptions (lines 86-88)
- **Gambling**: Change from `"include safer gambling warnings, avoid encouraging excessive play"` to `"flag language that encourages excessive play or makes misleading claims. Do NOT add generic safer gambling disclaimers unless a mandatory content rule explicitly requires them."`
- **Financial**: Change from `"include required disclaimers"` to `"flag misleading financial claims. Do NOT add disclaimers unless a mandatory content rule explicitly requires them."`

#### 3. Tighten mandatory content rule handling (line 102, line 151)
- Line 102: Keep as-is (it just lists configured rules)
- Line 151: Change from `"Check mandatory content rules — if required elements are missing, flag as high severity"` to `"Check mandatory content rules — if a SPECIFIC rule listed above requires certain content and it is missing, flag it. Do not infer or assume mandatory elements that are not explicitly listed in the configuration."`

#### 4. Change rewrite instruction (line 137)
From: `"Write a fully corrected version (rewrittenContent)"`
To: `"Write the content with ONLY the identified issues fixed. Keep everything else unchanged. Do not restructure, expand, or add content beyond what is needed to resolve flagged issues."`

#### 5. Tighten issue detection rules (lines 141-147)
Add to the strict checking rules:
- "Do NOT claim content is 'missing' something unless a specific configured mandatory rule requires it."
- "Do NOT add new sentences, disclaimers, or warnings in suggestions — only fix what is flagged."

#### 6. Anti-boilerplate filter function
Add `filterUngroundedIssues(issues, mandatoryRules)` after deduplication:
- For each issue, check if the `suggestion` adds a **new sentence or clause** not present in `originalText` (detected by: suggestion contains sentences not found in originalText)
- If it does, check whether the `issue` description references a term that appears in the configured `mandatoryRules` string
- If the addition is not traceable to a configured mandatory rule, remove the issue
- Pass `trainingConfig?.mandatoryRules` into the filter so it has the actual configured rules to match against

### No UI changes needed
Backend-only fix.

### Files to modify
- `supabase/functions/compliance-check/index.ts`

