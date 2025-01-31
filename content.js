/**
 * 
 * This script is injected into web pages by the Chrome extension to track and restore 
 *  positions for specific websites. It periodically saves the scroll position 
 * and restores it when the user revisits the page.
 */

const SAVE_INTERVAL = 300000; // 300,000 ms (5 minutes)

/**
 * Saves the current scroll position of the active page to Chrome's local storage.
 * The scroll position is stored along with a timestamp for future reference.
 */
function saveScrollPosition() {
  const currentUrl = window.location.href; 
  const scrollY = window.scrollY; 

  chrome.storage.local.get(["scrollData"], (res) => {
    const scrollData = res.scrollData || {}; 

    scrollData[currentUrl] = {
      scrollY,
      timestamp: Date.now(), 
    };

    chrome.storage.local.set({ scrollData }); 
  });
}

/**
 * Restores the saved scroll position for the current page, if available in storage.
 */
function restoreScrollPosition() {
  const currentUrl = window.location.href; 

  chrome.storage.local.get(["scrollData"], (res) => {
    const scrollData = res.scrollData || {}; 
    const data = scrollData[currentUrl]; 
    if (data && typeof data.scrollY === "number") {
      window.scrollTo(0, data.scrollY);
    }
  });
}

window.addEventListener("load", () => {
  restoreScrollPosition();
  setInterval(saveScrollPosition, SAVE_INTERVAL);
});
