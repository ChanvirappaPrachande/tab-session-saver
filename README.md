# tab-session-saver

This extension automatically saves and restores your scroll position on tracked websites. It also stores the titles (from the `<title>` tag) of up to 20 recently visited pages per domain, allowing you to review or manage those pages in the popup.

## Features

1. **Automatic Scroll Saving**  
   - Saves the scroll position of each page every 300 seconds.(change it accordingly)  
   - Restores the scroll position when you revisit the same page.

2. **Page Title Storage**  
   - Captures the `<title>` of each visited page 
   - Maintains an array of up to 20 pages per tracked domain.  (use it to resume at some point you want)
   - Shows these titles in the popup’s “This Site” section.

3. **Manage Domains**  
   - Toggle a “Manage Sites” list where you can remove domains from tracking. (Delete unused sites.) 
   - Add the current active domain with one click in the popup (“Add Current Website”).

4. **Icons View**  
   - Displays each tracked domain as a favicon. Clicking an icon opens the latest visited page for that domain in a new tab.

## How It Works

1. **Tracking Domains**  
   - When you are on a webpage with a valid `http` or `https` protocol, click **“Add Current Website”** in the popup to track its domain.  
   - Any subsequent pages you visit on that domain are recorded in the extension’s local storage, along with their titles.

2. **Scroll Management**  
   - The extension (via a content script) periodically saves the current page’s scroll position in `chrome.storage.local`.  
   - When you reopen the page, it automatically scrolls you back to where you left off.

3. **Viewing Title History**  
   - In the popup, click **“This Site (Open with History)”** to see a list of page titles recorded for the **active** domain.  
   - You can show or hide this list at will; it does not force navigation or add anything to the global browser history.

4. **Managing Tracked Domains**  
   - Click **“Manage Sites”** in the popup to see all tracked domains.  
   - Each domain can be removed via a **“Delete”** button, which also clears any saved titles and scroll positions.

## Installation

1. **Clone or Download** this repository.  
2. **Open** [chrome://extensions](chrome://extensions/) (or brave://extensions/) in your browser.  
3. Enable **Developer Mode** (top-right corner).  
4. Click **Load Unpacked** and select the folder containing this extension.  
5. The extension icon should appear in your browser’s toolbar.

## File Structure

```
Tab-Session-Saver-extension/
├─ manifest.json
├─ service-worker.js      // Optional, if used to track tab updates
├─ content.js             // Main content script: saves scroll + captures titles
├─ popup.html             // Popup UI
├─ popup.js               // Popup logic: icons view, manage sites, show titles
├─ icons/
│   ├─ icon16.png
│   ├─ icon48.png
│   └─ icon128.png
└─ README.md
```

## Permissions

- **`storage`**: Used to save scroll data, page titles, and tracked domains locally.  
- **`tabs`**: Needed to query the active tab and open new tabs from the popup.  
- **`<all_urls>`** in `host_permissions`: Allows the content script to run on all pages (or you can narrow it to specific domains if desired).

## Contributing

Feel free to **open issues** or **submit pull requests** for any improvements or bug fixes. All contributions are welcome.



---
