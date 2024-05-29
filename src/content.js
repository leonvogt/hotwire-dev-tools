import { debounce } from "./lib/utils"
import Devtool from "./lib/devtool"
import DetailPanel from "./components/detail_panel"

const devTool = new Devtool()
const detailPanel = new DetailPanel(devTool)

let shadowRoot

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

const createDetailPanelContainer = () => {
  const existingContainer = shadowRoot.getElementById("hotwire-dev-tools-detail-panel-container")
  if (existingContainer) {
    return existingContainer
  }
  const container = document.createElement("div")
  container.id = "hotwire-dev-tools-detail-panel-container"
  container.dataset.turboPermanent = true
  return container
}

const renderDetailPanel = debounce(() => {
  const container = createDetailPanelContainer()
  container.innerHTML = detailPanel.html

  const shadowContainer = document.createElement("div")
  document.body.appendChild(shadowContainer)

  shadowRoot = shadowContainer.attachShadow({ mode: "open" })
  if (shadowRoot) {
    shadowRoot.innerHTML = `
      <style>
        :host {all: initial;}
        #hotwire-dev-tools-detail-panel-container {
          position: fixed;
          bottom: 0em;
          right: 0em;
          z-index: 99999;
          width: clamp(20rem, 30rem, 100vw);
          background: white;

          .hotwire-dev-tools-detail-panel-header {
            height: 2.5rem;
            background: #808080;
            color: white;
            display: flex;
          }

          /* Tabs */
          .hotwire-dev-tools-tablist {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 100%;
            width: 100%;

            & button {
              background-color: inherit;
              border: none;
              outline: none;
              width: 100%;
              height: 100%;
              transition: 0.3s;
            }

            & button.active {
              background-color: #ccc;
            }
          }

          .tablink-with-icon {
            width: fit-content !important;
            padding-left: 1em;
            padding-right: 1em;

            & svg {
              height: 50%;
            }

            & path {
              fill: white;
            }
          }

          .hotwire-dev-tools-tab-content {
            display: none;

            &.active {
              display: block;
            }
          }

          .hotwire-dev-tools-collapse-button {
            background: #808080;
            color: white;
            border: none;
            outline: none;
            padding-right: 0.5em;
            padding-left: 0.5em;
          }

          .hotwire-dev-tools-collapse-button:hover {
            color: black;
          }

          & .hotwire-dev-tools-tab-content {
            max-height: 10em;
            overflow-y: auto;
            overscroll-behavior: contain;
          }

          & .hotwire-dev-tools-entry {
            display: flex;
            justify-content: space-between;
            padding: 0.5em;
            cursor: pointer;
          }

          & .hotwire-dev-tools-entry:hover {
            background: #ccc;
          }

          &.collapsed {
            height: 8px;
            transition: height 0.25s ease-out;
          }

          &.collapsed:hover {
            height: 2.5rem;
          }
        }

        & .info-tab-content {
          display: flex;
          justify-content: space-between;
          padding: 0.5em;

          .info-tab-content-stimulus,
          .info-tab-content-turbo {
            min-width: 45%;
          }

          & .info-title {
            font-size: 1.2em;
          }

          & .info-title {
            font-size: 1.1em;
          }

          & pre {
            margin: 0;
            white-space: no-wrap;
            display: flex;
            justify-content: space-between;
          }
        }

        #hotwire-dev-tools-detail-panel-container:not(.collapsed) {
          .hotwire-dev-tools-tablist button:hover {
            background-color: #ddd;
          }
        }

        #hotwire-dev-tools-detail-panel-container,
        .hotwire-dev-tools-detail-panel-header,
        .hotwire-dev-tools-tablink:first-child {
          border-top-left-radius: 10px;
        }
      </style>
    `
    shadowRoot.appendChild(container)
  }

  container.classList.toggle("collapsed", devTool.options.detailPanelCollapsed)
  listenForTabNavigation()
  listenForCollapse()
}, 100)

const listenForTabNavigation = () => {
  const tablist = shadowRoot.querySelector(".hotwire-dev-tools-tablist")
  tablist.addEventListener("click", (event) => {
    shadowRoot.querySelectorAll(".hotwire-dev-tools-tablink, .hotwire-dev-tools-tab-content").forEach((tab) => {
      tab.classList.remove("active")
    })

    const clickedTab = event.target.closest(".hotwire-dev-tools-tablink")
    const desiredTabContent = shadowRoot.getElementById(clickedTab.dataset.tabId)

    clickedTab.classList.add("active")
    desiredTabContent.classList.add("active")

    devTool.saveOptions({ currentTab: clickedTab.dataset.tabId })
  })
}

const listenForCollapse = () => {
  shadowRoot.querySelector(".hotwire-dev-tools-collapse-button").addEventListener("click", () => {
    const container = shadowRoot.getElementById("hotwire-dev-tools-detail-panel-container")
    container.classList.toggle("collapsed")
    devTool.saveOptions({
      detailPanelCollapsed: container.classList.contains("collapsed"),
    })
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
        renderDetailPanel()
      }
      break
    case "turboDetails":
      detailPanel.turboDetails = event.data.details
      renderDetailPanel()
      break
  }
}

const init = async () => {
  highlightTurboFrames()
  renderDetailPanel()
  injectCustomScript()
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
