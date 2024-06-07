import { turboStreamTargetElements } from "./lib/turbo_utils"
import Devtool from "./lib/devtool"
import DetailPanel from "./components/detail_panel"

const devTool = new Devtool()
const detailPanel = new DetailPanel(devTool)

const highlightTurboFrames = () => {
  if (!devTool.options.turbo.highlightFrames) {
    document.body.classList.remove("hotwire-dev-tools-highlight-turbo-frames")
    document.querySelectorAll("turbo-frame").forEach((frame) => {
      frame.style.outline = ""
      frame.querySelector(".turbo-frame-info-badge-container")?.remove()
    })
    return
  }

  document.body.classList.add("hotwire-dev-tools-highlight-turbo-frames")
  const { highlightFramesOutlineWidth, highlightFramesOutlineStyle, highlightFramesOutlineColor, highlightFramesBlacklist, ignoreEmptyFrames } = devTool.options.turbo

  let blacklistedFrames = []
  if (highlightFramesBlacklist) {
    try {
      blacklistedFrames = Array.from(document.querySelectorAll(highlightFramesBlacklist))
    } catch (error) {
      console.warn("Hotwire Dev Tools: Invalid Turbo Frame ignore selector:", highlightFramesBlacklist)
    }
  }

  document.querySelectorAll("turbo-frame").forEach((frame) => {
    const isEmpty = frame.innerHTML.trim() === ""
    const shouldIgnore = isEmpty && ignoreEmptyFrames
    if (blacklistedFrames.includes(frame) || shouldIgnore) {
      frame.style.outline = ""
      return
    }

    frame.style.outlineStyle = highlightFramesOutlineStyle
    frame.style.outlineWidth = highlightFramesOutlineWidth
    frame.style.outlineColor = highlightFramesOutlineColor

    // Add a badge to the frame (or update the existing one)
    const badgeClass = "turbo-frame-info-badge"
    const existingBadge = frame.querySelector(`.${badgeClass}`)
    if (existingBadge) {
      existingBadge.style.backgroundColor = highlightFramesOutlineColor
    } else {
      const badgeContainer = document.createElement("div")
      badgeContainer.classList.add("turbo-frame-info-badge-container")
      badgeContainer.dataset.turboTemporary = true

      const badgeContent = document.createElement("span")
      badgeContent.textContent = `ʘ #${frame.id}`
      badgeContent.classList.add(badgeClass)
      badgeContent.dataset.turboId = frame.id
      badgeContent.style.backgroundColor = highlightFramesOutlineColor
      badgeContent.addEventListener("click", handleTurboFrameBadgeClick)
      badgeContent.addEventListener("animationend", handleTurboFrameBadgeAnimationEnd)

      badgeContainer.appendChild(badgeContent)
      frame.insertAdjacentElement("afterbegin", badgeContainer)
    }
  })
}

const highlightStimulusControllers = () => {
  if (!devTool.options.stimulus.highlightControllers) {
    document.querySelectorAll("[data-controller]").forEach((controller) => (controller.style.outline = ""))
    return
  }

  const { highlightControllersOutlineWidth, highlightControllersOutlineStyle, highlightControllersOutlineColor, highlightControllersBlacklist } = devTool.options.stimulus
  let blacklistedControllers = []
  if (highlightControllersBlacklist) {
    try {
      blacklistedControllers = Array.from(document.querySelectorAll(highlightControllersBlacklist))
    } catch (error) {
      console.warn("Hotwire Dev Tools: Invalid Stimulus controller ignore selector:", highlightControllersBlacklist)
    }
  }

  document.querySelectorAll("[data-controller]").forEach((controller) => {
    if (blacklistedControllers.includes(controller)) {
      controller.style.outline = ""
      return
    }
    controller.style.outlineStyle = highlightControllersOutlineStyle
    controller.style.outlineWidth = highlightControllersOutlineWidth
    controller.style.outlineColor = highlightControllersOutlineColor
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

const consoleLogTurboStream = (event) => {
  if (!devTool.options.turbo.consoleLogTurboStreams) return

  const turboStream = event.target
  const targetElements = turboStreamTargetElements(turboStream)
  const target = turboStream.getAttribute("target")
  const targets = turboStream.getAttribute("targets")

  let message = `Hotwire Dev Tools: Turbo Stream received`

  const targetsNotFoundInTheDOM = (target || targets) && (targetElements || []).length === 0
  if (targetsNotFoundInTheDOM) {
    message += ` - Target ${target ? "element" : "elements"} not found!`
    console.warn(message, turboStream)
    return
  }

  console.log(message, turboStream)
}

const handleTurboFrameBadgeClick = (event) => {
  navigator.clipboard.writeText(event.target.dataset.turboId).then(() => {
    event.target.classList.add("copied")
  })
}

const handleTurboFrameBadgeAnimationEnd = (event) => {
  event.target.classList.remove("copied")
}

const handleIncomingTurboStream = (event) => {
  detailPanel.addTurboStreamToDetailPanel(event)
  consoleLogTurboStream(event)
}

const handleWindowMessage = (event) => {
  if (event.origin !== window.location.origin) return
  if (event.data.source !== "inject") return

  switch (event.data.message) {
    case "stimulusController":
      if (event.data.registeredControllers && event.data.registeredControllers.constructor === Array) {
        devTool.registeredStimulusControllers = event.data.registeredControllers
        renderDetailPanel()
      }
      break
    case "turboDetails":
      devTool.turboDetails = event.data.details
      renderDetailPanel()
      break
  }
}

const renderDetailPanel = () => {
  if (!devTool.shouldRenderDetailPanel()) {
    detailPanel.dispose()
    return
  }

  detailPanel.render()
}

const init = async () => {
  await devTool.getOptions()

  injectCustomScript()
  highlightTurboFrames()
  highlightStimulusControllers()
  renderDetailPanel()
}

const events = ["turbolinks:load", "turbo:load", "turbo:frame-load", "hotwire-dev-tools:options-changed"]
events.forEach((event) => document.addEventListener(event, init, { passive: true }))
document.addEventListener("turbo:before-stream-render", handleIncomingTurboStream, { passive: true })

// When Turbo Drive renders a new page, we wanna copy over the existing detail panel - shadow container - to the new page,
// so we can keep the detail panel open, without flickering, when navigating between pages.
// (The normal data-turbo-permanent way doesn't work for this, because the new page won't have the detail panel in the DOM yet)
window.addEventListener("turbo:before-render", (event) => {
  event.target.appendChild(document.getElementById("hotwire-dev-tools-shadow-container"))
})

// Listen for potential message from the injected script
window.addEventListener("message", handleWindowMessage)

// Listen for option changes made in the popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.options?.newValue) {
    document.dispatchEvent(new CustomEvent("hotwire-dev-tools:options-changed"))
  }
})

// On pages without Turbo, there doesn't seem to be an event that informs us when the page has fully loaded.
// Therefore, we call init as soon as this content.js file is loaded.
init()
