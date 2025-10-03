export const HOTWIRE_DEV_TOOLS_PROXY_SOURCE = "hotwire-dev-tools-proxy"
export const HOTWIRE_DEV_TOOLS_PANEL_SOURCE = "hotwire-dev-tools-panel"
export const HOTWIRE_DEV_TOOLS_BACKEND_SOURCE = "hotwire-dev-tools-backend"

export const PORT_IDENTIFIERS = {
  PROXY: "proxy",
  INSPECTOR_PREFIX: "INSPECTOR_",
}

export const BACKEND_TO_PANEL_MESSAGES = {
  SET_TURBO_FRAMES: "set-turbo-frames",
  SET_TURBO_CABLES: "set-turbo-cables",
  SET_STIMULUS_DATA: "set-stimulus-data",
  TURBO_STREAM_RECEIVED: "turbo-stream-received",
  TURBO_EVENT_RECEIVED: "turbo-event-received",
  HEALTH_CHECK_RESPONSE: "health-check-response",
}

export const PANEL_TO_BACKEND_MESSAGES = {
  // Triggered by the Proxy
  INIT: "init",
  SHUTDOWN: "shutdown",

  // Triggered by the Panel itself
  HEALTH_CHECK: "healt-check",
  HIGHLIGHT_ELEMENT: "highlight-element",
  HIDE_HIGHLIGHTING: "hide-highlighting",
  REFRESH_TURBO_FRAME: "refresh-turbo-frame",
  SCROLL_AND_HIGHLIGHT: "scroll-and-highlight",
  UPDATE_DATA_ATTRIBUTE: "update-data-attribute",
}

export const TURBO_EVENTS = [
  "turbo:click",
  "turbo:before-visit",
  "turbo:visit",
  "turbo:before-cache",
  "turbo:before-render",
  "turbo:render",
  "turbo:load",
  "turbo:morph",
  "turbo:before-morph-element",
  "turbo:before-morph-attribute",
  "turbo:morph-element",
  "turbo:submit-start",
  "turbo:submit-end",
  "turbo:before-frame-render",
  "turbo:frame-render",
  "turbo:frame-load",
  "turbo:frame-missing",
  "turbo:before-stream-render",
  "turbo:before-fetch-request",
  "turbo:before-fetch-response",
  "turbo:before-prefetch",
  "turbo:fetch-request-error",
]

export const TURBO_EVENTS_GROUPED = {
  Document: ["turbo:click", "turbo:before-visit", "turbo:visit", "turbo:before-cache", "turbo:before-render", "turbo:render", "turbo:load"],
  "Page Refreshes": ["turbo:morph", "turbo:before-morph-element", "turbo:before-morph-attribute", "turbo:morph-element"],
  Forms: ["turbo:submit-start", "turbo:submit-end"],
  Frames: ["turbo:before-frame-render", "turbo:frame-render", "turbo:frame-load", "turbo:frame-missing"],
  Streams: ["turbo:before-stream-render"],
  "HTTP Requests": ["turbo:before-fetch-request", "turbo:before-fetch-response", "turbo:before-prefetch", "turbo:fetch-request-error"],
}
