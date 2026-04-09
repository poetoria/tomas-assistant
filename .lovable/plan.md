

## Plan: Extend Tomas with settings reliability, floating assistant, and live URL syncing

### Problem diagnosis

**Missing custom instructions**: The `global_settings` table is completely empty — no "default" row exists. This happened during the project remix (fresh database). The `syncToCloud` function uses `.update()` which silently does nothing when no row exists. This means every save attempt has been failing silently.

---

### 1. Fix settings persistence and add save indicator

**Root cause fix**: Change `syncToCloud` from `.update()` to `.upsert()` so it creates the row if missing.

**Files changed:**
- `src/hooks/useSettingsStorage.ts` — Replace `.update(...).eq('id', 'default')` with `.upsert({ id: 'default', ... })` in both `syncToCloud` and `clearSettings`. Also seed the "default" row on first load if it doesn't exist.

**Add save button and status indicator:**
- `src/components/SettingsPanel.tsx` — Add a visible "Save" button at the top of the settings panel that triggers an immediate sync (not debounced). Show sync status: "Saving...", "Saved", or "Unsaved changes". Expose `isSyncing` from the hook. Add a `lastSavedAt` timestamp display.

**Basic versioning / recovery:**
- Before each save, store the previous settings snapshot in localStorage under `tomas_settings_backup`. Add a "Restore last saved" option in the settings header that loads from this backup. Simple but effective against accidental overwrites.

**Database**: Insert the default row to bootstrap the table.

---

### 2. Floating "Ask Tomas" assistant widget

**New component**: `src/components/FloatingAssistant.tsx`

- A small circular button fixed at bottom-right (`fixed bottom-6 right-6 z-50`)
- Shows the Sparkles icon; clicking opens a compact chat panel (350px wide, 500px tall)
- The panel contains a simplified version of the StyleGuideChat: input field, message list, send button
- Minimise button collapses back to the icon
- Only visible when NOT on the welcome screen or already in the full chat view
- Reuses the same edge function (`style-guide-chat`) and settings context
- Conversations in the floating widget are ephemeral (not saved to history) to keep it lightweight

**Files changed:**
- `src/components/FloatingAssistant.tsx` — New component
- `src/pages/Index.tsx` — Render `<FloatingAssistant />` when view is not 'welcome' and not 'style-guide' (or always, with smart visibility)
- `src/services/styleGuideService.ts` — Reuse existing chat service

---

### 3. Live style guide syncing from URL

**Approach**: Use a Firecrawl-like scrape via a new edge function to fetch and extract text from a URL.

**New edge function**: `supabase/functions/fetch-style-guide-url/index.ts`
- Accepts a URL, fetches the page content, extracts text (markdown format)
- Returns extracted text to the client
- Includes rate limiting and error handling

**Database change**: Add columns to `global_settings`:
- `style_guide_urls` (jsonb) — Array of `{ id, url, lastSyncedAt, status, error? }`

**Settings UI changes** (`src/components/SettingsPanel.tsx`):
- In the "Style guide" tab, add a section below file uploads: "Live documents"
- Input field to add a URL + "Add" button
- List of added URLs showing: URL, last synced time, sync status, and actions (sync now, remove)
- "Sync now" button per URL that fetches content and stores it as a `StyleGuideDocument`
- Auto-sync: On app load, if any URL hasn't been synced in 24 hours, trigger a background refresh

**Client service** (`src/services/styleGuideUrlService.ts`):
- `fetchStyleGuideFromUrl(url: string): Promise<string>` — calls the edge function
- Handles errors gracefully with user-facing messages

**Files changed:**
- `supabase/functions/fetch-style-guide-url/index.ts` — New edge function
- `src/hooks/useSettingsStorage.ts` — Handle `style_guide_urls` field, auto-sync logic
- `src/components/SettingsPanel.tsx` — URL input UI in style guide tab
- `src/types/translation.ts` — Add `StyleGuideUrl` type
- Database migration — Add `style_guide_urls` column

---

### Technical details

| Change | File(s) |
|--------|---------|
| Fix upsert + seed default row | `useSettingsStorage.ts`, DB migration |
| Save button + status | `SettingsPanel.tsx`, `useSettingsStorage.ts` |
| Settings backup/restore | `useSettingsStorage.ts`, `SettingsPanel.tsx` |
| Floating assistant | New `FloatingAssistant.tsx`, `Index.tsx` |
| URL sync edge function | New `fetch-style-guide-url/index.ts` |
| URL sync UI | `SettingsPanel.tsx`, `useSettingsStorage.ts` |
| New types | `translation.ts` |
| DB migration | Add `style_guide_urls` jsonb column |

