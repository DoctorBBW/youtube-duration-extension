# YouTube Duration Memory Extension

A Google Chrome extension that helps you manage your YouTube tabs by remembering and displaying video durations in a convenient popup menu.

![Extension Screenshot](URL_TO_YOUR_SCREENSHOT)

## The Problem
Modern browsers "discard" or "put to sleep" background tabs to save memory. This makes it impossible to know the duration of a video on an inactive tab without clicking on it, leading to tab chaos when managing multiple videos of various lengths.

## The Solution
This extension solves the problem by providing a "mission control" panel for your YouTube tabs. It uses a hybrid approach:

1.  **Smart Memory:** The extension remembers the data (duration and title) of videos you have visited and stores it locally on your computer.
2.  **Convenient Menu:** Clicking the extension icon opens a list of all your YouTube tabs. For "known" videos, the duration is displayed instantly, even if the tab is sleeping.
3.  **On-Demand Refresh:** A "Refresh" button scans all **active (non-sleeping)** tabs to fetch and save their video duration data in one go.
4.  **Multi-language UI:** The interface supports English, Ukrainian, and Russian with an in-app switcher to provide a native experience for more users.

## Key Features
- Displays a complete list of all open YouTube tabs.
- Saves video durations and titles to local storage for persistence.
- "Live" updates the list in the popup after scanning active tabs.
- Automatically clears stored data for tabs that have been closed.
- User-friendly interface with an on-the-fly language switcher.

## Tech Stack
- HTML5, CSS3, JavaScript (ES6+ `async/await`)
- Chrome Extension Manifest V3
- Chrome APIs: `tabs`, `scripting`, `storage`, `i18n`

## Installation

1.  **From the Chrome Web Store:**
    *(Link to be added here upon publication)*

2.  **For Development:**
    - Clone the repository.
    - Navigate to `chrome://extensions` in your browser.
    - Enable "Developer mode".
    - Click "Load unpacked" and select the project directory.