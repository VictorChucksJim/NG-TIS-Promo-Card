// Vercel Serverless Function: forward promo-card activity to Make.com.
// Activity remains best-effort so tracking never blocks participants.

const ALLOWED_EVENTS = new Set([
  "PROMO_PAGE_OPENED",
  "PHOTO_UPLOADED",
  "CARD_PREVIEWED",
  "CARD_GENERATED",
  "CARD_DOWNLOADED",
  "SHARE_INITIATED"
]);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "method_not_allowed" });
  }

  const { event, participant_id, event_id, timestamp } = req.body || {};
  if (!ALLOWED_EVENTS.has(event) || !participant_id) {
    return res.status(400).json({ success: false, error: "invalid_event" });
  }

  const payload = {
    event,
    participant_id: String(participant_id),
    event_id: event_id ? String(event_id) : "",
    timestamp: timestamp || new Date().toISOString()
  };

  const webhook = process.env.MAKE_ACTIVITY_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Activity forwarding failed", err);
    }
  }

  return res.status(200).json({ success: true });
};
