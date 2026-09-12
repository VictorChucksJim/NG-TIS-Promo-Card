// Vercel Serverless Function: participant verification
// Supports the promo-link token flow and manual Participant ID + email fallback.
// Token records are self-contained and HMAC-signed, so no Cloudflare KV is required.

const crypto = require("crypto");

const DEMO_PARTICIPANT = {
  participant_id: "DEMO-000",
  name: "Victor",
  organisation: "NICEGENE",
  role: "Programme Coordinator",
  event_id: "TIS-002"
};

function publicParticipant(record) {
  return {
    participant_id: record.participant_id,
    name: record.name,
    organisation: record.organisation || "",
    role: record.role || "",
    event_id: record.event_id || ""
  };
}

function verifySignedToken(token) {
  const secret = process.env.PROMO_TOKEN_SECRET;
  if (!secret) throw new Error("PROMO_TOKEN_SECRET is not configured");

  const parts = String(token).split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const record = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!record || !record.participant_id || !record.name) return null;
    if (record.exp && Date.now() > Number(record.exp)) return null;
    return record;
  } catch {
    return null;
  }
}

function send(res, status, body) {
  return res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    const token = req.query.token;
    if (!token) return send(res, 400, { ok: false, error: "missing_token" });

    // Development/test pathway only. Remove before public production launch.
    if (token === "demo") return send(res, 200, { ok: true, participant: DEMO_PARTICIPANT });

    const record = verifySignedToken(token);
    if (!record) return send(res, 404, { ok: false, error: "invalid_or_expired_token" });

    return send(res, 200, { ok: true, participant: publicParticipant(record) });
  }

  if (req.method === "POST") {
    const { participantId, email } = req.body || {};
    if (!participantId || !email) return send(res, 400, { ok: false, error: "missing_fields" });

    // Manual verification is intentionally delegated to Make, where the
    // registration data already lives. Set MAKE_VERIFY_WEBHOOK_URL to a
    // Make webhook that accepts participantId + email and returns the
    // public participant fields.
    const webhook = process.env.MAKE_VERIFY_WEBHOOK_URL;
    if (!webhook) return send(res, 503, { ok: false, error: "manual_verification_not_configured" });

    try {
      const upstream = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, email })
      });
      if (!upstream.ok) return send(res, 404, { ok: false, error: "not_found" });
      const data = await upstream.json();
      if (!data || !data.participant) return send(res, 404, { ok: false, error: "not_found" });
      return send(res, 200, { ok: true, participant: publicParticipant(data.participant) });
    } catch (err) {
      console.error("Manual verification failed", err);
      return send(res, 502, { ok: false, error: "verification_service_unavailable" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return send(res, 405, { ok: false, error: "method_not_allowed" });
};
