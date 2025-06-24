// Entry point for the DevTools panel.
// Initializes the Svelte app, injects the backend script into the inspected page,
// and establishes a connection to the background.js for communication.

import App from "./App.svelte"
import { mount } from "svelte"

import { panelPostMessage, handleBackendToPanelMessage, devToolPanelName } from "../messaging"
import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants"

// Mount Svelte app
document.body.classList.toggle("dark", chrome.devtools.panels.themeName === "dark")
export default mount(App, { target: document.querySelector("#app") })

let lastBackendMessageAt
let currentPort = null
let isConnecting = false
let connectionAttempts = 0
let healthCheckInterval = null
let backendCheckInterval = null
const maxConnectionAttempts = 10

async function connect() {
  if (isConnecting) return

  if (connectionAttempts >= maxConnectionAttempts) {
    console.error(`Max connection attempts (${maxConnectionAttempts}) reached. Giving up.`)
    clearIntervals()
    return
  }

  isConnecting = true
  connectionAttempts++

  try {
    await injectBackendScript()
    currentPort = createConnection()
    console.log(`Connected successfully (attempt ${connectionAttempts})`)
    connectionAttempts = 0
    startHealthCheck()
  } catch (error) {
    console.warn(`Connection failed (attempt ${connectionAttempts}/${maxConnectionAttempts}):`, error)

    if (connectionAttempts < maxConnectionAttempts) {
      setTimeout(() => {
        isConnecting = false
        connect()
      }, 500)
    } else {
      console.error(`Failed to connect after ${maxConnectionAttempts} attempts`)
    }
    isConnecting = false
    return
  }

  isConnecting = false
}

function createConnection() {
  const port = chrome.runtime.connect({
    name: devToolPanelName(chrome.devtools.inspectedWindow.tabId),
  })

  port.onDisconnect.addListener(() => {
    cleanup()
  })

  port.onMessage.addListener((message) => {
    lastBackendMessageAt = Date.now()
    handleBackendToPanelMessage(message, port)
  })

  return port
}

function injectBackendScript() {
  const scriptId = "hotwire-dev-tools-backend-script"
  const scriptURL = chrome.runtime.getURL("/dist/browser_panel/page/backend.js")

  const injectionScript = `
    (function() {
      if (document.getElementById('${scriptId}')) return 'already-injected';

      const script = document.createElement('script');
      script.src = "${scriptURL}";
      script.id = "${scriptId}";
      script.async = true;

      (document.head || document.documentElement).appendChild(script);
      return 'injected';
    })()
  `

  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(injectionScript, (result, error) => {
      if (error) {
        reject(new Error(`Injection failed: ${error.description || error.message}`))
      } else {
        resolve()
      }
    })
  })
}

function reconnect() {
  if (connectionAttempts >= maxConnectionAttempts) {
    console.error("Reconnect - Max reconnection attempts reached. Stopping retries.")
    clearIntervals()
    return
  }

  cleanup()
  connectionAttempts++
  setTimeout(connect, 200)
}

function setupReconnectionHandlers() {
  chrome.devtools.network.onNavigated.addListener(() => {
    console.log("Page navigated, reconnecting...")
    cleanup()
    reconnect()
  })

  if (__IS_CHROME__) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (tabId === chrome.devtools.inspectedWindow.tabId && changeInfo.status === "complete" && !currentPort) {
        console.log("Tab reloaded, reconnecting...")
        cleanup()
        reconnect()
      }
    })
  }
}

function startHealthCheck() {
  if (!currentPort) {
    console.warn("HealthCheck - Cannot start without an established connection.")
    return
  }

  clearIntervals()

  // Send every 0.5 seconds a health check message to the backend.
  healthCheckInterval = setInterval(() => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.HEALTH_CHECK,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    })
  }, 500)

  // Check every second (plus a small buffer) if the backend is still responsive.
  backendCheckInterval = setInterval(() => {
    if (Date.now() - lastBackendMessageAt > 1100) {
      console.log("HealthCheck - Backend unresponsive, reconnecting...")
      reconnect()
    }
  }, 1100)
}

function clearIntervals() {
  clearInterval(healthCheckInterval)
  clearInterval(backendCheckInterval)
}

function cleanup() {
  clearIntervals()
  connectionAttempts = 0
  isConnecting = false

  if (currentPort) {
    currentPort.disconnect()
    currentPort = null
  }
}

setupReconnectionHandlers()
connect()
