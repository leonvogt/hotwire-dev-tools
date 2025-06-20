// Entry point for the DevTools panel.
// Initializes the Svelte app, injects the backend script into the inspected page,
// and establishes a connection to the background.js for communication.

import App from "./App.svelte"
import { mount } from "svelte"

import { inspectorPortName } from "../ports"
import { handleBackendToPanelMessage } from "../messaging"

// Mount Svelte app
document.body.classList.toggle("dark", chrome.devtools.panels.themeName === "dark")
export default mount(App, { target: document.querySelector("#app") })

let currentPort = null
let isConnecting = false
let connectionAttempts = 0
const maxConnectionAttempts = 10

async function connect() {
  if (isConnecting) return

  if (connectionAttempts >= maxConnectionAttempts) {
    console.error(`Max connection attempts (${maxConnectionAttempts}) reached. Giving up.`)
    return
  }

  isConnecting = true
  connectionAttempts++

  try {
    await injectBackendScript()
    currentPort = createConnection()
    console.log(`Connected successfully (attempt ${connectionAttempts})`)
    connectionAttempts = 0
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
    return
  }

  isConnecting = false
}

function createConnection() {
  const port = chrome.runtime.connect({
    name: inspectorPortName(chrome.devtools.inspectedWindow.tabId),
  })

  port.onDisconnect.addListener(() => {
    currentPort = null
  })

  port.onMessage.addListener((message) => {
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

function setupReconnectionHandlers() {
  chrome.devtools.network.onNavigated.addListener(() => {
    console.log("Page navigated, reconnecting...")
    currentPort?.disconnect()
    currentPort = null
    connectionAttempts = 0
    setTimeout(connect, 200)
  })

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabId === chrome.devtools.inspectedWindow.tabId && changeInfo.status === "complete" && !currentPort) {
      console.log("Tab reloaded, reconnecting...")
      connectionAttempts = 0
      setTimeout(connect, 200)
    }
  })
}

setupReconnectionHandlers()
connect()
