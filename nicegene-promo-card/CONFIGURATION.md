# Configuring a New Event

Everything event-specific lives in one file: `config/event.config.json`.
Edit it, commit, push — Cloudflare Pages redeploys automatically. No other
file needs to change for a routine new event.

```json
{
  "eventId": "TIS-002",
  "eventCode": "NTIS 002",
  "eventName": "NICEGENE Tech Insight Series",
  "eventTheme": "Taxation vs. Investment Platforms",
  "eventDate": "2026-10-11",
  "eventTimeDisplay": "8:00 PM – 10:00 PM",
  "registrationUrl": "https://forms.gle/REPLACE_WITH_REAL_FORM_ID",
  "badgeSrc": "/assets/nicegene-tis-badge.png",
  "phone": "08060704412",
  "website": "www.nicegeneco.com.ng",
  "email": "info@nicegeneco.com.ng",
  "cardWidth": 1080
}
```

| Field | What it controls |
| --- | --- |
| `eventId` | Must match the `event_id` Make sends to `create-token` and `activity` — this is how tokens, counters, and Make records all line up. |
| `eventCode` | Short tag shown top-right on the card (e.g. "NTIS 002"). Expected as two words — the renderer draws the first in white and the second in cyan, matching the "NTIS / 002" treatment used in NICEGENE's own event graphics. |
| `eventName` | Used in the in-app welcome message (not printed on the card itself — the logo badge already carries the NICEGENE / Tech Insight Series identity). |
| `eventTheme` | The card's headline. Wraps automatically, and shrinks slightly if it's unusually long — no manual line-breaking needed. |
| `eventDate`, `eventTimeDisplay` | Date/time shown as a single line under the headline. `eventDate` must be `YYYY-MM-DD`. |
| `registrationUrl` | Where the QR code on every card points. |
| `badgeSrc` | Path to the logo lockup image (see "The logo asset" below). |
| `phone`, `website`, `email` | Shown in the plain contact line at the bottom of the card. |
| `cardWidth` | Fixed at 1080px for a consistent shareable shape. There is deliberately no `cardHeight` — see below. |

## Why there's no `cardHeight`

The card's **height is calculated automatically** from its content instead
of being fixed. The renderer measures the wrapped headline and the
participant's name first, then sizes the canvas to fit everything with a
consistent margin above the footer. This was a real bug caught during
testing: a fixed height meant a longer-than-expected event theme could
overlap the footer. Measuring first removes that failure mode entirely —
you can write as long or short a theme as the event needs without
touching any layout code.

## The logo asset

`assets/nicegene-tis-badge.png` is cropped directly from NICEGENE's own
certificate template (the navy "NICEGENE / TECH INSIGHT SERIES" lockup),
trimmed to remove the surrounding white margin so it sits cleanly on the
card's navy background. To swap in a different lockup (e.g. a future
rebrand), replace this file — the renderer scales whatever image is at
`badgeSrc` to a fixed 400px width and preserves its aspect ratio, so any
similarly-shaped lockup will drop in without code changes.

## Design language

The card intentionally uses plain text and flat colour rather than
pills, gradients, or drop shadows — navy background (`#0B1740`), cyan
accent (`#2FE4E4`), white/muted text, the real logo badge, and a simple
QR code. If a future event calls for a different visual treatment, the
colours are collected in the `COLORS` object at the top of
`js/card-renderer.js` (or the equivalent block in the demo file) — change
them there rather than scattering colour values through the drawing
code.

## Adding a second template

The renderer already reads every event-specific value from `config`, so a
second visual template doesn't require new app code — only a second
config file plus a small change to `js/config.js` to load the right one
(e.g. based on a `?event=` query parameter, or one deployment per event
using Cloudflare Pages' branch-preview URLs).

## Changing the public fields shown

The card currently shows name + role/organisation beneath the photo. If a
future event should omit role/organisation (e.g. a more casual event),
leave `participant.role` and `participant.organisation` empty when
creating the token (see `MAKE_INTEGRATION.md`) — the renderer already
skips that line entirely when both are blank, no code change needed.
