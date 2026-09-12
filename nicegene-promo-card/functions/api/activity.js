// functions/api/activity.js
// Cloudflare Pages Function.
//
// POST /api/activity
// { "event": "CARD_GENERATED", "participant_id": "NG-014", "event_id": "TIS-002", "timestamp": "..." }
//
// Forwards the event to the Make.com activity webhook (so Make can update
// its own tracking fields against the participant record) and also keeps a
// simple running counter per event+type in KV, so NICEGENE can pull totals
// (see /api/stats) without waiting on Make/Sheets.

const ALLOWED_EVENTS = new Set([
  "PROMO_PAGE_OPENED",
  "PHOTO_UPLOADED",
  "CARD_PREVIEWED",
  "CARD_GENERATED",
  "CARD_DOWNLOADED",
  "SHARE_INITIATED"
]);

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "invalid_json" }), { status: 400 });
  }

  const { event, participant_id, event_id, timestamp } = body;
  if (!ALLOWED_EVENTS.has(event) || !participant_id) {
    return new Response(JSON.stringify({ success: false, error: "invalid_event" }), { status: 400 });
  }

  const payload = { event, participant_id, event_id: event_id || "", timestamp: timestamp || new Date().toISOString() };

  // Best-effort running counter, e.g. counters:TIS-002:CARD_GENERATED
  try {
    const counterKey = `counters:${payload.event_id}:${event}`;
    const current = Number((await env.PROMO_KV.get(counterKey)) || "0");
    await env.PROMO_KV.put(counterKey, String(current + 1));
  } catch (err) {
    console.warn("counter update failed", err);
  }

  // Forward to Make.com — the shared secret proves this request came from
  // our function, not a spoofed client request.
  if (env.MAKE_ACTIVITY_WEBHOOK_URL) {
    try {
      await fetch(env.MAKE_ACTIVITY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Never fail the participant's request because Make is slow/down.
      console.warn("forward to Make failed", err);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
