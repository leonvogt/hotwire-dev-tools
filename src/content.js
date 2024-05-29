import Devtool from "./lib/devtool"
import DetailPanel from "./components/detail_panel"

const devTool = new Devtool()
const detailPanel = new DetailPanel(devTool)

const highlightTurboFrames = () => {
  if (!devTool.options.frames) {
    document.body.classList.remove("watch-turbo-frames")
    document.querySelectorAll("turbo-frame").forEach((frame) => {
      frame.querySelector(".turbo-frame-info-badge-container")?.remove()
    })
    return
  }

  document.body.classList.add("watch-turbo-frames")
  const { frameColor, frameBlacklist } = devTool.options

  let blacklistedFrames = []
  if (frameBlacklist) {
    try {
      blacklistedFrames = Array.from(document.querySelectorAll(frameBlacklist))
    } catch (error) {
      console.warn("Hotwire Dev Tools: Invalid frameBlacklist selector:", frameBlacklist)
    }
  }

  const turboFrames = Array.from(document.querySelectorAll("turbo-frame")).filter((frame) => !blacklistedFrames.includes(frame))
  turboFrames.forEach((frame) => {
    // Set the frame's outline color
    frame.style.outline = `2px dashed ${frameColor}`

    // Add a badge to the frame (or update the existing one)
    const badgeClass = "turbo-frame-info-badge"
    const existingBadge = frame.querySelector(`.${badgeClass}`)
    if (existingBadge) {
      existingBadge.style.backgroundColor = frameColor
    } else {
      const badgeContainer = document.createElement("div")
      badgeContainer.classList.add("turbo-frame-info-badge-container")
      badgeContainer.dataset.turboTemporary = true

      const badgeContent = document.createElement("span")
      badgeContent.textContent = `ʘ #${frame.id}`
      badgeContent.classList.add(badgeClass)
      badgeContent.style.backgroundColor = frameColor
      badgeContent.onclick = () => {
        navigator.clipboard.writeText(frame.id)
      }

      if (frame.hasAttribute("src")) {
        badgeContent.classList.add("frame-with-src")
      }
      badgeContainer.appendChild(badgeContent)
      frame.insertAdjacentElement("afterbegin", badgeContainer)
    }
  })
}

const injectCustomScript = () => {
  const existingScript = document.getElementById("hotwire-dev-tools-inject-script")
  if (existingScript) return

  const script = document.createElement("script")
  script.src = chrome.runtime.getURL("dist/inject.js")
  script.id = "hotwire-dev-tools-inject-script"
  document.documentElement.appendChild(script)
}

const injectedScriptMessageHandler = (event) => {
  if (event.origin !== window.location.origin) return
  if (event.data.source !== "inject") return

  switch (event.data.message) {
    case "stimulusController":
      if (event.data.registeredControllers && event.data.registeredControllers.constructor === Array) {
        devTool.stimulusControllers = event.data.registeredControllers
        detailPanel.render()
      }
      break
    case "turboDetails":
      detailPanel.turboDetails = event.data.details
      detailPanel.render()
      break
  }
}

const init = async () => {
  injectCustomScript()
  highlightTurboFrames()
  detailPanel.render()
}

const events = ["DOMContentLoaded", "turbolinks:load", "turbo:load", "turbo:frame-load", "hotwire-dev-tools:options-changed"]
events.forEach((event) => document.addEventListener(event, init))
document.addEventListener("turbo:before-stream-render", detailPanel.addTurboStreamToDetailPanel)

// Listen for potential message from the injected script
window.addEventListener("message", injectedScriptMessageHandler)

// Listen for option changes made in the popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.options?.newValue) {
    devTool.saveOptions(changes.options.newValue)
    document.dispatchEvent(
      new CustomEvent("hotwire-dev-tools:options-changed", {
        detail: changes.options.newValue,
      }),
    )
  }
})
