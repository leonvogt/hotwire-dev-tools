import DOMScanner from "$utils/dom_scanner"
import { getElementPath, serializeAttributes } from "$utils/utils"
import { WARNING_TYPES } from "$lib/constants"

// Inspects the page for common Hotwire misconfigurations and returns them as
// structured, serializable warning objects. The same collection is used both
// for console logging (content.js) and for the DevTools Warnings tab (backend.js).
export default class DiagnosticsChecker {
  collect(registeredStimulusControllers = []) {
    this.warnings = []
    this.seenIds = new Set()
    this.registeredStimulusControllers = registeredStimulusControllers

    this._checkForDuplicatedTurboFrames()
    this._checkForNonRegisteredStimulusControllers()
    this._checkTurboPermanentElements()
    this._checkStimulusTargetsNesting()

    return this.warnings
  }

  _addWarning = ({ id, type, title, message, element = null, docsUrl = null }) => {
    if (this.seenIds.has(id)) return
    this.seenIds.add(id)

    this.warnings.push({
      id,
      type,
      severity: "warning",
      title,
      message,
      docsUrl,
      element: this._serializeElement(element),
    })
  }

  _serializeElement = (element) => {
    if (!(element instanceof Element)) return null

    return {
      elementPath: getElementPath(element),
      tagName: element.tagName.toLowerCase(),
      attributes: serializeAttributes(element),
      id: element.id || null,
    }
  }

  _checkForDuplicatedTurboFrames = () => {
    // Ignore frames without an ID — they can't be "duplicate IDs", and an empty
    // id would produce the invalid selector `turbo-frame#`, throwing in querySelector.
    const turboFramesIds = DOMScanner.turboFrameIds.filter((id) => id !== "")
    const duplicatedIds = new Set(turboFramesIds.filter((id, index) => turboFramesIds.indexOf(id) !== index))

    duplicatedIds.forEach((id) => {
      this._addWarning({
        id: `${WARNING_TYPES.DUPLICATE_TURBO_FRAME}:${id}`,
        type: WARNING_TYPES.DUPLICATE_TURBO_FRAME,
        title: `Duplicate Turbo Frame ID '${id}'`,
        message: `Multiple Turbo Frames with the same ID '${id}' detected. This can cause unexpected behavior. Ensure that each Turbo Frame has a unique ID.`,
        element: document.querySelector(`turbo-frame#${CSS.escape(id)}`),
      })
    })
  }

  _checkForNonRegisteredStimulusControllers = () => {
    if (this.registeredStimulusControllers.length === 0) return

    DOMScanner.uniqueStimulusControllerIdentifiers.forEach((controllerId) => {
      // Bridge components are only registered in the Mobile app,
      // so we don't want to show warnings for them in the web app.
      // Ideally, we'd verify whether a controller is truly a bridge component,
      // but since we have limited insight into the Stimulus application,
      // we just use a simple prefix check.
      const isBridgeComponent = controllerId.startsWith("native--") || controllerId.startsWith("bridge--")
      const controllerRegistered = this.registeredStimulusControllers.includes(controllerId)
      if (controllerRegistered || isBridgeComponent) return

      this._addWarning({
        id: `${WARNING_TYPES.UNREGISTERED_STIMULUS_CONTROLLER}:${controllerId}`,
        type: WARNING_TYPES.UNREGISTERED_STIMULUS_CONTROLLER,
        title: `Unregistered Stimulus controller '${controllerId}'`,
        message: `The Stimulus controller '${controllerId}' does not appear to be registered. Learn more about registering Stimulus controllers here: https://stimulus.hotwired.dev/handbook/installing.`,
        element: document.querySelector(`[data-controller~="${controllerId}"]`),
        docsUrl: "https://stimulus.hotwired.dev/handbook/installing",
      })
    })
  }

  _checkStimulusTargetsNesting = () => {
    DOMScanner.uniqueStimulusControllerIdentifiers.forEach((controllerId) => {
      const dataSelector = `data-${controllerId}-target`
      const targetElements = document.querySelectorAll(`[${dataSelector}]`)
      targetElements.forEach((element) => {
        const parent = element.closest(`[data-controller~="${controllerId}"]`)
        if (parent) return

        const targetName = element.getAttribute(dataSelector)
        this._addWarning({
          id: `${WARNING_TYPES.STIMULUS_TARGET_OUTSIDE_CONTROLLER}:${controllerId}/${targetName}`,
          type: WARNING_TYPES.STIMULUS_TARGET_OUTSIDE_CONTROLLER,
          title: `Stimulus target '${targetName}' outside its controller`,
          message: `The Stimulus target '${targetName}' is not inside the Stimulus controller '${controllerId}'`,
          element,
        })
      })
    })
  }

  _checkTurboPermanentElements = () => {
    const turboPermanentElements = DOMScanner.turboPermanentElements
    if (turboPermanentElements.length === 0) return

    turboPermanentElements.forEach((element) => {
      const id = element.id
      if (id === "") {
        this._addWarning({
          id: WARNING_TYPES.TURBO_PERMANENT_ELEMENT_MISSING_ID,
          type: WARNING_TYPES.TURBO_PERMANENT_ELEMENT_MISSING_ID,
          title: `Turbo Permanent Element without an ID`,
          message: `Turbo Permanent Element detected without an ID. Turbo Permanent Elements must have a unique ID to work correctly.`,
          element,
        })
      }

      const idIsDuplicated = id && document.querySelectorAll(`#${CSS.escape(id)}`).length > 1
      if (idIsDuplicated) {
        this._addWarning({
          id: `${WARNING_TYPES.TURBO_PERMANENT_ELEMENT_DUPLICATE_ID}:${id}`,
          type: WARNING_TYPES.TURBO_PERMANENT_ELEMENT_DUPLICATE_ID,
          title: `Turbo Permanent Element with duplicate ID '${id}'`,
          message: `Turbo Permanent Element with ID '${id}' doesn't have a unique ID. Turbo Permanent Elements must have a unique ID to work correctly.`,
          element,
        })
      }
    })
  }
}
