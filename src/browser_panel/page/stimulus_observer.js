import { ensureUUIDOnElement, getUUIDFromElement, stringifyHTMLElementTag, capitalizeFirstChar } from "$utils/utils.js"

export default class StimulusObserver {
  constructor(delegate) {
    this.delegate = delegate
    this.controllerElements = new Map() // UUID -> [controller data]
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
    const identifiers = (element.dataset.controller || "")
      .split(" ")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)

    const uuid = ensureUUIDOnElement(element)
    if (!this.controllerElements.has(uuid)) {
      this.controllerElements.set(uuid, [])
    }
    identifiers.forEach((identifier) => {
      const controllerData = this.buildStimulusElementData(element, identifier)
      this.controllerElements.get(uuid).push(controllerData)
    })
    this.delegate.stimulusControllerConnected(element)
  }

  elementUnmatched(element) {
    const uuid = getUUIDFromElement(element)

    if (this.controllerElements.has(uuid)) {
      this.controllerElements.delete(uuid)
      this.delegate.stimulusControllerDisonnected(element)
    }
  }

  elementAttributeChanged(element, attributeName, oldValue) {
    if (attributeName == "data-hotwire-dev-tools-uuid") return
    if (this.matchElement(element)) {
      const uuid = getUUIDFromElement(element)
      if (this.controllerElements.has(uuid)) {
        const newValue = element.getAttribute(attributeName)
        const newControllerElementData = this.controllerElements.get(uuid).map((controllerData) => {
          return this.buildStimulusElementData(element, controllerData.identifier)
        })
        this.controllerElements.set(uuid, newControllerElementData)
        this.delegate.stimulusControllerChanged(element, attributeName, oldValue, newValue)
      }
    }
  }

  buildStimulusElementData(element, identifier) {
    const controller = window.Stimulus.getControllerForElementAndIdentifier(element, identifier)
    return {
      id: element.id,
      uuid: getUUIDFromElement(element),
      identifier: identifier,
      serializedTag: stringifyHTMLElementTag(element),
      attributes: Array.from(element.attributes).reduce((map, attr) => {
        map[attr.name] = attr.value
        return map
      }, {}),
      values: this.buildControllerValues(controller),
      targets: this.buildControllerTargets(controller),
      children: [],
      element,
    }
  }

  buildControllerValues(controller) {
    if (!controller || !controller.valueDescriptorMap) return []

    return Object.values(controller.valueDescriptorMap).map((descriptor) => {
      return {
        key: descriptor.key,
        name: descriptor.name,
        type: descriptor.type,
        defaultValue: descriptor.defaultValue,
        value: controller[descriptor.name],
      }
    })
  }

  buildControllerTargets(controller) {
    if (!controller) return []

    const keys = Object.keys(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(controller)))
    const targetKeys = keys.filter((key) => key.endsWith("Target") && !key.startsWith("has"))
    return targetKeys.map((targetKey) => {
      const targets = controller[`has${capitalizeFirstChar(targetKey)}`] ? controller[`${targetKey}s`] : []
      return {
        name: targetKey,
        elements: Array.from(targets).map((target) => {
          return {
            id: target.id,
            uuid: ensureUUIDOnElement(target),
            serializedTag: stringifyHTMLElementTag(target),
          }
        }),
      }
    })
  }

  getStimulusData() {
    const buildStimulusTree = () => {
      const root = []
      this.controllerElements.forEach((controllersData) => {
        controllersData.forEach((controllerData) => {
          controllerData.children = []
        })
      })

      this.controllerElements.forEach((controllersData) => {
        const controllerData = controllersData[0]
        if (!controllerData) return
        const element = controllerData.element
        const parentElement = element.parentElement?.closest("[data-controller]")

        if (parentElement) {
          const parentUUID = getUUIDFromElement(parentElement)
          if (parentUUID && this.controllerElements.has(parentUUID)) {
            this.controllerElements.get(parentUUID).forEach((parentControllerData) => {
              parentControllerData.children.push(controllerData)
            })
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
    const stripDOMElements = (data) => {
      const { element, children, ...cleanData } = data
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
