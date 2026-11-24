import { INSPECTED_WINDOW_EVAL_MESSAGE } from "$lib/constants"

const inspectedTabId = chrome.devtools.inspectedWindow.tabId

if (__IS_SAFARI__) {
  // Safari 26+ terminates the Web Inspector when the panel page itself calls `devtools.inspectedWindow.eval`,
  // and reports `inspectedWindow.tabId` as -1 there. This devtools page has neither problem, so the panel
  // gets the tab ID via its URL and relays all evals through here.
  chrome.devtools.panels.create("Hotwire", "/images/icon-128.png", `panel.html?tabId=${inspectedTabId}`)

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== INSPECTED_WINDOW_EVAL_MESSAGE || message.tabId !== inspectedTabId) return false

    chrome.devtools.inspectedWindow.eval(message.expression, (...args) => {
      const [result, exceptionInfo] = args.length === 1 && Array.isArray(args[0]) ? args[0] : args
      sendResponse({ result, exceptionInfo })
    })
    return true
  })
} else {
  chrome.devtools.panels.create("Hotwire", "/images/icon-128.png", "panel.html")
}
