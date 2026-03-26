// This script can be injected into the active page by the content script
// The purpose is to access the page's `window` object, which is inaccessible from the content script
// We gather details about the current page and sends them back to the content script via `window.postMessage`

const MAX_BUFFER_SIZE = 500

const generateBufferUUID = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

class HotwireDevToolsInjectScript {
  init = () => {
    this.sendWindowDetails()
    this.addEventListeners()
    this.startEventBuffer()
  }

  sendRegisteredControllers = () => {
    const registeredControllers = window.Stimulus?.router.modulesByIdentifier.keys()
    window.postMessage(
      {
        source: "inject",
        message: "stimulusController",
        registeredControllers: Array.from(registeredControllers || []),
      },
      window.location.origin,
    )
  }

  sendTurboDetails = () => {
    window.postMessage(
      {
        source: "inject",
        message: "turboDetails",
        details: { turboDriveEnabled: window.Turbo?.session.drive },
      },
      window.location.origin,
    )
  }

  sendWindowDetails = () => {
    this.sendRegisteredControllers()
    this.sendTurboDetails()
  }

  addEventListeners() {
    const events = ["DOMContentLoaded", "turbolinks:load", "turbo:load"]
    events.forEach((event) => document.addEventListener(event, this.sendWindowDetails, { passive: true }))
  }

  startEventBuffer() {
    window.__hotwireDevToolsBuffer = { turboStreams: [] }

    document.addEventListener(
      "turbo:before-stream-render",
      (event) => {
        // Don't buffer if backend.js is already running
        if (!window.__hotwireDevToolsBuffer) return

        const turboStream = event.target
        const target = turboStream.getAttribute("target")
        const targets = turboStream.getAttribute("targets")

        const entry = {
          turboStreamContent: turboStream.outerHTML,
          action: turboStream.getAttribute("action"),
          target: target,
          targets: targets,
          targetSelector: target ? `#${target}` : targets,
          uuid: generateBufferUUID(),
          time: new Date().toLocaleTimeString(),
        }

        const buffer = window.__hotwireDevToolsBuffer.turboStreams
        buffer.push(entry)
        if (buffer.length > MAX_BUFFER_SIZE) buffer.shift()
      },
      { passive: true },
    )
  }
}

if (window.HotwireDevToolsInjectScript) {
  // If the inject script is already loaded, we don't need to reinitialize it
} else {
  window.HotwireDevToolsInjectScript = new HotwireDevToolsInjectScript()
  window.HotwireDevToolsInjectScript.init()
}
