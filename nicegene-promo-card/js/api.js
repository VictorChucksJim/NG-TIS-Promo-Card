// api.js
// Every call to the outside world goes through here. Nothing in this file
// ever touches a database credential or a Make.com API key directly —
// those live only in the Pages Functions under /functions/api, server-side.

const NicegeneAPI = (() => {

  const DEMO_PARTICIPANT = {
    participant_id: "DEMO-000",
    name: "Victor",
    organisation: "NICEGENE",
    role: "Programme Coordinator"
  };

  /**
   * Verify a participant using the token from the confirmation-email link.
   * GET /api/verify?token=...
   * Returns { ok: true, participant } or { ok: false }.
   */
  async function verifyToken(token) {
    if (!token) return { ok: false, reason: "missing_token" };
    try {
      const res = await fetch(`/api/verify?token=${encodeURIComponent(token)}`);
      if (!res.ok) return { ok: false, reason: "invalid_token" };
      const data = await res.json();
      return { ok: true, participant: data.participant };
    } catch (err) {
      // No backend deployed yet (e.g. static preview) — allow a demo token
      // through so the rest of the flow can be exercised end to end.
      if (token === "demo") return { ok: true, participant: DEMO_PARTICIPANT };
      console.warn("[NICEGENE] verifyToken: backend unreachable, treating as invalid.", err.message);
      return { ok: false, reason: "network_error" };
    }
  }

  /**
   * Fallback verification with Participant ID + registered email.
   * POST /api/verify  { participantId, email }
   */
  async function verifyManual(participantId, email) {
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, email })
      });
      if (!res.ok) return { ok: false, reason: "not_found" };
      const data = await res.json();
      return { ok: true, participant: data.participant };
    } catch (err) {
      if (participantId && email) {
        console.warn("[NICEGENE] verifyManual: backend unreachable, using demo participant.", err.message);
        return { ok: true, participant: { ...DEMO_PARTICIPANT, participant_id: participantId } };
      }
      return { ok: false, reason: "network_error" };
    }
  }

  /**
   * Report an activity event. Fire-and-forget — never blocks the user's flow.
   * POST /api/activity  { event, participant_id, event_id, timestamp }
   */
  function reportActivity(eventName, participant, eventId) {
    const payload = {
      event: eventName,
      participant_id: participant?.participant_id || "unknown",
      event_id: eventId,
      timestamp: new Date().toISOString()
    };
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch((err) => {
      console.warn("[NICEGENE] activity report failed (non-blocking):", eventName, err.message);
    });
  }

  return { verifyToken, verifyManual, reportActivity };
})();
