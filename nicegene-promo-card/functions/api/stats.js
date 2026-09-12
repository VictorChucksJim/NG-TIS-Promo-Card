// functions/api/stats.js
// GET /api/stats?event_id=TIS-002
// Returns the running counters written by /api/activity. Intentionally
// unauthenticated-light for MVP (no PII returned) — add a shared-secret
// header check here before pointing this at a public dashboard.

const EVENTS = ["PROMO_PAGE_OPENED", "PHOTO_UPLOADED", "CARD_PREVIEWED", "CARD_GENERATED", "CARD_DOWNLOADED", "SHARE_INITIATED"];

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const eventId = url.searchParams.get("event_id");
  if (!eventId) {
    return new Response(JSON.stringify({ error: "missing_event_id" }), { status: 400 });
  }

  const counts = {};
  for (const evt of EVENTS) {
    counts[evt] = Number((await env.PROMO_KV.get(`counters:${eventId}:${evt}`)) || "0");
  }

  return new Response(JSON.stringify({ event_id: eventId, counts }), {
    headers: { "Content-Type": "application/json" }
  });
}
