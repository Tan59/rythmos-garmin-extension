(function () {
  const RYTHMOS_MESSAGE_SOURCE = "rythmos-extension-page";

  function getCsrf() {
    return (
      document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content") || null
    );
  }

  function getWorkoutId() {
    const m = location.href.match(/\/workout\/(\d+)/);
    return m ? m[1] : null;
  }

  function postToExtension(type, payload) {
    const requestId = Math.random().toString(36).slice(2, 9);
    window.postMessage(
      { source: RYTHMOS_MESSAGE_SOURCE, type, payload, requestId },
      "*"
    );
    return requestId;
  }

  function createButton(label) {
    const btn = document.createElement("button");
    btn.id = "rythmos-export-btn";
    btn.textContent = label;
    btn.style.padding = "8px 12px";
    btn.style.background = "#FF8F3D";
    btn.style.color = "#40554C";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    btn.title = "Exporter cet entraînement vers Rythmos";
    return btn;
  }

  async function fetchWorkoutJson(id) {
    const csrf = getCsrf();
    if (!csrf) throw new Error("CSRF token manquant");

    const url = `https://connect.garmin.com/gc-api/workout-service/workout/${id}?includeAudioNotes=true&_=${Date.now()}`;

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": navigator.language || "en-US",
        "cache-control": "no-cache",
        "connect-csrf-token": csrf,
        "x-requested-with": "XMLHttpRequest",
      },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error("Garmin API error " + res.status + " " + t.slice(0, 200));
    }

    return await res.json();
  }

  async function exportHandler() {
    const id = getWorkoutId();
    if (!id) return alert("Workout non détecté");

    try {
      const workout = await fetchWorkoutJson(id);
      postToExtension("EXPORT_WORKOUT", { workout, workoutId: id });
      alert("Export en cours vers Rythmos…");
    } catch (err) {
      console.error(err);
      alert("Erreur récupération workout : " + err.message);
    }
  }

  function isRunningWorkoutUrl(url) {
    const match = url.match(
      /https:\/\/connect\.garmin\.com\/modern\/workout\/\d+/
    );
    const isRunning = url.includes("workoutType=running");
    return match && isRunning;
  }

  function tryInjectButton() {
    const currentUrl = location.href;

    if (!isRunningWorkoutUrl(currentUrl)) {
      return;
    }

    if (document.getElementById("rythmos-export-btn")) return;

    const leftBtn = document.querySelector("#headerLeftBtn");
    const rightBtn = document.querySelector("#headerBtnRightState-readonly");

    if (!leftBtn || !rightBtn) {
      return;
    }

    const parent = leftBtn.parentNode;
    if (!parent) {
      return;
    }

    const rythmosDiv = document.createElement("div");
    rythmosDiv.id = "headerBtnRythmos";
    rythmosDiv.style.display = "flex";
    rythmosDiv.style.alignItems = "center";

    const btn = createButton("Exporter vers Rythmos");
    btn.addEventListener("click", exportHandler);

    btn.classList.add(
      "Button_btn__g8LLk",
      "Button_primary__7zt4j",
      "Button_medium__IVWez"
    );

    rythmosDiv.appendChild(btn);

    parent.insertBefore(rythmosDiv, rightBtn.nextSibling);

    console.log("✅ Bouton Rythmos");
  }

  // --- Amélioration de la détection de navigation SPA ---
  (function observeUrlChanges() {
    let lastUrl = location.href;

    const _wr = function (type) {
      const orig = history[type];
      return function () {
        const rv = orig.apply(this, arguments);
        const event = new Event(type);
        window.dispatchEvent(event);
        return rv;
      };
    };

    history.pushState = _wr("pushState");
    history.replaceState = _wr("replaceState");

    function checkUrlChange() {
      const newUrl = location.href;
      if (newUrl !== lastUrl) {
        lastUrl = newUrl;
        if (/\/modern\/workout\/\d+/.test(newUrl)) {
          setTimeout(tryInjectButton, 500);
        }
      }
    }

    window.addEventListener("pushState", checkUrlChange);
    window.addEventListener("replaceState", checkUrlChange);
    window.addEventListener("popstate", checkUrlChange);
  })();

  const observer = new MutationObserver(() => {
    if (/\/modern\/workout\/\d+/.test(location.href)) tryInjectButton();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(tryInjectButton, 1000);

  // Gestion du retour depuis le background
  window.addEventListener("message", (ev) => {
    if (!ev.data || ev.data.source !== "rythmos-extension-content") return;
    const { response } = ev.data;

    if (response && response.success) {
      alert("✅ Entraînement importé dans Rythmos !");
    } else {
      alert("❌ Erreur import Rythmos: " + (response?.error || "unknown"));
    }
  });
})();
