(function inject() {
  const node =
    document.getElementsByTagName("body")[0] || document.documentElement;
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = chrome.runtime.getURL("share-your-workout.js");
  script.onload = () => script.remove();
  node.appendChild(script);
})();

window.addEventListener("message", (event) => {
  if (!event.data || event.data.source !== "rythmos-extension-page") return;

  const { type, payload, requestId } = event.data;

  chrome.runtime.sendMessage({ type, payload }, (response) => {
    window.postMessage(
      {
        source: "rythmos-extension-content",
        requestId,
        response,
      },
      "*"
    );
  });
});
