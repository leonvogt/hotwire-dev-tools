import { BACKEND_TO_PANEL_MESSAGES } from "../lib/constants"
import { setTurboFrames, addTurboStream } from "./State.svelte.js"

function setPort(port) {
  if (!window.__HotwireDevTools) {
    window.__HotwireDevTools = {}
  }
  window.__HotwireDevTools.port = port
}

// Backend -> Panel messages
// Here we receive messages from the backend script that runs in the page context,
// and save them into the global state for the panel to use.
// The panel will then automatically re-render the components based on the new state.
export function handleBackendToPanelMessage(message, port) {
  switch (message.type) {
    case BACKEND_TO_PANEL_MESSAGES.SET_COMPONENTS:
      setTurboFrames(message.frames, message.url)
      setPort(port)
      break
    case BACKEND_TO_PANEL_MESSAGES.TURBO_STREAM_RECEIVED:
      addTurboStream(message.turboStream)
      break
    default:
      console.warn(`Unknown message type from backend: ${message.type}`)
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
