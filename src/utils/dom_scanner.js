export default class DOMScanner {
  static SHADOW_CONTAINER_ID = "hotwire-dev-tools-shadow-container"
  static TURBO_FRAME_OVERLAY_CLASS_NAME = "hotwire-dev-tools-highlight-overlay-turbo-frame"

  // Turbo
  static get turboFrameElements() {
    return document.querySelectorAll("turbo-frame")
  }

  static get turboFrameIds() {
    return Array.from(this.turboFrameElements).map((turboFrame) => turboFrame.id)
  }

  // Stimulus
  static get stimulusControllerElements() {
    return document.querySelectorAll("[data-controller]")
  }

  static get stimulusControllerIdentifiers() {
    return Array.from(this.stimulusControllerElements)
      .map((element) => element.dataset.controller.split(" "))
      .flat()
  }

  static get uniqueStimulusControllerIdentifiers() {
    return [...new Set(this.stimulusControllerIdentifiers)]
  }

  static get groupedStimulusControllerElements() {
    const groupedElements = {}
    this.stimulusControllerElements.forEach((element) => {
      element.dataset.controller
        .split(" ")
        .filter((stimulusControllerId) => stimulusControllerId.trim() !== "")
        .forEach((stimulusControllerId) => {
          if (!groupedElements[stimulusControllerId]) {
            groupedElements[stimulusControllerId] = []
          }
          groupedElements[stimulusControllerId].push(element)
        })
    })

    return groupedElements
  }

  // Dev Tools
  static get shadowContainer() {
    return document.getElementById(this.SHADOW_CONTAINER_ID)
  }

  static get turboFrameOverlayElements() {
    return document.querySelectorAll(`.${this.TURBO_FRAME_OVERLAY_CLASS_NAME}`)
  }
}
