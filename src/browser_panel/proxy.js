function proxy() {
  // Connect to the background script
  const proxyPort = chrome.runtime.connect({
    name: "ALPINE_DEVTOOLS_PROXY",
  })

  // Forward messages from page to DevTools
  window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "alpine-devtools-agent") {
      proxyPort.postMessage(event.data.payload)
    }
  })

  // Forward messages from DevTools to page
  proxyPort.onMessage.addListener((message) => {
    window.postMessage(
      {
        source: "alpine-devtools-panel",
        payload: message,
      },
      "*",
    )
  })

  // Inject agent script into page
  const script = document.createElement("script")
  script.src = chrome.runtime.getURL("scripts/agent.js")
  document.documentElement.appendChild(script)
  script.onload = function () {
    script.remove()
  }
}

// proxy()

// chrome.devtools.network.onRequestFinished.addListener((request) => {
//   request.getContent((body) => {
//     if (body === null || body === undefined) {
//       return
//     }

//     const turboStreamRegex = /<turbo-stream\b[^>]*>[\s\S]*?<\/turbo-stream>/gi
//     const turboStreamMatches = body.match(turboStreamRegex)
//     if (turboStreamMatches) {
//       sendTurboStreams(turboStreamMatches)
//     }
//   })
// })

// const sendTurboStreams = (turboStreamMatches) => {
//   chrome.runtime.sendMessage({
//     type: "TURBO_STREAMS",
//     turboStreams: turboStreamMatches,
//   })
// }
