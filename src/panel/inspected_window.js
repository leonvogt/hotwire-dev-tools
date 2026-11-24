import { INSPECTED_WINDOW_EVAL_MESSAGE } from "$lib/constants"

const tabIdFromPanelURL = Number.parseInt(new URLSearchParams(window.location.search).get("tabId"), 10)

export const inspectedTabId = () => {
  return Number.isInteger(tabIdFromPanelURL) ? tabIdFromPanelURL : chrome.devtools.inspectedWindow.tabId
}

export const evalInInspectedWindow = (expression) => {
  return new Promise((resolve) => {
    if (__IS_SAFARI__) {
      chrome.runtime.sendMessage({ type: INSPECTED_WINDOW_EVAL_MESSAGE, tabId: inspectedTabId(), expression }, (response) => {
        resolve(response ?? { exceptionInfo: { description: chrome.runtime.lastError?.message ?? "No response from the devtools page" } })
      })
    } else {
      chrome.devtools.inspectedWindow.eval(expression, (result, exceptionInfo) => resolve({ result, exceptionInfo }))
    }
  })
}

export const inspectElement = (selector) => {
  evalInInspectedWindow(`inspect(document.querySelector(${JSON.stringify(selector)}))`)
}

export const inspectElementByUUID = (uuid) => {
  if (!uuid) return
  evalInInspectedWindow(`inspect(window.HotwireDevToolsBackend?.getElementByUUID(${JSON.stringify(uuid)}))`)
}

export const inspectElementByPath = (path) => {
  if (!path) return
  const resolveElement = `(() => { let el = document.documentElement; for (const index of ${JSON.stringify(path)}) { el = el && el.children[index] } return el })()`
  evalInInspectedWindow(`inspect(${resolveElement})`)
}
