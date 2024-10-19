import DOMScanner from "../utils/dom_scanner"

export default class DiagnosticsChecker {
  constructor(devTool) {
    this.devTool = devTool
    this.printedWarnings = []
    this.logger = console
  }

  printWarning = (message, once = true) => {
    if (once && this.printedWarnings.includes(message)) return

    this.logger.warn(`Hotwire Dev Tools: ${message}`)
    this.printedWarnings.push(message)
  }

  checkForWarnings = () => {
    this._checkForDuplicatedTurboFrames()
    this._checkForNonRegisteredStimulusControllers()
  }

  _checkForDuplicatedTurboFrames = () => {
    const turboFramesIds = DOMScanner.turboFrameIds
    const duplicatedIds = turboFramesIds.filter((id, index) => turboFramesIds.indexOf(id) !== index)

    duplicatedIds.forEach((id) => {
      this.printWarning(`Multiple Turbo Frames with the same ID: ${id}`)
    })
  }

  _checkForNonRegisteredStimulusControllers = () => {
    const registeredStimulusControllers = this.devTool.registeredStimulusControllers
    if (registeredStimulusControllers.length === 0) return

    DOMScanner.uniqueStimulusControllerIdentifiers.forEach((controllerId) => {
      const controllerRegistered = registeredStimulusControllers.includes(controllerId)

      if (!controllerRegistered) {
        this.printWarning(`Stimulus controller "${controllerId}" seems to be not registered`)
      }
    })
  }
}
