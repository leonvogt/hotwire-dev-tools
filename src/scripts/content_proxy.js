import { CONTENT } from "../browser_panel/ports"

const port = chrome.runtime.connect({ name: CONTENT })

window.addEventListener("message", (e) => {
  console.log("content script", e)
  port.postMessage(e.data)
})
