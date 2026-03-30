

## Plan

### 1. Hardcode "we" = brand in the system prompt
**File:** `supabase/functions/style-guide-chat/index.ts`

Add a directive to the system prompt that when the user says "we", "our", or "us", it refers to the configured brand. For example:
```
- When the user says "we", "our", or "us", they are referring to {brandName}. Interpret all questions accordingly.
```

This goes in the brand context section so it only activates when a brand name is set.

### 2. Change the T&Cs example prompt to "How do we write about money?"
**File:** `src/components/StyleGuideChat.tsx`

Replace both instances of the T&Cs prompt:
- `"How should we style the term T&Cs in copy?"` → `"How do we write about money?"`

### 3. Add new fine-tuning settings to the settings panel

**File:** `src/components/SettingsPanel.tsx` and `src/types/translation.ts`

Add the following training/fine-tuning options to the settings panel (in a new "Training" tab or within the existing "Instructions" tab):

- **Target audience** — free text field (e.g. "18-35 sports bettors", "NHS patients", "small business owners"). Tells TINA2 who the content is for.
- **Reading level** — dropdown: Simple (age 9-11), Standard (age 12-15), Advanced (age 16+). Controls vocabulary complexity.
- **Preferred spelling convention** — dropdown: British English, American English, Australian English. Currently hardcoded to British.
- **Content type focus** — multi-select checkboxes: Marketing, Legal, UX/UI copy, Editorial, Social media. Tells TINA2 what kind of content is typical.
- **Banned words/phrases** — free text area, one per line. Words TINA2 should never use (e.g. "click here", "please", "simply").
- **Preferred alternatives** — similar to glossary but for style preferences (e.g. "use 'select' instead of 'click'", "use 'start' instead of 'commence'").

These get stored in `global_settings` (add columns or store as JSON in existing fields) and injected into all AI prompts.

**Database:** Add a `training_config` JSONB column to `global_settings` to store these new fields without needing multiple column additions.

**Edge functions:** Update `style-guide-chat`, `translate-text`, and `compliance-check` to include these settings in their system prompts.

### Technical summary

| File | Change |
|------|--------|
| `supabase/functions/style-guide-chat/index.ts` | Add "we = brand" directive; consume new training config |
| `src/components/StyleGuideChat.tsx` | Change T&Cs prompt to money prompt |
| `src/types/translation.ts` | Add `TrainingConfig` interface |
| `src/components/SettingsPanel.tsx` | Add training settings UI (new tab or section) |
| `src/hooks/useSettingsStorage.ts` | Read/write training config from DB |
| `supabase/functions/translate-text/index.ts` | Consume training config in prompts |
| `supabase/functions/compliance-check/index.ts` | Consume training config in prompts |
| Database migration | Add `training_config` JSONB column to `global_settings` |

