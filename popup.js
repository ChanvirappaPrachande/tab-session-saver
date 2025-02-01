/**
 * popup.js
 * 
 * Manages the popup UI: 
 * - Domain list (icons)
 * - Add current site
 * - Manage sites
 * - Open link with ?skipPrompt=1 so we don't show the confirm on next load
 */

// DOM Elements
const iconsView = document.getElementById("iconsView");
const manageView = document.getElementById("manageView");
const manageList = document.getElementById("manageList");
const manageSitesBtn = document.getElementById("manageSitesBtn");
const addCurrentSiteBtn = document.getElementById("addCurrentSiteBtn");
const openHistoryBtn = document.getElementById("openHistoryBtn");
const activeHistoryContainer = document.getElementById("activeHistoryContainer");
const activeHistoryList = document.getElementById("activeHistoryList");

// Active domain for the current tab
let activeDomain = null;

document.addEventListener("DOMContentLoaded", () => {
  initializePopup();
});

// Toggle manage sites
manageSitesBtn.addEventListener("click", () => {
  if (manageView.style.display === "none" || !manageView.style.display) {
    manageView.style.display = "block";
    iconsView.style.display = "none";
    activeHistoryContainer.style.display = "none";
    loadManageList();
  } else {
    manageView.style.display = "none";
    iconsView.style.display = "flex";
  }
});

// Display the history of pages for the active domain
openHistoryBtn.addEventListener("click", () => {
  if (!activeDomain) return;

  chrome.storage.local.get(["domainRoutes"], (res) => {
    const domainRoutes = res.domainRoutes || {};
    let routes = domainRoutes[activeDomain] || [];

    activeHistoryList.innerHTML = ""; // Clear old list

    // Sort by newest first
    routes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    routes.slice(0, 20).forEach((route) => {
      const li = document.createElement("li");
      const link = document.createElement("a");

      const timestamp = route.timestamp ? new Date(route.timestamp) : new Date();
      const formattedDate = timestamp.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      link.href = appendSkipParam(route.url); // so no prompt on next load
      link.textContent = `${formattedDate} : ${route.title}`;
      link.target = "_blank";

      li.appendChild(link);
      activeHistoryList.appendChild(li);
    });

    if (routes.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No pages recorded for this site.";
      activeHistoryList.appendChild(li);
    }

    // Toggle
    activeHistoryContainer.style.display =
      activeHistoryContainer.style.display === "none" ? "block" : "none";
  });
});

/**
 * Initialize popup: figure out active domain, set up UI
 */
function initializePopup() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs.length) {
      addCurrentSiteBtn.style.display = "none";
      openHistoryBtn.style.display = "none";
      loadIconsView();
      return;
    }

    const activeTab = tabs[0];
    activeDomain = getDomainFromUrl(activeTab.url);

    if (!activeDomain) {
      addCurrentSiteBtn.style.display = "none";
      openHistoryBtn.style.display = "none";
    } else {
      addCurrentSiteBtn.addEventListener("click", () => {
        addDomain(activeDomain);
      });
    }

    manageView.style.display = "none";
    iconsView.style.display = "flex";
    activeHistoryContainer.style.display = "none";

    loadIconsView();
  });
}

/**
 * Utility: parse domain from URL if http/https
 */
function getDomainFromUrl(urlString) {
  try {
    const urlObj = new URL(urlString);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return null;
    }
    return urlObj.hostname;
  } catch (err) {
    return null;
  }
}

/**
 * Append ?skipPrompt=1 to the URL so the content-continue script doesn't show the confirm.
 */
function appendSkipParam(urlString) {
  try {
    const urlObj = new URL(urlString);
    urlObj.searchParams.set("skipPrompt", "1");
    return urlObj.toString();
  } catch (err) {
    return urlString; // fallback
  }
}

/**
 * Add domain to tracked websites
 */
function addDomain(domain) {
  chrome.storage.local.get(["trackedWebsites"], (res) => {
    let trackedWebsites = res.trackedWebsites || [];
    if (!trackedWebsites.includes(domain)) {
      trackedWebsites.push(domain);
      chrome.storage.local.set({ trackedWebsites }, () => {
        loadIconsView();
      });
    } else {
      alert(`${domain} is already tracked.`);
    }
  });
}

/**
 * Show all tracked domains as icons. Clicking an icon opens the newest route with skipPrompt=1.
 */
function loadIconsView() {
  iconsView.innerHTML = "";

  chrome.storage.local.get(["trackedWebsites", "domainRoutes"], (res) => {
    const trackedWebsites = res.trackedWebsites || [];
    const domainRoutes = res.domainRoutes || {};

    trackedWebsites.forEach((domain) => {
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}`;

      const iconItem = document.createElement("div");
      iconItem.className = "icon-item";

      const iconImg = document.createElement("img");
      iconImg.src = faviconUrl;
      iconImg.alt = domain;

      iconItem.addEventListener("click", () => {
        let routes = domainRoutes[domain] || [];
        // Sort newest first
        routes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (routes.length > 0) {
          const newestRoute = routes[0];
          // Add skipPrompt=1 so no confirm
          const urlToOpen = appendSkipParam(newestRoute.url);
          chrome.tabs.create({ url: urlToOpen });
        } else {
          // If no route known, open domain root with skipPrompt=1
          const rootUrl = appendSkipParam(`https://${domain}`);
          chrome.tabs.create({ url: rootUrl });
        }
      });

      iconItem.appendChild(iconImg);
      iconsView.appendChild(iconItem);
    });
  });
}

/**
 * Load the list of tracked domains for management (delete).
 */
function loadManageList() {
  manageList.innerHTML = "";

  chrome.storage.local.get(["trackedWebsites"], (res) => {
    const trackedWebsites = res.trackedWebsites || [];

    trackedWebsites.forEach((domain) => {
      const li = document.createElement("li");
      const headerDiv = document.createElement("div");
      headerDiv.className = "domain-header";

      const domainSpan = document.createElement("span");
      domainSpan.textContent = domain;

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "delete-btn";
      deleteBtn.addEventListener("click", () => {
        const surety = confirm("Are you sure?");
        if (!surety) return;
        removeDomain(domain);
      });

      headerDiv.appendChild(domainSpan);
      headerDiv.appendChild(deleteBtn);
      li.appendChild(headerDiv);
      manageList.appendChild(li);
    });
  });
}

/**
 * Remove domain + scroll data from storage
 */
function removeDomain(domain) {
  chrome.storage.local.get(["trackedWebsites", "domainRoutes", "scrollData"], (res) => {
    let { trackedWebsites, domainRoutes, scrollData } = res;
    trackedWebsites = trackedWebsites || [];
    domainRoutes = domainRoutes || {};
    scrollData = scrollData || {};

    trackedWebsites = trackedWebsites.filter((d) => d !== domain);
    delete domainRoutes[domain];

    // Remove scroll data for that domain
    for (const url in scrollData) {
      try {
        const { hostname } = new URL(url);
        if (hostname === domain) {
          delete scrollData[url];
        }
      } catch (err) {
        // skip
      }
    }

    chrome.storage.local.set({
      trackedWebsites,
      domainRoutes,
      scrollData
    }, () => {
      loadManageList();
      loadIconsView();
    });
  });
}
