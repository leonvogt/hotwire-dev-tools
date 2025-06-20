// This script can be injected into the active page by the content script
// The purpose is to access the page's `window` object, which is inaccessible from the content script
// We gather details about the current page and sends them back to the content script via `window.postMessage`
class HotwireDevToolsInjectScript {
  init = () => {
    this.sendWindowDetails()
    this.addEventListeners()
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
}

if (window.HotwireDevToolsInjectScript) {
  // If the inject script is already loaded, we don't need to reinitialize it
} else {
  window.HotwireDevToolsInjectScript = new HotwireDevToolsInjectScript()
  window.HotwireDevToolsInjectScript.init()
}
