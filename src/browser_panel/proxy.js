// This is a content-script that is injected only when the devtools are
// activated. Because it is not injected using eval, it has full privilege
// to the chrome runtime API. It serves as a proxy between the injected
// backend and the DevTool panel.
import { HOTWIRE_DEV_TOOLS_BACKEND_SOURCE, HOTWIRE_DEV_TOOLS_PROXY_SOURCE, PROXY } from "./ports"
import { PANEL_TO_BACKEND_MESSAGES } from "../lib/constants"

function proxy() {
  const proxyPort = chrome.runtime.connect({
    name: PROXY,
  })

  proxyPort.onMessage.addListener(sendMessageToBackend)
  window.addEventListener("message", sendMessageToDevtools)
  proxyPort.onDisconnect.addListener(handleDisconnect)

  handshakeWithBackend()

  function handshakeWithBackend() {
    sendMessageToBackend(PANEL_TO_BACKEND_MESSAGES.INIT)

    // It can happen, that the proxy gets loaded before the backend script is injected into the page.
    // For that case, we will try to send the INIT message multiple times.
    // The backend script stop listening for the INIT message after the first one gets received.
    const MAX_ATTEMPTS = 10
    const INTERVAL_MS = 100
    let attempts = 0

    const intervalId = setInterval(() => {
      if (attempts++ >= MAX_ATTEMPTS) {
        clearInterval(intervalId)
        return
      }
      sendMessageToBackend(PANEL_TO_BACKEND_MESSAGES.INIT)
    }, INTERVAL_MS)
  }

  function sendMessageToBackend(payload) {
    window.postMessage(
      {
        source: HOTWIRE_DEV_TOOLS_PROXY_SOURCE,
        payload: payload,
      },
      "*",
    )
  }

  function sendMessageToDevtools(e) {
    if (e.data && e.data.source === HOTWIRE_DEV_TOOLS_BACKEND_SOURCE) {
      proxyPort.postMessage(e.data.payload)
    }
  }

  function handleDisconnect() {
    proxyPort.onMessage.removeListener(sendMessageToBackend)
    window.removeEventListener("message", sendMessageToDevtools)
    sendMessageToBackend(PANEL_TO_BACKEND_MESSAGES.SHUTDOWN)
  }
}

proxy()
