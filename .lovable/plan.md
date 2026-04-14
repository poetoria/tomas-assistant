

## Plan: Remove Mode Routing Step, Consolidate to 6-Step Flow

### File to modify
`src/components/AIArchitecture.tsx`

### Change (lines 35–43)

Remove the "Mode routing" step (current step 3) entirely. Merge the mode context into step 1's description so it's clear the user has already chosen a mode before input is submitted. Renumber remaining steps to 1–6.

| Step | Title | Description | Section ref |
|------|-------|-------------|-------------|
| 1 | User input received | The user selects a mode — Ask Tomas or Compliance Check — and submits a query or content. The input is bundled with the active style guide, glossary, and training configuration. | Mode Logic |
| 2 | Ambiguity check | Ask Tomas only. The system prompt instructs Tomas to detect vague or multi-intent queries and ask a clarifying question before answering. | Interaction Logic |
| 3 | Context and rule injection | The full system prompt is assembled: style guide content, glossary, training config, mandatory rules, banned words, decision rules, and supplemental rules are injected into the prompt. | Guardrails |
| 4 | Response generation | The constrained prompt is sent to the AI model. Ask Tomas generates a single answer. Compliance Check runs a two-pass process: detect all issues, then validate and remove false positives. | Decision Logic |
| 5 | Evaluation and filtering | Compliance Check only. The raw response is parsed as JSON, duplicate issues are removed, and ungrounded suggestions are filtered out before results are returned. | Evaluation and Filtering |
| 6 | Gap detection | Ask Tomas only. An asynchronous post-response process checks whether the query revealed a topic not covered by existing guidance, and logs it if genuinely new. | Gap Detection Loop |

### Summary
- Remove "Mode routing" as a standalone step — it's a UI precondition, not a processing step
- Merge mode selection context into step 1
- Renumber to a clean 6-step flow
- No other changes needed

