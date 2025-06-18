export const BACKEND_TO_PANEL_MESSAGES = {
  SET_TURBO_FRAMES: "set-turbo-frames",
  TURBO_STREAM_RECEIVED: "turbo-stream-received",
}

export const PANEL_TO_BACKEND_MESSAGES = {
  // shutdown is triggered from proxy.js
  SHUTDOWN: "shutdown",

  HOVER_COMPONENT: "hover",
  HIDE_HOVER: "hide-hover",
  GET_TURBO_FRAMES: "get-turbo-frames",
  REFRESH_TURBO_FRAME: "refresh-turbo-frame",
}

export const CONTENT_TO_BACKGROUND_MESSAGES = {}
