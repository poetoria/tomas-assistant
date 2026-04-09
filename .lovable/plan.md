

## Plan: Fix Google Docs URL syncing

### Problem
Google Docs sharing URLs (e.g. `/edit?usp=sharing`) return an HTML page containing the Google Docs viewer UI — buttons, menus, scripts. The current edge function strips HTML tags and gets ~364 characters of UI chrome text instead of the actual document content (~30,765 characters).

### Solution
**File:** `supabase/functions/fetch-style-guide-url/index.ts`

Before fetching, detect Google Docs URLs and rewrite them to the plain text export endpoint:

```
https://docs.google.com/document/d/{ID}/edit?usp=sharing
→ https://docs.google.com/document/d/{ID}/export?format=txt
```

This returns the raw document text directly, no HTML parsing needed.

### Changes

1. Add a URL transformation function that detects Google Docs patterns (`docs.google.com/document/d/`) and rewrites to `/export?format=txt`
2. Also handle Google Sheets (`/export?format=csv`) and Google Slides (`/export?format=txt`) if present
3. The document must be publicly accessible (shared via "Anyone with the link") — add a clear error message if a 401/403 is returned

### Technical detail
- Single file change: `supabase/functions/fetch-style-guide-url/index.ts`
- The export endpoint requires the document to be shared publicly (which it already is since the current fetch returns 200)
- No database or frontend changes needed

