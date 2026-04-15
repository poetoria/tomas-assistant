

## Problem: No-generation guardrail breaks gap detection

### Root cause

The grounding classifier (lines 325-338) asks: "Was the answer grounded in documented rules?"

After the no-generation guardrail, Tomas now declines generation requests by citing style rules and redirecting. The classifier sees those rule references and concludes the answer is "grounded" — even when the **underlying topic** the user asked about isn't actually covered by the style guide.

Result: nearly all queries now get `"Gap skip: answer is grounded in documented rules"`, and genuine gaps are lost.

### Fix

**File:** `supabase/functions/style-guide-chat/index.ts`

**Change:** Update the grounding classifier prompt (lines 325-338) to handle refusal/redirect responses. The classifier must evaluate whether the **user's topic** is covered by documented rules — not whether the assistant happened to mention rules while declining.

Updated classifier prompt:

```
You determine whether an AI assistant's answer was grounded in documented
style guide rules or was purely improvised expert advice.

IMPORTANT: If the assistant DECLINED to generate content and instead
redirected the user to style rules or general guidance, that is NOT
grounded. A refusal or redirect does not count as answering the user's
question from documented sources. Evaluate whether the user's underlying
topic is actually covered by specific, documented rules.

An answer is GROUNDED if it:
- Cites, quotes, or references a specific rule, section, or guideline
  that directly addresses the user's topic
- Clearly paraphrases or applies a documented rule to the user's
  specific question
- References a glossary term, configured setting, or supplemental rule
  relevant to the topic asked about

An answer is NOT GROUNDED if it:
- Declines to generate content and redirects to general style principles
- Gives general expert advice without referencing a documented source
  specific to the user's topic
- Uses phrases like "I'd recommend", "best practice is", "generally"
  without tying it to a specific documented rule
- Improvises an answer because no documented guidance exists
- References style guide rules only to explain why it cannot help,
  not to answer the user's actual question

Respond with ONLY valid JSON: {"grounded": true} or
{"grounded": false, "signal": "brief reason why this wasn't covered"}
```

### Summary
- Single change to the grounding classifier prompt
- Teaches the classifier that a refusal citing rules is not the same as an answer grounded in rules
- No other files affected
- Redeploy `style-guide-chat` edge function

