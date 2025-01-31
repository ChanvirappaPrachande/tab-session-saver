/**
 * Extracts the domain from a given URL.
 * @param {string} urlString - The full URL string.
 * @returns {string|null} The domain (hostname) or null if invalid.
 */
function getDomainFromUrl(urlString) {
    try {
        const urlObj = new URL(urlString);
        return urlObj.hostname;
    } catch (err) {
        return null;
    }
}



/**
 * Event: Extension installed.
 */
chrome.runtime.onInstalled.addListener(() => {
    console.log("Tab Session Saver Working.");
  });
  
  /**
   * Event: Tab updates and navigation changes.
   * Tracks up to 20 pages for each tracked domain, in descending time order.
   */
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab.url || (!changeInfo.status && !changeInfo.url) || !tab.title) {
      return;
    }
  
    chrome.storage.local.get(["trackedWebsites", "domainRoutes"], (res) => {
      const trackedWebsites = res.trackedWebsites || [];
      let domainRoutes = res.domainRoutes || {};
      const domain = getDomainFromUrl(tab.url);
  
      if (domain && trackedWebsites.includes(domain)) {
        if (!Array.isArray(domainRoutes[domain])) {
          domainRoutes[domain] = [];
        }
        let routes = domainRoutes[domain];
  
        // Is this URL already in the list?
        const existingEntry = routes.find((route) => route.url === tab.url);
  
        if (!existingEntry) {
          routes.push({
            url: tab.url,
            title: tab.title,
            timestamp: Date.now(),
          });
        } else {
          // If it already exists, update its title/timestamp (optional)
          existingEntry.title = tab.title;
          existingEntry.timestamp = Date.now();
        }
  
        // Sort DESC by timestamp => newest at index 0
        routes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
        // Keep top 20
        routes = routes.slice(0, 20);
  
        domainRoutes[domain] = routes;
        chrome.storage.local.set({ domainRoutes });
      }
    });
  });
  
