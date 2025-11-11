// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "EXPORT_WORKOUT") return;

  (async () => {
    const { workout, workoutId } = message.payload;
    const RYTHMOS_API = "https://rythmos.run/api/garmin/workouts/share";

    try {
      const date = new Date().toISOString();

      const body = JSON.stringify({
        provenanceKey: "jsonText",
        workoutJson: workout,
        workoutId: Number(workoutId),
        date,
      });

      const res = await fetch(RYTHMOS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      console.log("[Rythmos background] Réponse brute:", res);

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        sendResponse({
          success: false,
          error: `Rythmos API ${res.status}: ${txt.slice(0, 200)}`,
        });
        return;
      }

      const data = await res.json().catch(() => ({}));
      console.log("[Rythmos background] Réponse JSON:", data);

      const url = data.url.split("/share/")[1];

      if (data && data.url) {
        chrome.tabs.create({
          url: `https://rythmos.run/share/${url}`,
        });
      }

      sendResponse({ success: true, data });
    } catch (err) {
      console.error("[Rythmos background] Erreur:", err);
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true;
});
