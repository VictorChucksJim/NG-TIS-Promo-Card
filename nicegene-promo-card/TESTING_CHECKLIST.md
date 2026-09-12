# Testing Checklist

Run through this before pointing a real confirmation email at the app,
and again after any change to `js/card-renderer.js` or
`config/event.config.json`.

## Devices
- [ ] Android phone, Chrome
- [ ] iPhone, Safari
- [ ] iPhone, Chrome
- [ ] Desktop, Chrome
- [ ] Desktop, Safari/Edge/Firefox
- [ ] Tablet (either OS), portrait and landscape

## Photo upload
- [ ] Large photo (near 10MB) — accepted, renders correctly
- [ ] Small/low-resolution photo — accepted, doesn't look pixelated at
      final card size (consider a minimum recommended resolution note if
      quality suffers)
- [ ] Portrait-orientation photo
- [ ] Landscape-orientation photo
- [ ] Photo taken directly in-app on mobile ("Take a Photo")
- [ ] Unsupported file type (e.g. `.gif`, `.pdf`) — clear error shown, no
      crash
- [ ] File over 10MB — clear "too large" error shown
- [ ] EXIF-rotated photo (common on iPhones held sideways) — displays
      right-side-up

## Verification
- [ ] Valid token in URL → skips straight to welcome screen with correct
      name
- [ ] Missing token → falls to manual verification screen
- [ ] Expired/invalid token → falls to manual verification screen
- [ ] Manual verification with correct Participant ID + email → succeeds
- [ ] Manual verification with wrong email for a valid ID → clear error,
      no participant data leaked
- [ ] Manual verification with unknown Participant ID → clear error

## Card generation
- [ ] QR code scans correctly and opens the configured registration URL
- [ ] Name, organisation, role display correctly for a participant with
      all fields filled in
- [ ] A long event theme (3+ lines when wrapped) doesn't overlap the
      footer — caught as a real bug during build, now handled by sizing
      the card to its content automatically
- [ ] A long participant name doesn't run off the edges of the card —
      also caught during build, now handled by auto-wrap/shrink
- [ ] Participant with no organisation/role — layout doesn't leave an
      awkward gap or stray separator
- [ ] PNG downloads with a sensible filename
- [ ] PNG opens correctly outside the browser (Photos app / Files app)

## Sharing
- [ ] Native share sheet opens on a device that supports
      `navigator.share` with files
- [ ] Share button is hidden on a browser that doesn't support it
      (desktop Firefox, for example) rather than shown and failing

## Failure paths
- [ ] Turn off network mid-crop/preview — app doesn't lose the
      participant's photo or crop progress
- [ ] Simulate `/api/verify` returning a server error — invalid-token
      screen shown, not a blank page or console-only error
- [ ] Simulate `/api/activity` failing — rest of the flow continues
      unaffected (this is fire-and-forget by design)

## Activity tracking
- [ ] `PROMO_PAGE_OPENED`, `CARD_GENERATED`, `CARD_DOWNLOADED` all arrive
      at the configured Make webhook with the correct `participant_id`
      and `event_id`
- [ ] `GET /api/stats?event_id=...` counts go up as expected after a full
      run-through
