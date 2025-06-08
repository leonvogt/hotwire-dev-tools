import { inspectorPortName } from "../ports"
import { panelPostMessage, handleBackendToPanelMessage } from "../messaging"
import { PANEL_TO_BACKEND_MESSAGES } from "../../lib/constants"
import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE } from "../ports"

import App from "./App.svelte"
import { mount } from "svelte"

if (chrome.devtools.panels.themeName === "dark") {
  document.body.classList.add("dark")
} else {
  document.body.classList.remove("dark")
}

export default mount(App, {
  target: document.querySelector("#app"),
})

// Entrypoint for DevTool panel
function connect() {
  console.log("Hotwire DevTools Panel: connecting...")

  // The flow goes:
  // 1. [panel] inject backend
  // 2. [panel] connect on an "inspector" port
  // 3. connection is picked up by background
  // 4. background injects proxy (because the connection was triggered by an "inspector" port)
  // 5. proxy starts a connection back to background
  //    1. proxy forwards backend.window.postMessage on this connection
  // 6. background starts a 2-way pipe between proxy and devtools
  // What that means is that messages go:
  // - panel/devtools -(port)-> background -(port)-> proxy -(window)-> backend
  // - backend -(window)-> proxy -(port)-> background -(port)-> panel/devtools
  document.querySelector(".refresh-turbo-frames")?.addEventListener("click", () => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.GET_TURBO_FRAMES,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    })
  })

  injectScript(chrome.runtime.getURL("/dist/browser_panel/page/backend.js"), () => {
    const port = chrome.runtime.connect({
      name: inspectorPortName(chrome.devtools.inspectedWindow.tabId),
    })

    let disconnected = false

    port.onDisconnect.addListener(() => {
      disconnected = true
    })

    port.onMessage.addListener(function (message) {
      // ignore further messages
      if (disconnected) return
      handleBackendToPanelMessage(message, port)
    })
  })
}

function onReload(reloadFunction) {
  chrome.devtools.network.onNavigated.addListener(reloadFunction)
}

// Inject a globally evaluated script, in the same context with the actual page
function injectScript(scriptName, callback) {
  const src = `
    (function() {
      var script = document.constructor.prototype.createElement.call(document, 'script');
      script.src = "${scriptName}";
      document.documentElement.appendChild(script);
      script.parentNode.removeChild(script);
    })()
  `
  chrome.devtools.inspectedWindow.eval(src, function (res, err) {
    if (err) {
      console.log(err)
    }
    callback()
  })
}

connect()
onReload(() => {
  connect()
})
