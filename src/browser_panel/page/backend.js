import { HOTWIRE_DEV_TOOLS_PROXY_SOURCE } from "../ports"
import { BACKEND_TO_PANEL_MESSAGES, PANEL_TO_BACKEND_MESSAGES } from "../../lib/constants"
import { addHighlightOverlayToElements, removeHighlightOverlay } from "../../utils/highlight"
import { debounce } from "../../utils/utils"

// This is the backend script which interacts with the page's DOM.
// It observes changes and relays information to the DevTools panel.
// It also handles messages from the panel to perform actions like refreshing Turbo frames.
function init() {
  class HotwireDevToolsBackend {
    constructor() {
      this.observer = null
      this._stopMutationObserver = false
    }

    start() {
      this.sendTurboFrames()

      const events = ["turbolinks:load", "turbo:load", "turbo:frame-load", "hotwire-dev-tools:options-changed"]
      events.forEach((event) => {
        document.addEventListener(event, () => {
          console.log("Hotwire DevTools Backend: Event received:", event)
          this.observeNode(document.querySelector("body"))
        })
      })

      document.addEventListener("turbo:before-cache", () => {
        this.disconnectObserver()
      })
    }

    shutdown() {
      this.disconnectObserver()
    }

    sendTurboFrames = debounce(() => {
      const frames = Array.from(document.querySelectorAll("turbo-frame")).map((frame) => {
        return {
          id: frame.id,
          src: frame.src,
          loading: frame.getAttribute("loading"),
          attributes: Array.from(frame.attributes).reduce((attributeMap, attribute) => {
            attributeMap[attribute.name] = attribute.value
            return attributeMap
          }, {}),
        }
      })

      this._postMessage({
        frames: frames,
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_COMPONENTS,
      })
    }, 100)

    _postMessage(payload) {
      window.postMessage(
        {
          source: "hotwire-dev-tools-backend",
          payload,
        },
        "*",
      )
    }

    observeNode(node) {
      const observerOptions = {
        childList: true,
        attributes: true,
        subtree: true,
      }

      this.observer = new MutationObserver((mutations) => {
        if (!this._stopMutationObserver) {
          // Reduce the number of sent messages, by ignoring mutations that are from the highlighting process.
          const isHighlightOverlayMutation = mutations.some((mutation) => {
            const nodes = Array.from(mutation.addedNodes).concat(Array.from(mutation.removedNodes))
            return Array.from(nodes).some((node) => node.nodeType === Node.ELEMENT_NODE && node.classList?.contains("hotwire-dev-tools-highlight-overlay"))
          })

          if (!isHighlightOverlayMutation) {
            this.sendTurboFrames(mutations)
          }
        }
      })

      this.observer.observe(node, observerOptions)
    }

    disconnectObserver() {
      if (this.observer) {
        this.observer.disconnect()
        this.observer = null
      }
    }
  }

  // Using a function scope to avoid running into issues on re-injection
  const devtoolsBackend = new HotwireDevToolsBackend()
  window.addEventListener("message", handshake)

  function handshake(e) {
    if (e.data.source === HOTWIRE_DEV_TOOLS_PROXY_SOURCE && e.data.payload === "init") {
      window.removeEventListener("message", handshake)
      window.addEventListener("message", handleMessages)
      devtoolsBackend.start()
    } else {
      console.log("Hotwire DevTools Backend: Handshake received from unknown source:", e.data.source)
    }
  }

  function handleMessages(e) {
    if (e.data.source !== HOTWIRE_DEV_TOOLS_PROXY_SOURCE) {
      return
    }
    if (e.data.payload === PANEL_TO_BACKEND_MESSAGES.SHUTDOWN) {
      window.removeEventListener("message", handleMessages)
      window.addEventListener("message", handshake)
      devtoolsBackend.shutdown()
      return
    }
    switch (e.data.payload.action) {
      case PANEL_TO_BACKEND_MESSAGES.GET_TURBO_FRAMES: {
        devtoolsBackend.sendTurboFrames()
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.HOVER_COMPONENT: {
        addHighlightOverlayToElements(e.data.payload.selector)
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.HIDE_HOVER: {
        if (e.data.payload.selector) {
          removeHighlightOverlay(e.data.payload.selector)
        } else {
          removeHighlightOverlay()
        }
        break
      }
    }
  }
}

init()
