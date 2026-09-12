# NICEGENE Participant Promo Card Generator

A small, mobile-first web app that lets a registered event participant turn
their confirmation email into a personalised "I'm Attending" card in under
two minutes: verify → upload photo → preview → generate → download/share.

The design is fixed by NICEGENE — participants cannot edit fonts, colours,
layout, or text position. Their only job is the photo.

## How it works, end to end

1. Someone registers for a NICEGENE event through the existing registration
   form. Make.com picks up that submission.
2. Make calls `POST /api/create-token` on this app with the participant's
   public details. The app stores those details against a random, opaque
   token and returns the token to Make.
3. Make sends the normal confirmation email, adding one line:
   **"Create My Promo Card"** → `https://promo.nicegene.com/?token=XYZ`.
4. The participant clicks the link. The app looks up the token
   (`GET /api/verify?token=...`), greets them by name, and skips straight to
   the photo step. If the token is missing, expired, or invalid, they fall
   back to a two-field manual check (Participant ID + registered email).
5. They upload or take a photo. The app resizes, and lets them drag/zoom to
   position it inside a circular crop.
6. The app renders the final card entirely in the browser using the HTML
   Canvas API — name, role/organisation, event details, and a real,
   scannable QR code that points at the event's registration link.
7. The participant downloads a PNG, or shares it directly through their
   phone's native share sheet.
8. Each step (`PROMO_PAGE_OPENED`, `PHOTO_UPLOADED`, `CARD_GENERATED`,
   `CARD_DOWNLOADED`, `SHARE_INITIATED`) is reported back through a small
   serverless function, which both forwards it to Make.com and keeps a
   lightweight running count NICEGENE can check any time at
   `GET /api/stats?event_id=...`.

## Why this architecture

**No build step, no framework.** The app is plain HTML/CSS/JS. There is
nothing to compile, nothing to `npm install` to run it locally, and no
framework version to keep patched. Open `index.html` in a static file
server and it works (it will fall back to a demo participant and a
built-in QR-only flow if the serverless functions aren't deployed yet —
useful for quickly checking the visual design before wiring up Make).

**Card rendering happens in the browser**, using Canvas. This means:
photos never have to leave the participant's device to be processed,
there's no image-processing server to run or pay for, and generation is
instant. This directly satisfies the "privacy by design" requirement —
the original photo is never uploaded anywhere; only the finished PNG
leaves the device, and only if the participant chooses to download or
share it.

**Three small serverless functions handle the only things that truly need
a server**: verifying a token against real participant data, recording
activity, and issuing new tokens. These run as Cloudflare Pages Functions
— no VPS, no container to patch, deployed automatically alongside the
static site from the same GitHub repo.

**Cloudflare KV** (a simple key → value store, included with Pages) holds
the token → participant lookup and the running activity counters. It's
the lightest-weight option that still keeps participant data out of the
browser and out of source control. NICEGENE's real participant database
stays in whatever system Make.com already talks to — this app only ever
holds the *public* fields (name, organisation, role) needed to build a
card, and only for the current event's KV entries (60-day expiry).

See `DEPLOYMENT.md`, `MAKE_INTEGRATION.md`, `CONFIGURATION.md`,
`DATABASE_SCHEMA.md`, `ENV_VARIABLES.md`, and `TESTING_CHECKLIST.md` for
the rest of the operational detail.

## Assumptions and risks — please confirm

- **Visual design now uses NICEGENE's real brand.** The card and app use
  the actual "NICEGENE / Tech Insight Series" logo lockup (cropped from
  your certificate template) plus the navy/cyan palette from your event
  ad creatives, in a plain, minimalist treatment (flat colour, no pills
  or gradients) per your request for something functional rather than
  decorative. If a dedicated card template gets designed later, swap the
  logic in `js/card-renderer.js` — it's isolated from the rest of the app.
- **Card height is calculated automatically from content** (see
  `CONFIGURATION.md`) rather than fixed, specifically so a longer event
  theme or a long participant name can never overlap the footer. This
  was caught and fixed during testing, along with a bug where an
  unusually long name could run off the card entirely — both are now
  covered by an automatic wrap-and-shrink step, and verified with a
  headless-canvas test harness before shipping.
- **EXIF orientation**: modern browsers (Chrome, Safari, Firefox, Edge —
  all current versions) already auto-rotate images per their EXIF data
  when drawn to `<img>`/canvas, so no extra orientation-correction library
  was added. If a specific older device is reported to render photos
  sideways, that would need a small dedicated library (e.g. `exif-js`).
  This has not been tested against actual participant phones.
  **Please confirm this hasn't been an issue in past registrations.**
- **Referral tracking (Section 11)** is intentionally *not* built into the
  MVP, per the brief, but the registration URL, QR generation, and activity
  event shapes are all structured so a `?ref=PARTICIPANT_ID` parameter can
  be added later without changing the app's architecture — see
  `MAKE_INTEGRATION.md → Future: referral tracking`.
- **The token creation endpoint currently trusts a single shared secret**
  header from Make. That's standard for a Make → webhook relationship, but
  it means the secret must be stored carefully in Make's connection
  settings, not pasted into a visible scenario field.
- **No admin dashboard is included**, matching the brief's "do not build
  this for MVP" instruction. `GET /api/stats` gives raw counts NICEGENE can
  check manually or wire into a spreadsheet later.
