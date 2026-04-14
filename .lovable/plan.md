

## Plan: Update AI Architecture flow steps and fix inaccuracies

### File to modify
`src/components/AIArchitecture.tsx`

### 1. Updated System Flow steps (lines 36-43)

| Step | Title | Updated description |
|------|-------|---------------------|
| 1 | User input received | The user submits a query or content through the frontend. The input is bundled with the active style guide, glossary, and training configuration. |
| 2 | Ambiguity check | For Ask Tomas only. The system prompt instructs Tomas to detect vague or multi-intent queries and ask a clarifying question before answering. |
| 3 | Mode routing | The user selects the mode — Ask Tomas or Compliance Check — and the system activates the corresponding pipeline. This is a user-driven choice, not an automated decision. |
| 4 | Context and rule injection | The full system prompt is assembled: style guide content, glossary, training config, mandatory rules, banned words, decision rules, and supplemental rules are injected into the prompt. |
| 5 | Response generation | The constrained prompt is sent to the AI model. Ask Tomas generates a single answer. Compliance Check runs a two-pass process: detect all issues, then validate and remove false positives. |
| 6 | Evaluation and filtering | Compliance Check only. The raw response is parsed as JSON, duplicate issues are removed, and ungrounded suggestions are filtered out before results are returned. |
| 7 | Gap detection | Ask Tomas only. An asynchronous post-response process checks whether the query revealed a topic not covered by existing guidance, and logs it if genuinely new. |

Key fix: Step 3 now correctly states the user selects the mode. Steps 2, 6, and 7 now clarify which mode they apply to.

### 2. Section reference links updated

Each step's `section` reference stays the same — these already point to the correct sections.

### 3. Other inaccuracies found and fixed

**Mode Logic section description (line 76):** Change from "How Tomas routes between chat assistance and compliance checking." to "How Tomas operates in each mode — chat assistance and compliance checking." — since the routing is user-driven, not system-driven.

No other inaccuracies found in the prompt cards. All 19 cards accurately reflect the system as discussed.

### Summary
- Update 7 flow step descriptions for accuracy and clarity
- Update Mode Logic section description
- No other changes needed

