// Entry point for the DevTools panel.
// Initializes the Svelte app, injects the backend script into the inspected page,
// and establishes a connection to the background.js for communication.

import App from "./App.svelte"
import { mount } from "svelte"

import { inspectorPortName } from "../ports"
import { handleBackendToPanelMessage } from "../messaging"

if (chrome.devtools.panels.themeName === "dark") {
  document.body.classList.add("dark")
} else {
  document.body.classList.remove("dark")
}

// State management for connection attempts
let connectionAttempts = 0
let maxConnectionAttempts = 10
let isConnecting = false
let currentPort = null

function connect() {
  if (isConnecting) return
  isConnecting = true
  connectionAttempts++

  console.log(`Connection attempt ${connectionAttempts}/${maxConnectionAttempts}`)

  injectBackendScript()
    .then(() => {
      return createConnection()
    })
    .then((port) => {
      currentPort = port
      connectionAttempts = 0 // Reset on success
      isConnecting = false
    })
    .catch((error) => {
      console.warn("Connection failed:", error)
      isConnecting = false

      if (connectionAttempts < maxConnectionAttempts) {
        setTimeout(() => connect(), 500)
      } else {
        console.error("Max connection attempts reached. Backend injection failed.")
        connectionAttempts = 0 // Reset for future attempts
      }
    })
}

function createConnection() {
  return new Promise((resolve, reject) => {
    try {
      const port = chrome.runtime.connect({
        name: inspectorPortName(chrome.devtools.inspectedWindow.tabId),
      })

      let disconnected = false

      port.onDisconnect.addListener(() => {
        disconnected = true
      })

      port.onMessage.addListener(function (message) {
        if (disconnected) return
        handleBackendToPanelMessage(message, port)
      })

      resolve(port)
    } catch (error) {
      reject(error)
    }
  })
}

// Inject backend.js in the same context as the actual page
function injectBackendScript() {
  return new Promise((resolve, reject) => {
    const scriptId = "hotwire-dev-tools-backend-script"
    const scriptURL = chrome.runtime.getURL("/dist/browser_panel/page/backend.js")

    const injectionScript = `
      (function() {
        // Check if script is already injected
        if (document.getElementById('${scriptId}')) {
          return 'already-injected';
        }

        // Function to inject script
        function injectScript() {
          const script = document.createElement('script');
          script.src = "${scriptURL}";
          script.id = "${scriptId}";
          script.async = true;

          // Add error handling
          script.onerror = function() {
            console.error('Failed to load backend script');
          };

          const target = document.head || document.documentElement;
          if (target) {
            target.appendChild(script);
            return 'injected';
          }
          return 'no-target';
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            injectScript();
          });
          return 'waiting-for-dom';
        } else {
          return injectScript();
        }
      })()
    `

    chrome.devtools.inspectedWindow.eval(injectionScript, (result, error) => {
      if (error) {
        console.error("Script injection error:", error)
        reject(new Error(`Injection failed: ${error.description || error.message}`))
        return
      }

      console.log("Injection result:", result)

      if (result === "already-injected") {
        console.log("Backend script already injected")
        resolve()
      } else if (result === "injected" || result === "waiting-for-dom") {
        resolve()
      } else {
        reject(new Error(`Unexpected injection result: ${result}`))
      }
    })
  })
}

// Handle page navigation
function onReload(reloadFunction) {
  chrome.devtools.network.onNavigated.addListener(() => {
    console.log("Page navigated, reconnecting...")

    // Disconnect current port if exists
    if (currentPort) {
      currentPort.disconnect()
      currentPort = null
    }

    // Reset connection state
    isConnecting = false
    connectionAttempts = 0

    // Add a delay to ensure page is ready
    setTimeout(reloadFunction, 100)
  })
}

// Handle tab updates (refresh, etc.)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === chrome.devtools.inspectedWindow.tabId && changeInfo.status === "complete") {
    console.log("Tab updated and complete, ensuring connection...")

    // Only reconnect if we don't have an active connection
    if (!currentPort || !isConnecting) {
      setTimeout(() => connect(), 200)
    }
  }
})

onReload(() => {
  connect()
})
connect()

export default mount(App, {
  target: document.querySelector("#app"),
})
