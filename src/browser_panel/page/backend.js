import { HOTWIRE_DEV_TOOLS_PROXY_SOURCE, HOTWIRE_DEV_TOOLS_BACKEND_SOURCE, BACKEND_TO_PANEL_MESSAGES, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants"
import { addHighlightOverlayToElements, removeHighlightOverlay } from "$utils/highlight"
import { debounce, stringifyHTMLElementTag, generateUUID, ensureUUIDOnElement, getUUIDFromElement } from "$utils/utils"
import TurboFrameObserver from "./turbo_frame_observer.js"

// This is the backend script which interacts with the page's DOM.
// It observes changes and relays information to the DevTools panel.
// It also handles messages from the panel to perform actions like refreshing Turbo frames.
function init() {
  class HotwireDevToolsBackend {
    constructor() {
      this.turboFrameObserver = new TurboFrameObserver(this)
      this.turboFrames = new Map()
    }

    start() {
      this.turboFrameObserver.start()
      this.addEventListeners()
    }

    shutdown() {
      this.turboFrameObserver.stop()
    }

    frameConnected(frame) {
      const uuid = ensureUUIDOnElement(frame)
      const frameData = {
        id: frame.id,
        uuid: uuid,
        serializedTag: stringifyHTMLElementTag(frame),
        attributes: Array.from(frame.attributes).reduce((map, attr) => {
          map[attr.name] = attr.value
          return map
        }, {}),
        children: [],
        element: frame,
      }

      this.turboFrames.set(uuid, frameData)
      this.sendTurboFrames()
    }

    frameDisconnected(frame) {
      const uuid = getUUIDFromElement(frame)
      this.turboFrames.delete(uuid)
      this.sendTurboFrames()
    }

    frameAttributeChanged(frame, attributeName, oldValue, newValue) {
      const uuid = getUUIDFromElement(frame)
      if (!this.turboFrames.has(uuid)) return

      const frameData = this.turboFrames.get(uuid)
      if (newValue === null) {
        delete frameData.attributes[attributeName]
      } else {
        frameData.attributes[attributeName] = newValue
      }
      frameData.serializedTag = stringifyHTMLElementTag(frame)

      this.turboFrames.set(uuid, frameData)
      this.sendTurboFrames()
    }

    addEventListeners() {
      document.addEventListener("turbo:before-stream-render", this.handleIncomingTurboStream, { passive: true })
    }

    sendTurboFrames = debounce(() => {
      // Create a deep copy of the turboFrames map, without DOM Elements
      const stripDOMElements = (frameData) => {
        const { element, children, ...cleanData } = frameData
        const strippedChildren = children.map((child) => stripDOMElements(child))
        return { ...cleanData, children: strippedChildren }
      }

      const buildFrameTree = () => {
        const rootFrames = []
        this.turboFrames.forEach((frameData) => {
          frameData.children = []
        })

        this.turboFrames.forEach((frameData) => {
          const element = frameData.element
          const parentElement = element.parentElement?.closest("turbo-frame")

          if (parentElement) {
            const parentUUID = this.getUUIDFromElement(parentElement)
            if (parentUUID && this.turboFrames.has(parentUUID)) {
              this.turboFrames.get(parentUUID).children.push(frameData)
            } else {
              // Parent exists but not in our tracking => add as root
              rootFrames.push(frameData)
            }
          } else {
            // No parent frame => this is a root frame
            rootFrames.push(frameData)
          }
        })

        return rootFrames
      }

      const turboFrameTree = buildFrameTree()
      const sanitizedFrameTree = turboFrameTree.map((frame) => stripDOMElements(frame))

      this._postMessage({
        frames: sanitizedFrameTree,
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

  // Using a function scope to avoid running into issues on re-injection
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
      devtoolsBackend.shutdown()
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
