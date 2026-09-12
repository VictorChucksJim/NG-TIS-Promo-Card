// functions/api/create-token.js
// Cloudflare Pages Function.
// Called by Make.com, once, right after a participant registers.
// Stores the participant's PUBLIC card fields against a random opaque
// token in KV, and returns that token so Make can build the personalised
// promo-card link for the confirmation email.
//
// Route: POST /api/create-token
// Auth:  header "x-make-secret" must match env.MAKE_SHARED_SECRET
//
// Request body (from Make):
// {
//   "participant_id": "NG-014",
//   "name": "Victor Chucks Jim",
//   "email": "victor@example.com",
//   "organisation": "NICEGENE",
//   "role": "Programme Coordinator",
//   "event_id": "TIS-002"
// }
//
// Response:
// { "success": true, "promo_token": "..." }

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 28);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const providedSecret = request.headers.get("x-make-secret");
  if (!env.MAKE_SHARED_SECRET || providedSecret !== env.MAKE_SHARED_SECRET) {
    return new Response(JSON.stringify({ success: false, error: "unauthorized" }), { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "invalid_json" }), { status: 400 });
  }

  const { participant_id, name, email, organisation, role, event_id } = body;
  if (!participant_id || !name || !email) {
    return new Response(JSON.stringify({ success: false, error: "missing_fields" }), { status: 400 });
  }

  const token = randomToken();

  // Only PUBLIC fields go into the record the app can read back later.
  // Email is stored too, but only ever used server-side to check the
  // manual fallback verification (participant_id + email) — it is never
  // sent to the browser via /api/verify.
  const record = {
    participant_id,
    name,
    organisation: organisation || "",
    role: role || "",
    event_id: event_id || "",
    email
  };

  await env.PROMO_KV.put(`token:${token}`, JSON.stringify(record), {
    expirationTtl: 60 * 60 * 24 * 60 // 60 days
  });
  // Secondary index for the manual fallback path (Participant ID + email).
  await env.PROMO_KV.put(`participant:${participant_id}`, JSON.stringify(record), {
    expirationTtl: 60 * 60 * 24 * 60
  });

  return new Response(JSON.stringify({ success: true, promo_token: token }), {
    headers: { "Content-Type": "application/json" }
  });
}
