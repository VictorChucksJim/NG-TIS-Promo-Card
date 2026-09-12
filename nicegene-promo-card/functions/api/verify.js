// functions/api/verify.js
// Cloudflare Pages Function.
//
// GET  /api/verify?token=...                      -> primary path
// POST /api/verify  { participantId, email }       -> fallback path
//
// In both cases the response only ever contains the participant's PUBLIC
// card fields (name, organisation, role, event_id). Email, phone, gender,
// state, and the internal participant record are never sent to the browser.

function toPublic(record) {
  return {
    participant_id: record.participant_id,
    name: record.name,
    organisation: record.organisation,
    role: record.role,
    event_id: record.event_id
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: "missing_token" }), { status: 400 });
  }

  const raw = await env.PROMO_KV.get(`token:${token}`);
  if (!raw) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_or_expired_token" }), { status: 404 });
  }

  const record = JSON.parse(raw);
  return new Response(JSON.stringify({ ok: true, participant: toPublic(record) }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), { status: 400 });
  }

  const { participantId, email } = body;
  if (!participantId || !email) {
    return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), { status: 400 });
  }

  const raw = await env.PROMO_KV.get(`participant:${participantId}`);
  if (!raw) {
    return new Response(JSON.stringify({ ok: false, error: "not_found" }), { status: 404 });
  }

  const record = JSON.parse(raw);
  if (record.email.toLowerCase().trim() !== String(email).toLowerCase().trim()) {
    return new Response(JSON.stringify({ ok: false, error: "email_mismatch" }), { status: 404 });
  }

  return new Response(JSON.stringify({ ok: true, participant: toPublic(record) }), {
    headers: { "Content-Type": "application/json" }
  });
}
