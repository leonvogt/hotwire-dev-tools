import { HOTWIRE_DEV_TOOLS_PROXY_SOURCE, HOTWIRE_DEV_TOOLS_BACKEND_SOURCE, BACKEND_TO_PANEL_MESSAGES, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants"
import { addHighlightOverlayToElements, removeHighlightOverlay } from "$utils/highlight"
import { debounce, generateUUID } from "$utils/utils"
import TurboFrameObserver from "./turbo_frame_observer.js"
import ElementObserver from "./element_observer.js"

// This is the backend script which interacts with the page's DOM.
// It observes changes and relays information to the DevTools panel.
// It also handles messages from the panel to perform actions like refreshing Turbo frames.
function init() {
  class HotwireDevToolsBackend {
    constructor() {
      this.observers = {
        turboFrame: new TurboFrameObserver(this),
      }

      this.elementObserver = new ElementObserver(document, this)
    }

    start() {
      this.elementObserver.start()
      this.addEventListeners()
    }

    stop() {
      this.elementObserver.stop()
    }

    addEventListeners() {
      document.addEventListener("turbo:before-stream-render", this.handleIncomingTurboStream, { passive: true })
    }

    matchElement(element) {
      return this.observers.turboFrame.matchElement(element)
    }

    matchElementsInTree(tree) {
      return [...this.observers.turboFrame.matchElementsInTree(tree)]
    }

    elementMatched(element) {
      if (this.observers.turboFrame.matchElement(element)) {
        this.observers.turboFrame.elementMatched(element)
      }
    }

    elementUnmatched(element) {
      if (this.observers.turboFrame.matchElement(element)) {
        this.observers.turboFrame.elementUnmatched(element)
      }
    }

    elementAttributeChanged(element, attributeName, oldValue) {
      if (this.observers.turboFrame.matchElement(element)) {
        this.observers.turboFrame.elementAttributeChanged(element, attributeName, oldValue)
      }
    }

    frameConnected(frame) {
      this.sendTurboFrames()
    }

    frameDisconnected(frame) {
      this.sendTurboFrames()
    }

    frameAttributeChanged(frame, attributeName, oldValue, newValue) {
      this.sendTurboFrames()
    }

    sendTurboFrames = debounce(() => {
      this._postMessage({
        frames: this.observers.turboFrame.getFrameData(),
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_TURBO_FRAMES,
      })
    }, 10)

    handleIncomingTurboStream = (event) => {
      const turboStream = event.target
      const turboStreamContent = turboStream.outerHTML
      const action = turboStream.getAttribute("action")
      const target = turboStream.getAttribute("target")
      const targets = turboStream.getAttribute("targets")
      const targetSelector = target ? `#${target}` : targets
      const uuid = generateUUID()
      const time = new Date().toLocaleTimeString()

      this._postMessage({
        type: BACKEND_TO_PANEL_MESSAGES.TURBO_STREAM_RECEIVED,
        turboStream: {
          turboStreamContent: turboStreamContent,
          action: action,
          target: target,
          targets: targets,
          targetSelector: targetSelector,
          uuid: uuid,
          time: time,
        },
      })
    }

    _postMessage(payload) {
      window.postMessage(
        {
          source: HOTWIRE_DEV_TOOLS_BACKEND_SOURCE,
          payload,
        },
        "*",
      )
    }

    refreshTurboFrame(id) {
      const frame = document.querySelector(`turbo-frame#${id}`)
      if (frame) {
        frame.reload()
        this.sendTurboFrames()
      } else {
        console.warn(`Hotwire DevTools Backend: Turbo frame with id "${id}" not found.`)
      }
    }

    respondToHealthCheck() {
      this._postMessage({
        type: BACKEND_TO_PANEL_MESSAGES.HEALTH_CHECK_RESPONSE,
      })
    }
  }

  const devtoolsBackend = new HotwireDevToolsBackend()
  window.HotwireDevToolsBackend = devtoolsBackend
  window.addEventListener("message", handshake)

  function handshake(e) {
    if (e.data.source === HOTWIRE_DEV_TOOLS_PROXY_SOURCE && e.data.payload === PANEL_TO_BACKEND_MESSAGES.INIT) {
      window.removeEventListener("message", handshake)
      window.addEventListener("message", handleMessages)
      devtoolsBackend.start()
    }
  }

  function handleMessages(e) {
    if (e.data.source !== HOTWIRE_DEV_TOOLS_PROXY_SOURCE) {
      return
    }
    if (e.data.payload === PANEL_TO_BACKEND_MESSAGES.SHUTDOWN) {
      window.removeEventListener("message", handleMessages)
      window.addEventListener("message", handshake)
      devtoolsBackend.stop()
      return
    }
    switch (e.data.payload.action) {
      case PANEL_TO_BACKEND_MESSAGES.HEALTH_CHECK: {
        devtoolsBackend.respondToHealthCheck()
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.GET_TURBO_FRAMES: {
        devtoolsBackend.sendTurboFrames()
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.REFRESH_TURBO_FRAME: {
        console.log("Hotwire DevTools Backend: Refreshing Turbo frame with id:", e.data.payload.id)

        devtoolsBackend.refreshTurboFrame(e.data.payload.id)
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
      case PANEL_TO_BACKEND_MESSAGES.SCROLL_AND_HIGHLIGHT: {
        const element = document.querySelector(e.data.payload.selector)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })

          addHighlightOverlayToElements(e.data.payload.selector)
          setTimeout(() => {
            removeHighlightOverlay()
          }, 1000)
        } else {
          console.warn("Element not found for selector:", "${selector}")
        }
        break
      }
    }
  }
}

if (window.HotwireDevToolsBackend) {
  // If the backend is already initialized, we don't need to re-initialize it.
  // This can happen, if the panel gets reloaded and the backend script get re-injected.
} else {
  init()
}
