import { turboStreamTargetElements } from "./lib/turbo_utils"
import Devtool from "./lib/devtool"
import DetailPanel from "./components/detail_panel"

const LOCATION_ORIGIN = window.location.origin
const devTool = new Devtool(LOCATION_ORIGIN)
const detailPanel = new DetailPanel(devTool)

const highlightTurboFrames = () => {
  const badgeClass = "hotwire-dev-tools-turbo-frame-info-badge"
  const badgeContainerClass = "hotwire-dev-tools-turbo-frame-info-badge-container"

  if (!devTool.options.turbo.highlightFrames) {
    document.body.classList.remove("hotwire-dev-tools-highlight-turbo-frames")
    document.querySelectorAll("turbo-frame").forEach((frame) => {
      frame.style.outline = ""
      frame.querySelector(`.${badgeContainerClass}`)?.remove()
    })
    document.querySelectorAll(".hotwire-dev-tools-highlight-overlay-turbo-frame").forEach((overlay) => overlay.remove())
    return
  }

  const { highlightFramesOutlineWidth, highlightFramesOutlineStyle, highlightFramesOutlineColor, highlightFramesBlacklist, highlightFramesWithOverlay, ignoreEmptyFrames } = devTool.options.turbo

  if (!highlightFramesWithOverlay) {
    document.body.classList.add("hotwire-dev-tools-highlight-turbo-frames")
  }

  let blacklistedFrames = []
  if (highlightFramesBlacklist) {
    try {
      blacklistedFrames = Array.from(document.querySelectorAll(highlightFramesBlacklist))
    } catch (error) {
      console.warn("Hotwire Dev Tools: Invalid Turbo Frame ignore selector:", highlightFramesBlacklist)
    }
  }

  const addBadge = (element, frameId) => {
    const existingBadge = element.querySelector(`.${badgeClass}`)
    if (existingBadge) {
      existingBadge.style.backgroundColor = highlightFramesOutlineColor
    } else {
      const badgeContainer = document.createElement("div")
      badgeContainer.classList.add(badgeContainerClass)
      badgeContainer.dataset.turboTemporary = true

      const badgeContent = document.createElement("span")
      badgeContent.textContent = `ʘ #${frameId}`
      badgeContent.classList.add(badgeClass)
      badgeContent.dataset.turboId = frameId
      badgeContent.style.backgroundColor = highlightFramesOutlineColor
      badgeContent.addEventListener("click", handleTurboFrameBadgeClick)
      badgeContent.addEventListener("animationend", handleTurboFrameBadgeAnimationEnd)

      badgeContainer.appendChild(badgeContent)
      element.insertAdjacentElement("afterbegin", badgeContainer)
    }
  }

  const windowScrollY = window.scrollY
  const windowScrollX = window.scrollX
  document.querySelectorAll("turbo-frame").forEach((frame) => {
    const frameId = frame.id
    const isEmpty = frame.innerHTML.trim() === ""
    const shouldIgnore = isEmpty && ignoreEmptyFrames
    if (blacklistedFrames.includes(frame) || shouldIgnore) {
      frame.style.outline = ""
      document.getElementById(`hotwire-dev-tools-highlight-overlay-${frameId}`)?.remove()
      return
    }

    if (highlightFramesWithOverlay) {
      const rect = frame.getBoundingClientRect()
      let overlay = document.getElementById(`hotwire-dev-tools-highlight-overlay-${frameId}`)
      if (!overlay) {
        overlay = document.createElement("div")
        overlay.id = `hotwire-dev-tools-highlight-overlay-${frameId}`
        overlay.className = `hotwire-dev-tools-highlight-overlay-turbo-frame`
      }

      Object.assign(overlay.style, {
        top: `${rect.top + windowScrollY}px`,
        left: `${rect.left + windowScrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        outlineStyle: highlightFramesOutlineStyle,
        outlineWidth: highlightFramesOutlineWidth,
        outlineColor: highlightFramesOutlineColor,
      })

      if (!overlay.parentNode) {
        document.body.appendChild(overlay)
      }
      addBadge(overlay, frameId)
    } else {
      Object.assign(frame.style, {
        outlineStyle: highlightFramesOutlineStyle,
        outlineWidth: highlightFramesOutlineWidth,
        outlineColor: highlightFramesOutlineColor,
      })
      addBadge(frame, frameId)
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
  script.src = chrome.runtime.getURL("dist/hotwire_dev_tools_inject_script.js")
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
  if (event.origin !== LOCATION_ORIGIN) return
  if (event.data.source !== "inject") return

  switch (event.data.message) {
    case "stimulusController":
      if (event.data.registeredControllers) {
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

const handleTurboBeforeCache = (event) => {
  document.querySelectorAll(".hotwire-dev-tools-highlight-overlay-turbo-frame").forEach((element) => {
    element.remove()
  })
}

const renderDetailPanel = () => {
  if (!devTool.shouldRenderDetailPanel()) {
    detailPanel.dispose()
    return
  }

  detailPanel.render()
}

const init = async () => {
  await devTool.setOptions()

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

// Chance to clean up any DOM modifications made by this extension before Turbo caches the page
window.addEventListener("turbo:before-cache", handleTurboBeforeCache)

// Listen for potential message from the injected script
window.addEventListener("message", handleWindowMessage)

// Listen for window resize events
window.addEventListener("resize", highlightTurboFrames)

// Listen for option changes made in the popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.options?.newValue || changes[LOCATION_ORIGIN]?.newValue)) {
    document.dispatchEvent(new CustomEvent("hotwire-dev-tools:options-changed"))
  }
})

// On pages without Turbo, there doesn't seem to be an event that informs us when the page has fully loaded.
// Therefore, we call init as soon as this content.js file is loaded.
init()
