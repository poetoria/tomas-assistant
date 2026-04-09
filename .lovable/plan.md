

## Plan: Fix Content Gaps scrolling and button visibility

### Problem
1. **Not all cards visible/scrollable**: The `ScrollArea` component (line 299) with `max-h-[520px]` doesn't properly recalculate when accordion items expand, causing cards and their content to be clipped.
2. **CTA buttons cut off on expand**: When a card is expanded, the response area has `max-h-[240px]` (line 355), but the outer `ScrollArea` doesn't adjust, so the action buttons below get hidden.

### Solution
Replace `ScrollArea` with a native `div` using `overflow-y-auto`, and increase the container height so expanded items fit properly.

### Changes in `src/components/StyleGuideGaps.tsx`

1. **Replace `ScrollArea` with native scrollable div** (line 299):
   - Change `<ScrollArea className="max-h-[520px] pr-2">` to `<div className="max-h-[600px] overflow-y-auto pr-2">`
   - Native `overflow-y-auto` handles dynamic content height changes (accordion expand/collapse) reliably

2. **Increase expanded response area height** (line 355):
   - Change `max-h-[240px]` to `max-h-[360px]` so longer responses don't push buttons out of view

3. **Remove unused `ScrollArea` import** if no longer needed elsewhere in the file

### Files to modify
- `src/components/StyleGuideGaps.tsx`

