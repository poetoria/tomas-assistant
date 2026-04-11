

## Plan: Content-type detection and suggestion controls for Compliance Checker

### Overview
Two features: (1) auto-detect content type with manual override, (2) reject actions per-issue and at section level.

### Changes

**File 1: `src/components/ComplianceChecker.tsx`**

1. **New state variables**:
   - `detectedContentType: string` — auto-classified type
   - `selectedContentType: string` — user's final choice
   - `isManualTypeOverride: boolean` — tracks if user changed it
   - `rejectedIssues: Set<string>` — tracks rejected issue IDs
   - `isDetecting: boolean` — loading state for detection

2. **Content type constants**: Array of 10 types (Marketing, Promotional offer, Safer gambling, Verification / KYC / AML, Account restriction / intervention, Transactional / service update, Help / support, Legal / terms / policy, UI microcopy, Other)

3. **Auto-detection via debounced effect**: When `content` changes and word count >= 10, call the compliance-check edge function with a lightweight classify-only mode (or do client-side keyword heuristic). To keep it simple and avoid extra edge functions, use a **client-side keyword heuristic** — map keyword clusters to content types. This runs instantly with no API call.

4. **Content type selector UI**: Below the editor, before the Check button, show:
   - "Detected content type: [Type]" with a Select dropdown to override
   - If manually changed, show "Manual selection" badge
   - Info tooltip: "This helps Tomas apply the most relevant compliance rules."

5. **Pass `contentType` to `checkCompliance`**: Send the selected type to the edge function so it can tailor its analysis.

6. **Issue actions — per issue**: Replace current Accept-only buttons with Accept | Reject | Copy. Accepted = green bg, Rejected = strikethrough/dimmed with "Rejected" label.

7. **Section-level controls**: Replace single "Accept All" with "Accept All" + "Reject All" buttons in the Issues card header.

8. **Summary update**: Show "Checked as: [content type]" in the Results Summary card. Show counts: X accepted, Y rejected, Z pending.

9. **All-rejected state**: If all issues rejected, show "No suggestions were applied."

10. **Export report update**: Include issue statuses (Accepted/Rejected/Pending) and content type.

**File 2: `src/services/styleGuideService.ts`**

- Update `checkCompliance` to accept optional `contentType` parameter and pass it in the request body.

**File 3: `supabase/functions/compliance-check/index.ts`**

- Accept `contentType` in the request body.
- Add it to the system prompt: "The user has classified this content as: [type]. Apply compliance rules most relevant to this content type."
- No other structural changes.

**File 4: `src/types/translation.ts`**

- No changes needed — existing `ComplianceIssue` already has optional `accepted` field. The `rejected` state will be tracked in component state via `rejectedIssues` Set.

### Content type detection heuristic (client-side)

Simple keyword matching — no API call needed:
- "bonus", "free spins", "deposit" → Promotional offer
- "responsible", "safer gambling", "self-exclusion", "deposit limit" → Safer gambling
- "verify", "KYC", "AML", "identity", "document" → Verification / KYC / AML
- "suspended", "restricted", "closed", "intervention" → Account restriction
- "confirm", "update", "transaction", "receipt" → Transactional
- "help", "support", "contact", "FAQ" → Help / support
- "terms", "conditions", "privacy", "policy", "legal" → Legal
- "button", "label", "placeholder", "tooltip", "CTA" → UI microcopy
- "campaign", "brand", "launch", "awareness" → Marketing
- Fallback → Other

### Files to modify
- `src/components/ComplianceChecker.tsx` — main UI changes
- `src/services/styleGuideService.ts` — pass contentType
- `supabase/functions/compliance-check/index.ts` — use contentType in prompt

