# Make.com Integration Guide

Two directions of traffic: **Make → App** (create a token after
registration) and **App → Make** (report participant activity).

---

## 1. Make → App: create a promo token

**When:** immediately after a new registration is processed by your
existing Make scenario, before sending the confirmation email.

| | |
| --- | --- |
| **Endpoint** | `POST https://promo.nicegene.com/api/create-token` |
| **Auth** | Header `x-make-secret: <MAKE_SHARED_SECRET>` |
| **Content-Type** | `application/json` |

**Request body:**
```json
{
  "participant_id": "NG-014",
  "name": "Victor Chucks Jim",
  "email": "victor@example.com",
  "organisation": "NICEGENE",
  "role": "Programme Coordinator",
  "event_id": "TIS-002"
}
```

**Success response (200):**
```json
{ "success": true, "promo_token": "aZ3f9kLp2QmR8vTn0" }
```

**Error responses:**
- `401` — `x-make-secret` missing or wrong.
- `400` — one of `participant_id`, `name`, `email` missing.

**Build the email link:**
```
https://promo.nicegene.com/?token={{promo_token}}
```
Add this as a secondary CTA — "Create My Promo Card" — in the existing
confirmation email template.

---

## 2. App → Make: activity events

The app reports activity as it happens. Configure a Make **webhook**
scenario, copy its URL into the `MAKE_ACTIVITY_WEBHOOK_URL` environment
variable (see `ENV_VARIABLES.md`), and the app's `/api/activity` function
forwards every event there automatically — you don't call anything from
Make's side for this.

**Payload shape** (identical for every event type):
```json
{
  "event": "CARD_GENERATED",
  "participant_id": "NG-014",
  "event_id": "TIS-002",
  "timestamp": "2026-10-11T20:14:03.000Z"
}
```

**Possible `event` values:**
| Event | Fires when |
| --- | --- |
| `PROMO_PAGE_OPENED` | Participant successfully verified (token or manual) |
| `PHOTO_UPLOADED` | Participant's photo is accepted |
| `CARD_PREVIEWED` | Participant confirms their crop and reaches the preview screen |
| `CARD_GENERATED` | Final card is rendered |
| `CARD_DOWNLOADED` | Participant taps "Download Card" |
| `SHARE_INITIATED` | Participant taps "Share Card" and the native share sheet opens |

**In Make**, use this webhook trigger to, for example, update a row in
your participant tracker (matched on `participant_id`) with a checkbox or
timestamp per event — mirroring the fields listed in
`DATABASE_SCHEMA.md → PROMO_ACTIVITY`.

---

## 3. Reading back simple counts

If you'd rather pull counts on demand than build them from the webhook
history in Make/Sheets:

```
GET https://promo.nicegene.com/api/stats?event_id=TIS-002
```
```json
{
  "event_id": "TIS-002",
  "counts": {
    "PROMO_PAGE_OPENED": 158,
    "PHOTO_UPLOADED": 90,
    "CARD_PREVIEWED": 81,
    "CARD_GENERATED": 73,
    "CARD_DOWNLOADED": 68,
    "SHARE_INITIATED": 41
  }
}
```
This endpoint has no PII in its response, but is not meant to be linked
publicly — treat the URL as semi-private, or add an auth header check
before pointing a public dashboard at it.

---

## Future: referral tracking (not built for MVP)

When you're ready to attribute registrations to a specific participant's
share:
1. Add a `referral_code` field when creating the token (e.g. the
   participant_id itself, or a short separate code).
2. Store it in the KV record alongside the existing fields.
3. Have `card-renderer.js` build the QR value as
   `{{registrationUrl}}?ref={{referral_code}}` instead of the bare URL.
4. On your registration form's Make scenario, read the `ref` query
   parameter (Google Forms passes prefill/query params through if the
   form is embedded, or use a lightweight redirect page if not) and write
   it to a `REFERRAL` record.

No changes to the app's data model or hosting are needed to add this —
it's additive.
