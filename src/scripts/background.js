import { isInspector, inspectorPortNameToTabId, PROXY, CONTENT } from "../browser_panel/ports"
import { CONTENT_TO_BACKGROUND_MESSAGES } from "../lib/constants"

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
  if (port.name === CONTENT) {
    console.log("Content script requested connection")

    let disconnected = false
    const contentTabId = port.sender?.tab?.id
    function contentListener(message) {
      if (disconnected) {
        return
      }
      console.log(`(${port.name}, tabId: ${contentTabId}) -> background: `, message)
      if (message.type === CONTENT_TO_BACKGROUND_MESSAGES.ALPINE_DETECTED && message.alpineDetected && contentTabId) {
        console.log("Set icon and popup for tabId", contentTabId)

        chrome.action.setIcon({
          tabId: contentTabId,
          path: {
            16: "/images/icon-16.png",
            48: "/images/icon-48.png",
            128: "/images/icon-128.png",
          },
        })
        // chrome.action.setPopup({
        //   tabId: contentTabId,
        //   popup: `popups/enabled.html`,
        // })
      }
    }
    port.onMessage.addListener(contentListener)
    port.onDisconnect.addListener(() => {
      disconnected = true
      port.onMessage.removeListener(contentListener)
      port.disconnect()
    })
  }
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
