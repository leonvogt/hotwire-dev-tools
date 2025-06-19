import App from "./App.svelte"
import { mount } from "svelte"

import { inspectorPortName } from "../ports"
import { handleBackendToPanelMessage } from "../messaging"
import ConsoleProxy from "../../utils/ConsoleProxy"

// This file is the entrypoint for DevTool panel
// It is loaded in the context of the DevTools panel and injects the backend script into the current tab / page

if (chrome.devtools.panels.themeName === "dark") {
  document.body.classList.add("dark")
} else {
  document.body.classList.remove("dark")
}

export default mount(App, {
  target: document.querySelector("#app"),
})

function connect() {
  const consoleProxy = new ConsoleProxy("dev-tool")
  consoleProxy.addConsoleProxy()

  injectScript(chrome.runtime.getURL("/dist/browser_panel/page/backend.js"), () => {
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
