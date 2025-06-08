import { isInspector, inspectorPortNameToTabId, PROXY } from "../browser_panel/ports"

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

chrome.runtime.onConnect.addListener(async (port) => {
  let tabId
  if (isInspector(port)) {
    // this is a devtools tab creating a connection
    tabId = inspectorPortNameToTabId(port.name)
    console.log(`Injecting proxy for tabId ${tabId}`)
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["dist/scripts/proxy.js"],
    })
    initPortsForTab(tabId)
    ports[tabId].devtools = port
  } else {
    tabId = port.sender?.tab?.id
    if (port.name !== PROXY) {
      console.warn("Received onConnect from ", port.name, " not initialising a devtools <-> backend, tabId: ", tabId)
      return
    }
    if (tabId) {
      // This is coming from backend.js
      initPortsForTab(tabId)
      ports[tabId].backend = port
    } else {
      console.warn("Sender not defined, not initialising port ", port.name)
    }
  }

  if (tabId && ports[tabId].devtools && ports[tabId].backend) {
    doublePipe(tabId, ports[tabId].devtools, ports[tabId].backend)
  }
  return
})

/**
 * For each tab, 2-way forward messages, devtools <-> backend.
 */
function doublePipe(tabId, devtools, backend) {
  console.log(devtools.name, backend.name)
  devtools.onMessage.addListener(lOne)
  function lOne(message) {
    if (message.event === "log") {
      return console.log(`tab ${tabId}`, message.payload)
    }
    console.log("devtools -> backend", message)
    backend.postMessage(message)
  }
  backend.onMessage.addListener(lTwo)
  function lTwo(message) {
    if (message.event === "log") {
      return console.log(`tab ${tabId}`, message.payload)
    }
    console.log(`${tabId} backend -> devtools`, message)
    devtools.postMessage(message)
  }
  function shutdown() {
    console.log(`tab ${tabId} disconnected.`)
    devtools.onMessage.removeListener(lOne)
    backend.onMessage.removeListener(lTwo)
    devtools.disconnect()
    backend.disconnect()
    resetPortsForTab(tabId)
  }
  devtools.onDisconnect.addListener(shutdown)
  backend.onDisconnect.addListener(shutdown)
  console.log(`tab ${tabId} connected.`)
}
