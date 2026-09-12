// Vercel Serverless Function: lightweight stats endpoint.
// For MVP, detailed counts remain in Make. This endpoint returns a clear
// configuration response rather than depending on Cloudflare KV.

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const eventId = req.query.event_id;
  if (!eventId) return res.status(400).json({ error: "missing_event_id" });

  return res.status(200).json({
    event_id: eventId,
    counts: null,
    source: "make",
    message: "Activity counts are maintained by the Make.com tracking workflow."
  });
};
