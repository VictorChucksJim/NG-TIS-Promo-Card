// config.js
// Loads /config/event.config.json at runtime so NICEGENE can change an
// event without touching any application code. Falls back to a small
// built-in demo config if the file can't be fetched (e.g. opened via
// file:// during local testing).

const NICEGENE_DEMO_CONFIG = {
  eventId: "TIS-002",
  eventCode: "NTIS 002",
  eventName: "NICEGENE Tech Insight Series",
  eventTheme: "Taxation vs. Investment Platforms",
  eventDate: "2026-10-11",
  eventTimeDisplay: "8:00 PM – 10:00 PM",
  registrationUrl: "https://forms.gle/REPLACE_WITH_REAL_FORM_ID",
  badgeSrc: "assets/nicegene-tis-badge.png",
  phone: "08060704412",
  website: "www.nicegeneco.com.ng",
  email: "info@nicegeneco.com.ng",
  cardWidth: 1080
};

async function loadEventConfig() {
  try {
    const res = await fetch("config/event.config.json", { cache: "no-store" });
    if (!res.ok) throw new Error("config fetch failed");
    return await res.json();
  } catch (err) {
    console.warn("[NICEGENE] Falling back to built-in demo config:", err.message);
    return NICEGENE_DEMO_CONFIG;
  }
}
