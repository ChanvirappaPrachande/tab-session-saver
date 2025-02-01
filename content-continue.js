/**
 * content-continue.js
 * 
 * Shows a "continue where you left off" prompt for tracked domains,
 * unless the URL has a skipPrompt parameter (?skipPrompt=1).
 */

/**
 * Utility function: extracts domain from URL if http/https.
 */
function getDomainFromUrl(urlString) {
  try {
    const urlObj = new URL(urlString);
    if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
      return urlObj.hostname;
    }
  } catch (err) {}
  return null;
}

window.addEventListener("load", () => {
  maybePromptForContinue();
});

function maybePromptForContinue() {
  const currentUrl = new URL(window.location.href);

  // If the user arrived with skipPrompt=1, skip the confirm logic
  if (currentUrl.searchParams.has("skipPrompt")) {
    console.log("Skipping prompt because skipPrompt=1 is present.");
    return;
  }

  const domain = getDomainFromUrl(currentUrl.href);
  if (!domain) return;

  chrome.storage.local.get(["trackedWebsites", "domainRoutes"], (res) => {
    const trackedWebsites = res.trackedWebsites || [];
    let domainRoutes = res.domainRoutes || {};

    // If domain not tracked, do nothing
    if (!trackedWebsites.includes(domain)) return;

    const routes = domainRoutes[domain] || [];
    // Sort so [0] is newest
    routes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Checking the second route [1] if your logic specifically wants that,
    // otherwise normally you'd check [0].
    const newest = routes[1];

    if (newest && newest.url !== currentUrl.href) {
      // Show prompt
      const proceed = confirm(
        `Last time you left off on:\n${newest.title}\n\nClick OK to continue from there, or Cancel to treat this page as your new last route.`
      );

      if (proceed) {
        // Append ?skipPrompt=1 so we don't prompt again
        let redirectUrl = new URL(newest.url);
        redirectUrl.searchParams.set("skipPrompt", "1");
        window.location.href = redirectUrl.toString();
      } else {
        addOrUpdateRoute(domainRoutes, domain, currentUrl.href, document.title);
      }
    } else {
      addOrUpdateRoute(domainRoutes, domain, currentUrl.href, document.title);
    }
  });
}

function addOrUpdateRoute(domainRoutes, domain, url, title) {
  if (!Array.isArray(domainRoutes[domain])) {
    domainRoutes[domain] = [];
  }
  let routes = domainRoutes[domain];

  // Check if this page is already in the array
  const existing = routes.find((r) => r.url === url);
  if (existing) {
    existing.title = title || existing.title;
    existing.timestamp = Date.now();
  } else {
    routes.push({
      url,
      title: title || "Untitled",
      timestamp: Date.now()
    });
  }

  // Sort descending
  routes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  // Keep only top 20
  routes = routes.slice(0, 20);

  domainRoutes[domain] = routes;
  chrome.storage.local.set({ domainRoutes });
}
