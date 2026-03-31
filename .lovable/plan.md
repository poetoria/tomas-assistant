

## Plan: Rebrand to Tomas and remove translation features

### Summary
Remove all translation functionality, rebrand from TINA 2 to Tomas, redesign the home screen as a focused style guide tool for Unibet, and update all copy throughout the app.

### 1. Redesign the home screen
**File:** `src/components/WelcomeScreen.tsx`

- Remove `onSelectTranslations` prop entirely
- Change app name from "TINA 2" to "Tomas"
- Replace the two cards (Translations / Style guide check) with:
  - Description text: "Tomas is an AI-powered content governance tool built for Unibet..." (as specified)
  - Two buttons: "Style guide chat" and "Compliance check"
- Add props for `onSelectChat` and `onSelectCompliance` instead of `onSelectTranslations`

### 2. Simplify Index page — remove translation views
**File:** `src/pages/Index.tsx`

- Remove `translation-mode`, `wizard`, `results` views from `AppView` type
- Remove all translation-related state, handlers, and imports (`TranslationModeSelector`, `TranslationWizard`, `TranslationResults`, `usePreferences`, `useTranslationHistory`, translation types)
- Pass `activeTab` prop to `StyleGuideCheck` so the home screen buttons can open the correct tab directly
- Update `WelcomeScreen` props to use new `onSelectChat` and `onSelectCompliance`
- Update the about section copy to reference Tomas instead of TINA 2
- Remove translation history from the history panel (keep only style guide conversations)

### 3. Update StyleGuideCheck to accept initial tab
**File:** `src/components/StyleGuideCheck.tsx`

- Add `initialTab` prop (`'chat' | 'compliance'`) to control which tab opens by default

### 4. Update StyleGuideChat copy
**File:** `src/components/StyleGuideChat.tsx`

- Change welcome text to: "Ask questions about Unibet's style guidelines and content standards, Tomas will give you clear answers with examples."
- Replace all "TINA2" references with "Tomas"
- Update `getAssistantName` function to return "Tomas" instead of "TINA2"

### 5. Update ComplianceChecker copy
**File:** `src/components/ComplianceChecker.tsx`

- Change description to: "Paste your English content below. Tomas will find style guide or compliance issues and suggest clear improvements."

### 6. Update all edge functions
**Files:** `supabase/functions/style-guide-chat/index.ts`, `supabase/functions/compliance-check/index.ts`, `supabase/functions/translate-text/index.ts`

- Replace "TINA2" with "Tomas" in all system prompts
- Update identity: "You are Tomas, an AI-powered content governance assistant for Unibet"

### 7. Update Documentation page
**File:** `src/pages/Documentation.tsx`

- Rename all "TINA 2" references to "Tomas"
- Update description from "plain language translation assistant" to "AI-powered content governance tool for Unibet"
- Remove translation-related documentation sections
- Focus documentation on style guide chat and compliance check features

### 8. Update index.html
**File:** `index.html`

- Change title and meta tags from "TINA 2" to "Tomas"
- Update description to reflect content governance tool

### 9. Update HistoryPanel — remove translation history tab
**File:** `src/components/HistoryPanel.tsx`

- Remove translation history tab and related props
- Show only style guide conversation history
- Simplify the component

### 10. Update CSS class names and variables
**File:** `src/index.css`

- Rename `tina-*` CSS custom properties and classes to `tomas-*` (or keep as-is since they're internal — cosmetic only)

### 11. Update settings storage keys
**File:** `src/hooks/useSettingsStorage.ts`

- Rename `tina2_*` storage keys to `tomas_*`

### 12. Update SettingsPanel references
**File:** `src/components/SettingsPanel.tsx`

- Replace any "TINA2" or "TINA" text references with "Tomas"

### Files that can be deleted (translation-only):
- `src/components/TranslationModeSelector.tsx`
- `src/components/TranslationWizard.tsx`
- `src/components/TranslationResults.tsx`
- `src/components/TranslationSegment.tsx`
- `src/components/LanguageSelector.tsx`
- `src/components/ToneSelector.tsx`
- `src/components/SourceInput.tsx`
- `src/components/StepIndicator.tsx`
- `src/services/translationService.ts`
- `src/services/ocrService.ts`
- `supabase/functions/translate-text/index.ts`
- `supabase/functions/extract-text-ocr/index.ts`
- `supabase/functions/parse-document/index.ts`

### Technical note
- Translation-related types in `src/types/translation.ts` (TranslationMode, TranslationResult, etc.) can be cleaned up but the style guide types must be preserved
- The `useLocalStorage.ts` hooks for translation history and preferences can be simplified or removed

