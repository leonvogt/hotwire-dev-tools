// Map of tabId -> port connections
const connections = {}

// Handle connections from devtools panel
chrome.runtime.onConnect.addListener((port) => {
  // Assign port to the correct namespace
  if (port.name === "ALPINE_DEVTOOLS_PANEL") {
    // This connection is from the devtools panel
    const devToolsListener = (message) => {
      // Extract tabId from the connection name
      const tabId = port.sender.tab ? port.sender.tab.id : port.name.split("_")[3]

      // Forward message to the content script in the inspected window
      if (tabId && connections[tabId]) {
        connections[tabId].postMessage(message)
      }
    }

    port.onMessage.addListener(devToolsListener)

    port.onDisconnect.addListener(() => {
      port.onMessage.removeListener(devToolsListener)
    })

    return
  }

  console.log("test1")

  if (port.name === "ALPINE_DEVTOOLS_PROXY") {
    console.log("test2")
    const sender = port.sender
    const tabId = sender && sender.tab ? sender.tab.id : null

    if (!tabId) {
      console.warn("Could not determine tabId for proxy connection", port)
      return
    }

    connections[tabId] = port

    const proxyListener = (message) => {
      chrome.runtime.sendMessage({
        source: "alpine-devtools-background",
        tabId: tabId,
        payload: message,
      })
    }

    port.onMessage.addListener(proxyListener)

    port.onDisconnect.addListener(() => {
      port.onMessage.removeListener(proxyListener)
      delete connections[tabId]
    })
  }
})
