import { HOTWIRE_DEV_TOOLS_PROXY_SOURCE, HOTWIRE_DEV_TOOLS_BACKEND_SOURCE, BACKEND_TO_PANEL_MESSAGES, PANEL_TO_BACKEND_MESSAGES, TURBO_EVENTS } from "$lib/constants"
import { addHighlightOverlayToElements, removeHighlightOverlay } from "$utils/highlight"
import { debounce, generateUUID, getElementPath, getElementFromIndexPath, stringifyHTMLElementTag, stringifyHTMLElementTagShallow, safeStringifyEventDetail } from "$utils/utils"
import TurboFrameObserver from "./turbo_frame_observer.js"
import TurboCableObserver from "./turbo_cable_observer.js"
import StimulusObserver from "./stimulus_observer.js"
import TurboAttributeElementsObserver from "./turbo_attribute_elements_observer.js"
import ElementObserver from "./element_observer.js"
import LeaderLine from "$lib/leader_line.js"

// This is the backend script which interacts with the page's DOM.
// It observes changes and relays information to the DevTools panel.
// It also handles messages from the panel to perform actions like refreshing Turbo frames.
function init() {
  class HotwireDevToolsBackend {
    EVENTS_FOR_TURBO_CONFIG = ["turbo:load", "turbo:render"]

    constructor() {
      this.observers = {
        turboFrame: new TurboFrameObserver(this),
        turboCable: new TurboCableObserver(this),
        stimulus: new StimulusObserver(this),
        turboAttributes: new TurboAttributeElementsObserver(this),
      }

      this.elementObserver = new ElementObserver(document, this)
    }

    start() {
      this.elementObserver.start()
      this.addEventListeners()

      // The following wouldn't send because they aren't connected to a observer.
      // So we send them manually on start.
      this.sendRegisteredStimulusControllers()
      this.sendTurboConfig()
    }

    stop() {
      this.elementObserver.stop()
      document.removeEventListener("turbo:before-stream-render", this.handleIncomingTurboStream)
      this.EVENTS_FOR_TURBO_CONFIG.forEach((eventName) => {
        window.removeEventListener(eventName, this.sendTurboConfig)
      })
    }

    addEventListeners() {
      document.addEventListener("turbo:before-stream-render", this.handleIncomingTurboStream, { passive: true })

      TURBO_EVENTS.forEach((eventName) => {
        window.addEventListener(eventName, (event) => {
          // For some unknown reason, we can't use the event itself in Safari, without loosing custom properties, like event.detail.
          // The only hacky workaround that seems to work is to use a setTimeout with some delay. (Issue#73)
          setTimeout(() => {
            this.sendTurboEvent(eventName, event)
          }, 100)
        })
      })

      this.EVENTS_FOR_TURBO_CONFIG.forEach((eventName) => {
        window.addEventListener(eventName, this.sendTurboConfig, { passive: true })
      })
    }

    // ElementObserver delegate methods
    matchElement(element) {
      return this.observers.turboFrame.matchElement(element) || this.observers.turboCable.matchElement(element) || this.observers.stimulus.matchElement(element) || this.observers.turboAttributes.matchElement(element)
    }

    matchElementsInTree(tree) {
      return [
        ...this.observers.turboFrame.matchElementsInTree(tree),
        ...this.observers.turboCable.matchElementsInTree(tree),
        ...this.observers.stimulus.matchElementsInTree(tree),
        ...this.observers.turboAttributes.matchElementsInTree(tree),
      ]
    }

    elementMatched(element) {
      if (this.observers.turboFrame.matchElement(element)) {
        this.observers.turboFrame.elementMatched(element)
      }

      if (this.observers.turboCable.matchElement(element)) {
        this.observers.turboCable.elementMatched(element)
      }

      if (this.observers.stimulus.matchElement(element)) {
        this.observers.stimulus.elementMatched(element)
      }

      if (this.observers.turboAttributes.matchElement(element)) {
        this.observers.turboAttributes.elementMatched(element)
      }
    }

    elementUnmatched(element) {
      if (this.observers.turboFrame.matchElement(element)) {
        this.observers.turboFrame.elementUnmatched(element)
      }

      if (this.observers.turboCable.matchElement(element)) {
        this.observers.turboCable.elementUnmatched(element)
      }

      if (this.observers.stimulus.matchElement(element)) {
        this.observers.stimulus.elementUnmatched(element)
      }

      if (this.observers.turboAttributes.matchElement(element)) {
        this.observers.turboAttributes.elementUnmatched(element)
      }
    }

    elementAttributeChanged(element, attributeName, oldValue) {
      if (this.observers.turboFrame.matchElement(element)) {
        this.observers.turboFrame.elementAttributeChanged(element, attributeName, oldValue)
      }

      if (this.observers.turboCable.matchElement(element)) {
        this.observers.turboCable.elementAttributeChanged(element, attributeName, oldValue)
      }

      if (this.observers.stimulus.matchElement(element)) {
        this.observers.stimulus.elementAttributeChanged(element, attributeName, oldValue)
      }

      if (this.observers.turboAttributes.matchElement(element)) {
        this.observers.turboAttributes.elementAttributeChanged(element, attributeName, oldValue)
      }
    }

    // Delegate methods
    turboFramesChanged() {
      this.sendTurboFrames()
    }
    turboCableChanged() {
      this.sendTurboCableData()
    }
    stimulusDataChanged() {
      this.sendStimulusData()
    }
    turboPermanentElementsChanged() {
      this.sendTurboPermanentElements()
    }
    turboTemporaryElementsChanged() {
      this.sendTurboTemporaryElements()
    }

    sendTurboFrames = debounce(() => {
      this._postMessage({
        frames: this.observers.turboFrame.getFrameData(),
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_TURBO_FRAMES,
      })
    }, 10)

    sendTurboCableData = debounce(() => {
      this._postMessage({
        turboCables: this.observers.turboCable.getTurboCableData(),
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_TURBO_CABLES,
      })
    }, 10)

    sendTurboEvent = (eventName, event) => {
      const uuid = generateUUID()
      const time = new Date().toLocaleTimeString()
      const serializedTargetTag = event.target ? stringifyHTMLElementTag(event.target, false) : null
      const serializedTargetTagShallow = event.target ? stringifyHTMLElementTagShallow(event.target, false) : null
      const details = event.detail ? safeStringifyEventDetail(event.detail) : {}
      const keysToRemove = ["fetchResponse", "newStream", "currentElement", "newElement"]
      keysToRemove.forEach((key) => {
        if (details[key]) {
          delete details[key]
        }
      })

      let turboStreamContent
      let action
      let targetSelector
      if (eventName === "turbo:before-stream-render") {
        const target = event.target.getAttribute("target")
        const targets = event.target.getAttribute("targets")

        turboStreamContent = event.target.outerHTML
        action = event.target.getAttribute("action")
        targetSelector = target ? `#${target}` : targets
      }

      this._postMessage({
        type: BACKEND_TO_PANEL_MESSAGES.TURBO_EVENT_RECEIVED,
        turboEvent: {
          uuid,
          time,
          serializedTargetTag,
          serializedTargetTagShallow,
          eventName,
          details,
          turboStreamContent,
          action,
          targetSelector,
          targetElementPath: event.target ? getElementPath(event.target) : null,
        },
      })
    }

    sendStimulusData = debounce(() => {
      this._postMessage({
        stimulusData: this.observers.stimulus.getStimulusData(),
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_STIMULUS_DATA,
      })
    }, 10)

    sendRegisteredStimulusControllers = () => {
      this._postMessage({
        identifiers: Array.from(window.Stimulus?.router.modulesByIdentifier.keys() || []),
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_REGISTERED_STIMULUS_IDENTIFIERS,
      })
    }

    sendTurboPermanentElements = debounce(() => {
      this._postMessage({
        turboPermanentElements: this.observers.turboAttributes.getPermanentElementsData(),
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_TURBO_PERMANENT_ELEMENTS,
      })
    }, 10)

    sendTurboTemporaryElements = debounce(() => {
      this._postMessage({
        turboTemporaryElements: this.observers.turboAttributes.getTemporaryElementsData(),
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_TURBO_TEMPORARY_ELEMENTS,
      })
    }, 10)

    sendTurboConfig = debounce(() => {
      const getMetaContent = (name) => {
        const element = document.querySelector(`meta[name="${name}"]`)
        return element ? element.getAttribute("content") : null
      }

      this._postMessage({
        turboConfig: {
          turboDriveEnabled: typeof window.Turbo?.session?.drive === "boolean" ? window.Turbo.session.drive : null,
          prefetchDisabled: getMetaContent("turbo-prefetch") === "false",
          refreshMethod: getMetaContent("turbo-refresh-method"),
          visitControl: getMetaContent("turbo-visit-control"),
          cacheControl: getMetaContent("turbo-cache-control"),
        },
        url: btoa(window.location.href),
        type: BACKEND_TO_PANEL_MESSAGES.SET_TURBO_CONFIG,
      })
    }, 200)

    sendAllState() {
      this.sendTurboFrames()
      this.sendTurboCableData()
      this.sendStimulusData()
      this.sendRegisteredStimulusControllers()
      this.sendTurboPermanentElements()
      this.sendTurboTemporaryElements()
      this.sendTurboConfig()
    }

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

    showTurboFrameConnections(turboFrameId, triggerSelector) {
      this.removeTurboFrameConnections()
      if (!turboFrameId || !triggerSelector) {
        return
      }

      document.querySelectorAll(triggerSelector).forEach((trigger) => {
        const turboFrame = document.getElementById(trigger.dataset.turboFrame)
        if (turboFrame) {
          new LeaderLine(trigger, turboFrame)
        }
      })
    }

    removeTurboFrameConnections() {
      document.querySelectorAll(".leader-line").forEach((line) => line.remove())
    }

    getElementsByPayload(payload) {
      if (payload.elementPath) {
        return [getElementFromIndexPath(payload.elementPath)]
      } else if (payload.selector) {
        return document.querySelectorAll(payload.selector)
      }
      return null
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
      case PANEL_TO_BACKEND_MESSAGES.REFRESH_TURBO_FRAME: {
        devtoolsBackend.refreshTurboFrame(e.data.payload.id)
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.REFRESH_ALL_STATE: {
        devtoolsBackend.sendAllState()
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.HIGHLIGHT_ELEMENT: {
        const elements = devtoolsBackend.getElementsByPayload(e.data.payload)
        addHighlightOverlayToElements(elements)
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.HIDE_HIGHLIGHTING: {
        const elements = devtoolsBackend.getElementsByPayload(e.data.payload)
        if (elements) {
          removeHighlightOverlay(elements)
        } else {
          removeHighlightOverlay()
        }
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.SCROLL_AND_HIGHLIGHT: {
        const elements = devtoolsBackend.getElementsByPayload(e.data.payload)

        if (elements) {
          const element = elements[0]
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          addHighlightOverlayToElements(element)
          setTimeout(() => {
            removeHighlightOverlay()
          }, 1000)
        } else {
          console.warn("Element not found for selector:", "${selector}")
        }
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.UPDATE_DATA_ATTRIBUTE: {
        const elements = devtoolsBackend.getElementsByPayload(e.data.payload)

        if (elements) {
          elements.forEach((element) => {
            if (e.data.payload.value === null || e.data.payload.value === undefined || e.data.payload.value === "") {
              element.removeAttribute(e.data.payload.key)
            } else {
              element.setAttribute(e.data.payload.key, e.data.payload.value)
            }
          })
        }
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.SHOW_TURBO_FRAME_CONNECTIONS: {
        const turboFrameId = e.data.payload.turboFrameId
        const triggerSelector = e.data.payload.triggerSelector

        devtoolsBackend.showTurboFrameConnections(turboFrameId, triggerSelector)
        break
      }
      case PANEL_TO_BACKEND_MESSAGES.HIDE_TURBO_FRAME_CONNECTIONS: {
        devtoolsBackend.removeTurboFrameConnections()
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
