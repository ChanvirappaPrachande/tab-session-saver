/**
 * Manages the popup UI for the extension, allowing users to track,
 * manage, and navigate their saved scroll history and visited pages.
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

// Stores the domain of the currently active tab
let activeDomain = null;

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializePopup();
});

// Toggles the domain management view
manageSitesBtn.addEventListener("click", () => {
  if (manageView.style.display === "none" || !manageView.style.display) {
    manageView.style.display = "block";
    iconsView.style.display = "none";
    activeHistoryContainer.style.display = "none"; // Hide active site's history if open
    loadManageList();
  } else {
    manageView.style.display = "none";
    iconsView.style.display = "flex";
  }
});

// Displays the history of pages visited for the active domain
openHistoryBtn.addEventListener("click", () => {
  if (!activeDomain) return;

  chrome.storage.local.get(["domainRoutes"], (res) => {
    const domainRoutes = res.domainRoutes || {};
    let routes = domainRoutes[activeDomain] || [];

    activeHistoryList.innerHTML = ""; // Clear old list

    // Sort the routes by timestamp DESC (newest first)
    routes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Populate history list with up to 20 pages
    routes.slice(0, 20).forEach((route) => {
      const li = document.createElement("li");
      const link = document.createElement("a");

      // Format timestamp
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

      // Show "time : title"
      link.href = route.url;
      link.textContent = `${formattedDate} : ${route.title}`;
      link.target = "_blank"; // Open in a new tab

      li.appendChild(link);
      activeHistoryList.appendChild(li);
    });

    // Show message if empty
    if (routes.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No pages recorded for this site.";
      activeHistoryList.appendChild(li);
    }

    // Toggle history container visibility
    activeHistoryContainer.style.display = 
      activeHistoryContainer.style.display === "none" ? "block" : "none";
  });
});

/**
 * Initializes the popup by retrieving the active tab's domain and setting up UI elements.
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
 * Extracts the domain from a given URL if it's an HTTP/HTTPS link.
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
 * Adds a domain to the list of tracked websites.
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
 * Loads tracked websites as clickable icons in the popup.
 * Clicking an icon opens the *newest* visited page for that domain.
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
        // Sort descending so [0] is newest
        routes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        if (routes.length > 0) {
          const newestRoute = routes[0];
          chrome.tabs.create({ url: newestRoute.url });
        } else {
          chrome.tabs.create({ url: `https://${domain}` });
        }
      });

      iconItem.appendChild(iconImg);
      iconsView.appendChild(iconItem);
    });
  });
}

/**
 * Loads the list of tracked domains for management purposes,
 * allowing the user to remove them.
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

      // Delete button for removing the domain
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
 * Removes a domain from the tracked websites list and deletes associated scroll data.
 */
function removeDomain(domain) {
  chrome.storage.local.get(["trackedWebsites", "domainRoutes", "scrollData"], (res) => {
    let { trackedWebsites, domainRoutes, scrollData } = res;
    trackedWebsites = trackedWebsites || [];
    domainRoutes = domainRoutes || {};
    scrollData = scrollData || {};

    trackedWebsites = trackedWebsites.filter((d) => d !== domain);
    delete domainRoutes[domain];

    // Remove scroll data for pages within this domain
    for (const url in scrollData) {
      try {
        const { hostname } = new URL(url);
        if (hostname === domain) {
          delete scrollData[url];
        }
      } catch (err) {
        // Skip invalid URLs
      }
    }

    chrome.storage.local.set(
      {
        trackedWebsites,
        domainRoutes,
        scrollData,
      },
      () => {
        loadManageList();
        loadIconsView();
      }
    );
  });
}
