import { PANEL_TO_BACKEND_MESSAGES, BACKEND_TO_PANEL_MESSAGES, PORT_IDENTIFIERS, HOTWIRE_DEV_TOOLS_PANEL_SOURCE } from "$lib/constants"
import { setTurboFrames, setTurboCables, setStimulusData, setRegisteredStimulusIdentifiers, addTurboStream, addTurboEvent } from "./State.svelte.js"

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
export const handleBackendToPanelMessage = (message, port) => {
  switch (message.type) {
    case BACKEND_TO_PANEL_MESSAGES.SET_TURBO_FRAMES:
      setTurboFrames(message.frames, message.url)
      setPort(port)
      break
    case BACKEND_TO_PANEL_MESSAGES.SET_TURBO_CABLES:
      setTurboCables(message.turboCables, message.url)
      setPort(port)
      break
    case BACKEND_TO_PANEL_MESSAGES.SET_STIMULUS_DATA:
      setStimulusData(message.stimulusData, message.url)
      setPort(port)
      break
    case BACKEND_TO_PANEL_MESSAGES.SET_REGISTERED_STIMULUS_IDENTIFIERS:
      setRegisteredStimulusIdentifiers(message.identifiers, message.url)
      setPort(port)
      break
    case BACKEND_TO_PANEL_MESSAGES.TURBO_STREAM_RECEIVED:
      addTurboStream(message.turboStream)
      setPort(port)
      break
    case BACKEND_TO_PANEL_MESSAGES.TURBO_EVENT_RECEIVED:
      addTurboEvent(message.turboEvent)
      setPort(port)
      break
    case BACKEND_TO_PANEL_MESSAGES.HEALTH_CHECK_RESPONSE:
      setPort(port)
      break
    default:
      console.warn(`Unknown message type from backend: ${message.type}`)
  }
}

// Panel -> Backend messages
export const panelPostMessage = (message) => {
  if (window.__HotwireDevTools?.port) {
    window.__HotwireDevTools.port.postMessage(message)
  } else {
    console.warn(`Unable to post message from panel, message: ${JSON.stringify(message)}`)
  }
}

export const isDevToolPanel = (port) => {
  return port.name.startsWith(PORT_IDENTIFIERS.INSPECTOR_PREFIX)
}

export const devToolPanelName = (tabId) => {
  return PORT_IDENTIFIERS.INSPECTOR_PREFIX + tabId
}

export const devToolPanelNameToTabId = (portName) => {
  return Number(portName.replace(PORT_IDENTIFIERS.INSPECTOR_PREFIX, ""))
}

// Common messages from the panel to the backend
export const addHighlightOverlay = (selector) => {
  panelPostMessage({
    action: PANEL_TO_BACKEND_MESSAGES.HIGHLIGHT_ELEMENT,
    source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    selector: selector,
  })
}

export const addHighlightOverlayByPath = (elementPath) => {
  panelPostMessage({
    action: PANEL_TO_BACKEND_MESSAGES.HIGHLIGHT_ELEMENT,
    source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    elementPath: elementPath,
  })
}

export const hideHighlightOverlay = () => {
  panelPostMessage({
    action: PANEL_TO_BACKEND_MESSAGES.HIDE_HIGHLIGHTING,
    source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
  })
}

export const updateDataAttribute = (selector, key, value) => {
  panelPostMessage({
    action: PANEL_TO_BACKEND_MESSAGES.UPDATE_DATA_ATTRIBUTE,
    source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    selector: selector,
    key: key,
    value: value,
  })
}

export const refreshAllState = () => {
  panelPostMessage({
    action: PANEL_TO_BACKEND_MESSAGES.REFRESH_ALL_STATE,
    source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
  })
}
