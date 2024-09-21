chrome.devtools.panels.create("Hotwire Dev Tools", "images/icon-128.png", "panel.html", () => {
  console.log("User switched to the panel")
})

chrome.devtools.network.onRequestFinished.addListener((request) => {
  request.getContent((body) => {
    if (body === null || body === undefined) {
      return
    }

    const turboStreamRegex = /<turbo-stream\b[^>]*>[\s\S]*?<\/turbo-stream>/gi
    const turboStreamMatches = body.match(turboStreamRegex)
    if (turboStreamMatches) {
      sendTurboStreams(turboStreamMatches)
    }
  })
})

const sendTurboStreams = (turboStreamMatches) => {
  chrome.runtime.sendMessage({
    type: "TURBO_STREAMS",
    turboStreams: turboStreamMatches,
  })
}
