# Data Model

The app itself only ever stores what it needs in Cloudflare KV (a simple
key → value store, not a relational database) — it is not a replacement
for NICEGENE's participant database, which stays wherever Make.com already
reads it from.

## KV keys actually used

| Key pattern | Value | Set by | Read by | Expiry |
| --- | --- | --- | --- | --- |
| `token:{token}` | `{ participant_id, name, organisation, role, event_id, email }` | `create-token.js` | `verify.js` (GET, token path) | 60 days |
| `participant:{participant_id}` | same shape, secondary index | `create-token.js` | `verify.js` (POST, manual fallback path) | 60 days |
| `counters:{event_id}:{EVENT_TYPE}` | plain integer string | `activity.js` | `stats.js` | none (cleared manually per event if desired) |

## Conceptual entities (for future growth beyond KV)

If NICEGENE later wants a proper relational store (e.g. moving off KV into
Supabase/Postgres for richer reporting), the entities below map directly
onto what's already here:

**EVENT**
`event_id, name, theme, date, time, registration_url, template_id`

**PARTICIPANT** *(NICEGENE's existing registration database — not owned by
this app)*
`participant_id, name, email, organisation, role, event_id, phone, gender,
state, occupation, referral_source, attendance_reason,
communication_preference`
→ Only `participant_id, name, organisation, role, event_id` are ever
copied into this app's storage; everything else stays in the source
system.

**PROMO_TOKEN**
`token, participant_id, event_id, created_at, expires_at, status`

**PROMO_ACTIVITY**
`activity_id, participant_id, event_id, activity_type, timestamp`
→ `activity_type` ∈ `{PROMO_PAGE_OPENED, PHOTO_UPLOADED, CARD_PREVIEWED,
CARD_GENERATED, CARD_DOWNLOADED, SHARE_INITIATED}`

**REFERRAL** *(not built for MVP — see MAKE_INTEGRATION.md → Future)*
`referral_code, participant_id, event_id, clicks, registrations_attributed`

## What is never stored by this app

Email address is stored in KV only long enough to check the manual
fallback (Participant ID + email match) — it is never returned to the
browser and never appears on the rendered card. Phone number, gender,
state, occupation, reason for attending, and communication preference are
never sent to this app at all; `create-token.js` only accepts the five
fields listed above, so there's nothing for it to leak even by mistake.
Uploaded photographs are processed entirely in the participant's browser
and are never uploaded to any server — only the participant's own
downloaded/shared PNG ever leaves their device.
