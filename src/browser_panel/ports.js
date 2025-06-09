export const CONTENT = "CONTENT"
export const PROXY = "proxy"

// Called 'inspected' because of the Chrome API, but this is the "devtools panel"
export const INSPECTOR_PREFIX = "INSPECTOR_"
export function isInspector(port) {
  return port.name.startsWith(INSPECTOR_PREFIX)
}

export function inspectorPortName(tabId) {
  return INSPECTOR_PREFIX + tabId
}

export function inspectorPortNameToTabId(portName) {
  return Number(portName.replace(INSPECTOR_PREFIX, ""))
}

export const HOTWIRE_DEV_TOOLS_PROXY_SOURCE = "hotwire-dev-tools-proxy"
export const HOTWIRE_DEV_TOOLS_PANEL_SOURCE = "hotwire-dev-tools-panel"
export const HOTWIRE_DEV_TOOLS_BACKEND_SOURCE = "hotwire-dev-tools-backend"
