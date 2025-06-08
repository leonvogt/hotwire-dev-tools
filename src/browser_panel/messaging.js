import { BACKEND_TO_PANEL_MESSAGES } from "../lib/constants"
import { setTurboFrames } from "./State.svelte.js"

function setPort(port) {
  if (!window.__HotwireDevTools) {
    window.__HotwireDevTools = {}
  }
  window.__HotwireDevTools.port = port
}

// Backend -> Panel messages
export function handleBackendToPanelMessage(message, port) {
  if (message.type === BACKEND_TO_PANEL_MESSAGES.SET_COMPONENTS) {
    setTurboFrames(message.frames, message.url)
    setPort(port)
  }
}

// Panel -> Backend messages
export function panelPostMessage(message) {
  if (window.__HotwireDevTools?.port) {
    window.__HotwireDevTools.port.postMessage(message)
  } else {
    console.warn(`Unable to post message from panel, message: ${JSON.stringify(message)}`)
  }
}
