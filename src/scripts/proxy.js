// This is a content-script that is injected only when the devtools are
// activated. Because it is not injected using eval, it has full privilege
// to the chrome runtime API. It serves as a proxy between the injected
// backend and the DevTool panel.
import { HOTWIRE_DEV_TOOLS_BACKEND_SOURCE, HOTWIRE_DEV_TOOLS_PROXY_SOURCE, PROXY } from "../browser_panel/ports"

function proxy() {
  const proxyPort = chrome.runtime.connect({
    name: PROXY,
  })

  proxyPort.onMessage.addListener(sendMessageToBackend)
  window.addEventListener("message", sendMessageToDevtools)
  proxyPort.onDisconnect.addListener(handleDisconnect)

  sendMessageToBackend("init")

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
    } else {
      console.log("Not forwarding message", e)
    }
  }

  function handleDisconnect() {
    proxyPort.onMessage.removeListener(sendMessageToBackend)
    window.removeEventListener("message", sendMessageToDevtools)
    sendMessageToBackend("shutdown")
  }
}

proxy()
