// Vercel Serverless Function: create a signed promo token for Make.com.
// No participant database is required here; the token carries the minimal
// participant fields needed by the browser and is protected by HMAC.

const crypto = require("crypto");

function send(res, status, body) {
  return res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { success: false, error: "method_not_allowed" });
  }

  const makeSecret = process.env.MAKE_SHARED_SECRET;
  const providedSecret = req.headers["x-make-secret"];
  if (!makeSecret || providedSecret !== makeSecret) {
    return send(res, 401, { success: false, error: "unauthorized" });
  }

  const tokenSecret = process.env.PROMO_TOKEN_SECRET;
  if (!tokenSecret) {
    return send(res, 500, { success: false, error: "PROMO_TOKEN_SECRET_not_configured" });
  }

  const { participant_id, name, email, organisation, role, event_id } = req.body || {};
  if (!participant_id || !name || !email) {
    return send(res, 400, { success: false, error: "missing_fields" });
  }

  const record = {
    participant_id: String(participant_id),
    name: String(name),
    organisation: organisation ? String(organisation) : "",
    role: role ? String(role) : "",
    event_id: event_id ? String(event_id) : "",
    email: String(email).trim().toLowerCase(),
    exp: Date.now() + 60 * 24 * 60 * 60 * 1000
  };

  const payload = Buffer.from(JSON.stringify(record), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", tokenSecret).update(payload).digest("base64url");
  const token = `${payload}.${signature}`;

  return send(res, 200, { success: true, promo_token: token });
};
