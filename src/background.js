// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getOrigin") {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      const origin = new URL(tabs[0].url).origin
      sendResponse({ origin })
    })

    // Return true to indicate that the response will be sent asynchronously
    return true
  }
})
