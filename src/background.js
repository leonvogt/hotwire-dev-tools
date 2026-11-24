// This background script is running all the time and checks for connections,
// from the browser devtools panel and the backend.
// It sets up a two-way communication channel between the devtools panel and the backend script.

import { isDevToolPanel, devToolPanelNameToTabId } from "$panel/messaging"
import { PORT_IDENTIFIERS } from "$lib/constants"

let ports = {}

const initPortsForTab = (tabId) => {
  if (!ports[tabId]) {
    ports[tabId] = {
      devtools: undefined,
      backend: undefined,
    }
  }
}
const resetPortsForTab = (tabId) => {
  ports[tabId] = {
    devtools: undefined,
    backend: undefined,
  }
}

const getActiveTab = async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return tabs[0]?.id
  } catch (error) {
    console.warn("Could not get active tab:", error)
    return null
  }
}

chrome.runtime.onConnect.addListener(async (port) => {
  let tabId

  if (isDevToolPanel(port)) {
    // When the browser devtools panel is opened, it creates a connection
    // and sends a port with the name "inspector_<tabId>".
    tabId = devToolPanelNameToTabId(port.name)

    // Safari seems to not provide a valid tabId in some cases and just sends -1.
    // In these cases, we will just use the active tab
    if (tabId === -1) {
      const activeTabId = await getActiveTab()
      if (activeTabId) {
        tabId = activeTabId
      } else {
        console.warn("Could not determine active tab ID, skipping script injection")
        return
      }
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["dist/page/proxy.js"],
      })
    } catch (error) {
      console.error(`Failed to inject script for tabId ${tabId}:`, error)
    }

    initPortsForTab(tabId)
    ports[tabId].devtools = port
  } else {
    tabId = port.sender?.tab?.id
    if (port.name !== PORT_IDENTIFIERS.PROXY) {
      console.warn("Received onConnect from ", port.name, " not initialising a devtools <-> backend, tabId: ", tabId)
      return
    }

    if (tabId) {
      // This connection is coming from backend.js
      initPortsForTab(tabId)
      ports[tabId].backend = port
    } else {
      console.warn("Sender not defined, not initialising port ", port.name)
    }
  }

  // If both devtools and backend ports are set for the tab, start double piping
  if (tabId && ports[tabId].devtools && ports[tabId].backend) {
    doublePipe(tabId, ports[tabId].devtools, ports[tabId].backend)
  }
  return
})

// For each tab, 2-way forward messages, devtools <-> backend.
function doublePipe(tabId, devtools, backend) {
  const forwardToBackend = (message) => backend.postMessage(message)
  const forwardToDevtools = (message) => devtools.postMessage(message)

  devtools.onMessage.addListener(forwardToBackend)
  backend.onMessage.addListener(forwardToDevtools)

  function shutdown() {
    devtools.onMessage.removeListener(forwardToBackend)
    backend.onMessage.removeListener(forwardToDevtools)
    devtools.disconnect()
    backend.disconnect()
    resetPortsForTab(tabId)
  }

  devtools.onDisconnect.addListener(shutdown)
  backend.onDisconnect.addListener(shutdown)
}
