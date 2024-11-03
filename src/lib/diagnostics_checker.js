import DOMScanner from "../utils/dom_scanner"

export default class DiagnosticsChecker {
  constructor(devTool) {
    this.devTool = devTool
    this.printedWarnings = []
    this.logger = console
  }

  printWarning = (message, once = true, ...extraArgs) => {
    if (once && this.printedWarnings.includes(message)) return

    this.logger.warn(`Hotwire Dev Tools: ${message}`, ...extraArgs)
    this.printedWarnings.push(message)
  }

  checkForWarnings = () => {
    this._checkForDuplicatedTurboFrames()
    this._checkForNonRegisteredStimulusControllers()
    this._checkTurboPermanentElements()
    this._checkStimulusTargetsNesting()
  }

  _checkForDuplicatedTurboFrames = () => {
    const turboFramesIds = DOMScanner.turboFrameIds
    const duplicatedIds = turboFramesIds.filter((id, index) => turboFramesIds.indexOf(id) !== index)

    duplicatedIds.forEach((id) => {
      this.printWarning(`Multiple Turbo Frames with the same ID '${id}' detected. This can cause unexpected behavior. Ensure that each Turbo Frame has a unique ID.`)
    })
  }

  _checkForNonRegisteredStimulusControllers = () => {
    const registeredStimulusControllers = this.devTool.registeredStimulusControllers
    if (registeredStimulusControllers.length === 0) return

    DOMScanner.uniqueStimulusControllerIdentifiers.forEach((controllerId) => {
      const controllerRegistered = registeredStimulusControllers.includes(controllerId)

      if (!controllerRegistered) {
        this.printWarning(`The Stimulus controller '${controllerId}' does not appear to be registered. Learn more about registering Stimulus controllers here: https://stimulus.hotwired.dev/handbook/installing.`)
      }
    })
  }

  _checkStimulusTargetsNesting = () => {
    DOMScanner.uniqueStimulusControllerIdentifiers.forEach((controllerId) => {
      const dataSelector = `data-${controllerId}-target`
      const targetElements = document.querySelectorAll(`[${dataSelector}`)
      targetElements.forEach((element) => {
        const parent = element.closest(`[data-controller="${controllerId}"]`)
        if (!parent) {
          const targetName = element.getAttribute(`${dataSelector}`)
          this.printWarning(`The Stimulus target '${targetName}' is not inside the Stimulus controller '${controllerId}'`)
        }
      })
    })
  }

  _checkTurboPermanentElements = () => {
    const turboPermanentElements = DOMScanner.turboPermanentElements
    if (turboPermanentElements.length === 0) return

    turboPermanentElements.forEach((element) => {
      const id = element.id
      if (id === "") {
        const message = `Hotwire Dev Tools: Turbo Permanent Element detected without an ID. Turbo Permanent Elements must have a unique ID to work correctly.`
        this.printWarning(message, true, element)
      }

      const idIsDuplicated = id && document.querySelectorAll(`#${id}`).length > 1
      if (idIsDuplicated) {
        const message = `Hotwire Dev Tools: Turbo Permanent Element with ID '${id}' doesn't have a unique ID. Turbo Permanent Elements must have a unique ID to work correctly.`
        this.printWarning(message, true, element)
      }
    })
  }
}
