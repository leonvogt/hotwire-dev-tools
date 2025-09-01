// ;[
//   {
//     controllers: [
//       {
//         identifier: "my-controller",
//         selector: "[data-controller~='my-controller']",
//         values: [{ name: "auto-start", value: "true" }],
//         class: "my-controller",
//       },
//     ],
//     targets: [{ name: "item", selector: "[data-my-controller-target='item']" }],
//   },
// ]

import { ensureUUIDOnElement, getUUIDFromElement, stringifyHTMLElementTag, getElementPath } from "$utils/utils.js"

export default class StimulusObserver {
  constructor(delegate) {
    console.log("StimulusObserver initialized")

    this.delegate = delegate
    this.controllers = new Map() // UUID -> controller data
  }

  matchElement(element) {
    if (element.dataset?.controller !== undefined) return true

    return false
    // return this.elementHasStimulusAttributes(element)
  }

  matchElementsInTree(tree) {
    const match = this.matchElement(tree) ? [tree] : []
    const matches = Array.from(tree.querySelectorAll("*")).filter((el) => this.matchElement(el))
    return match.concat(matches)
  }

  elementMatched(element) {
    const uuid = ensureUUIDOnElement(element)

    if (!this.controllers.has(uuid)) {
      const controllerData = this.buildStimulusElementData(element)
      this.controllers.set(uuid, controllerData)
      this.delegate.stimulusControllerConnected(element)
    }
  }

  elementUnmatched(element) {
    const uuid = getUUIDFromElement(element)

    if (this.controllers.has(uuid)) {
      this.controllers.delete(uuid)
      this.delegate.stimulusControllerDisonnected(element)
    }
  }

  elementAttributeChanged(element, attributeName, oldValue) {
    if (this.matchElement(element)) {
      const uuid = getUUIDFromElement(element)
      if (this.controllers.has(uuid)) {
        const controllerData = this.controllers.get(uuid)
        const newValue = element.getAttribute(attributeName)

        if (newValue === null) {
          delete controllerData.attributes[attributeName]
        } else {
          controllerData.attributes[attributeName] = newValue
        }

        controllerData.serializedTag = stringifyHTMLElementTag(element)

        this.delegate.stimulusControllerChanged(element, attributeName, oldValue, newValue)
      }
    }
  }

  buildStimulusElementData(element) {
    return {
      id: element.id,
      uuid: getUUIDFromElement(element),
      identifier: element.dataset.controller,
      serializedTag: stringifyHTMLElementTag(element),
      attributes: Array.from(element.attributes).reduce((map, attr) => {
        map[attr.name] = attr.value
        return map
      }, {}),
      children: [],
      element,
    }
  }

  getStimulusData() {
    const buildStimulusTree = () => {
      const root = []
      this.controllers.forEach((controllerData) => {
        controllerData.children = []
      })

      this.controllers.forEach((controllerData) => {
        const element = controllerData.element
        const parentElement = element.parentElement?.closest("[data-controller]")

        if (parentElement) {
          const parentUUID = getUUIDFromElement(parentElement)
          if (parentUUID && this.controllers.has(parentUUID)) {
            this.controllers.get(parentUUID).children.push(controllerData)
          } else {
            // Parent exists but not in our tracking => add as root
            root.push(controllerData)
          }
        } else {
          // No parent frame => this is a root frame
          root.push(controllerData)
        }
      })

      return root
    }

    // Remove DOM elements before sending
    const stripDOMElements = (frameData) => {
      const { element, children, ...cleanData } = frameData
      const strippedChildren = children.map((child) => stripDOMElements(child))
      return { ...cleanData, children: strippedChildren }
    }

    const controllerTree = buildStimulusTree()
    return controllerTree.map((element) => stripDOMElements(element))
  }

  elementHasStimulusAttributes(element) {
    return Array.from(element.attributes).some((attr) => {
      return attr.name.startsWith("data-") && (attr.name.endsWith("-target") || attr.name.endsWith("-value") || attr.name.endsWith("-action") || attr.name.endsWith("-outlet") || attr.name.endsWith("-class"))
    })
  }
}
