# Hotwire DevTools Architecture

This document outlines the architecture and communication flow of the extension.

Currently, the extension is two parted:

1. **Popup / Content Script**:
   This is the legacy part of the extension. In the popup you can set the features you want to enable.  
   The content script gets injected by the browser into the page and runs the selected features.

2. **DevTools Panel**:
   This is the new part of the extension. It provides a panel in the browser's DevTools.

We might still use the popup in the future, to provide a fast way to enable/disable features.  
But there are currently duplicated parts of code and state between the popup and the DevTools panel.
The goal is to align both parts and use a single source of truth for the state and features.

## Devtool Panel

![image](https://github.com/user-attachments/assets/7cb63fb0-08ee-4854-9a3a-c68a8df5f910)

### Communication Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │      │                 │
│    panel.js     │◄────►│  background.js  │◄────►│    proxy.js     │◄────►│   backend.js    │
│                 │ port │                 │ port │                 │window│                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Step-by-Step**

- The panel injects the backend script into the inspected page using `injectScript()`
- The panel connects to the background script via chrome.runtime.connect
- The background script detects this connection (using the inspector port name)
- The background script injects a proxy script
- The proxy creates a connection back to the background script
- The background script establishes a two-way communication pipe between the panel and proxy

**Messages are sent in this path:**

- Panel → Background → Proxy → Backend (page)
- Backend (page) → Proxy → Background → Panel

**Component Responsibilities**

1. **DevTools Panel**: The user interface shown in browser DevTools.

   - Built with Svelte
   - Communicates with background script via Chrome extension ports
   - Renders and updates based on events from the inspected page

2. **Background Script**: Central coordination script that runs persistently.

   - Maintains connections between DevTools panel and proxy
   - Routes messages between components
   - Handles tab and lifecycle events

3. **Proxy**: Content script injected into the page context.

   - Bridges the extension world and page world
   - Translates port-based communication to window.postMessage
   - Has access to DOM but not page JavaScript context

4. **Backend**: Script injected directly into the page's JavaScript context.
   - Hooks into Hotwire's internal APIs
   - Captures events and state from Turbo and Stimulus
   - Sends data back to the DevTools panel via the proxy
