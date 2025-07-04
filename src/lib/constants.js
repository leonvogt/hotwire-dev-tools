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
  TURBO_STREAM_RECEIVED: "turbo-stream-received",
  HEALTH_CHECK_RESPONSE: "health-check-response",
}

export const PANEL_TO_BACKEND_MESSAGES = {
  // Triggered by the Proxy
  INIT: "init",
  SHUTDOWN: "shutdown",

  // Triggered by the Panel itself
  HEALTH_CHECK: "healt-check",
  HOVER_COMPONENT: "hover",
  HIDE_HOVER: "hide-hover",
  GET_TURBO_FRAMES: "get-turbo-frames",
  REFRESH_TURBO_FRAME: "refresh-turbo-frame",
  SCROLL_AND_HIGHLIGHT: "scroll-and-highlight",
}
