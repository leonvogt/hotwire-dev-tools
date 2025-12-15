import { ensureUUIDOnElement, getUUIDFromElement, capitalizeFirstChar, serializeAttributes } from "$utils/utils.js"

export default class StimulusObserver {
  constructor(delegate) {
    this.delegate = delegate
    this.controllerElements = new Map() // UUID -> [controller data]
  }

  matchElement(element) {
    const controllerValue = element.dataset?.controller
    if (controllerValue === undefined) return false
    const identifiers = controllerValue
      .split(" ")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
    return identifiers.length > 0
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
    this.delegate.stimulusDataChanged()
  }

  elementUnmatched(element) {
    const uuid = getUUIDFromElement(element)

    if (this.controllerElements.has(uuid)) {
      this.controllerElements.delete(uuid)
      this.delegate.stimulusDataChanged()
    }
  }

  elementAttributeChanged(element, attributeName, oldValue) {
    if (attributeName == "data-hotwire-dev-tools-uuid") return
    if (this.matchElement(element)) {
      const uuid = getUUIDFromElement(element)
      if (this.controllerElements.has(uuid)) {
        const newControllerElementData = this.controllerElements.get(uuid).map((controllerData) => {
          return this.buildStimulusElementData(element, controllerData.identifier)
        })
        this.controllerElements.set(uuid, newControllerElementData)
        this.delegate.stimulusDataChanged()
      }
    }
  }

  buildStimulusElementData(element, identifier) {
    const controller = window.Stimulus?.getControllerForElementAndIdentifier(element, identifier)
    return {
      id: element.id,
      uuid: getUUIDFromElement(element),
      identifier: identifier,
      targetsAttribute: controller?.context?.schema?.targetAttributeForScope(controller?.identifier),
      attributes: serializeAttributes(element),
      tagName: element.tagName.toLowerCase(),
      values: this.buildControllerValues(controller),
      targets: this.buildControllerTargets(controller),
      outlets: this.buildControllerOutlets(controller),
      classes: this.buildControllerClasses(controller),
      actions: this.buildControllerActions(controller),
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
        key: targetKey.replace("Target", ""),
        elements: Array.from(targets).map((target) => {
          return {
            id: target.id,
            uuid: ensureUUIDOnElement(target),
            attributes: serializeAttributes(target),
            tagName: target.tagName.toLowerCase(),
          }
        }),
      }
    })
  }

  buildControllerOutlets(controller) {
    if (!controller) return []

    const keys = Object.keys(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(controller)))
    const outletKeys = keys.filter((key) => key.endsWith("Outlet") && !key.startsWith("has"))
    return outletKeys.map((outletKey) => {
      const outlets = controller[`has${capitalizeFirstChar(outletKey)}`] ? controller[`${outletKey}s`] : []
      const key = outletKey.replace("Outlet", "")
      return {
        name: outletKey,
        key: key,
        htmlAttribute: `${controller.context.schema.outletAttributeForScope(controller.identifier, key)}=""`,
        selector: controller.outlets.getSelectorForOutletName(key),
        elements: Array.from(outlets).map((outlet) => {
          return {
            id: outlet.id,
            uuid: ensureUUIDOnElement(outlet.element),
            attributes: serializeAttributes(outlet.element),
            tagName: outlet.element.tagName.toLowerCase(),
          }
        }),
      }
    })
  }

  buildControllerClasses(controller) {
    if (!controller) return []

    const keys = Object.keys(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(controller)))
    const classKeys = keys.filter((key) => key.endsWith("Class") && !key.startsWith("has"))
    return classKeys.map((classKey) => {
      const classes = controller[`has${capitalizeFirstChar(classKey)}`] ? controller[`${classKey}es`] : []
      const key = classKey.replace("Class", "")
      return {
        name: classKey,
        key: key,
        htmlAttribute: `${controller.classes.getAttributeName(key)}=""`,
        classes: Array.from(classes),
      }
    })
  }

  buildControllerActions(controller) {
    if (!controller?.context?.bindingObserver) return []

    return controller.context.bindingObserver.bindings.map((binding) => {
      const action = binding.action
      return {
        descriptor: action.toString(),
        eventName: action.eventName,
        methodName: action.methodName,
        element: {
          id: action.element.id || null,
          attributes: serializeAttributes(action.element),
          tagName: action.element.tagName.toLowerCase(),
          classes: Array.from(action.element.classList),
          uuid: ensureUUIDOnElement(action.element),
        },
        keyFilter: action.keyFilter || null,
        eventTarget: action.eventTargetName || "element",
        params: action.params,
        hasParams: Object.keys(action.params).length > 0,
      }
    })
  }

  getStimulusData() {
    const allControllers = []

    this.controllerElements.forEach((controllersData) => {
      controllersData.forEach((controllerData) => {
        allControllers.push(controllerData)
      })
    })

    // Remove DOM elements before sending
    const stripDOMElements = (data) => {
      const { element, ...cleanData } = data
      return cleanData
    }

    return allControllers.map((controller) => stripDOMElements(controller))
  }
}
