import { capitalizeFirstChar, serializeAttributes } from "$utils/utils.js"
import { getElementUUID } from "$page/element_registry.js"

const STIMULUS_ATTRIBUTE = /^data-(controller|action|.+-(target|value|class|outlet))$/

export default class StimulusObserver {
  constructor(delegate) {
    this.delegate = delegate
    this.controllerElements = new Map() // UUID -> element
  }

  identifiersFor(element) {
    return (element.dataset?.controller || "")
      .split(" ")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
  }

  matchElement(element) {
    return this.identifiersFor(element).length > 0
  }

  matchElementsInTree(tree) {
    const match = this.matchElement(tree) ? [tree] : []
    const matches = Array.from(tree.querySelectorAll("*")).filter((el) => this.matchElement(el))
    return match.concat(matches)
  }

  elementMatched(element) {
    this.controllerElements.set(getElementUUID(element), element)
    this.delegate.stimulusDataChanged()
  }

  elementUnmatched(element) {
    if (this.controllerElements.delete(getElementUUID(element))) {
      this.delegate.stimulusDataChanged()
    }
  }

  elementAttributeChanged(element) {
    if (this.controllerElements.has(getElementUUID(element))) {
      this.delegate.stimulusDataChanged()
    }
  }

  // Actions and targets live on descendants of the controller element, so their
  // addition or removal never reaches elementMatched/elementUnmatched.
  isAffectedByMutation(mutation) {
    if (this.controllerElements.size === 0) return false

    if (mutation.type === "attributes") {
      return STIMULUS_ATTRIBUTE.test(mutation.attributeName)
    }

    if (mutation.type === "childList") {
      const nodes = [...mutation.addedNodes, ...mutation.removedNodes]
      return nodes.some((node) => node.nodeType === Node.ELEMENT_NODE) && !!mutation.target.closest?.("[data-controller]")
    }

    return false
  }

  buildStimulusElementData(element, identifier) {
    const controller = window.Stimulus?.getControllerForElementAndIdentifier(element, identifier)
    return {
      id: element.id,
      uuid: getElementUUID(element),
      identifier: identifier,
      attributes: serializeAttributes(element),
      tagName: element.tagName.toLowerCase(),
      values: this.buildControllerValues(controller),
      targets: this.buildControllerTargets(controller),
      outlets: this.buildControllerOutlets(controller),
      classes: this.buildControllerClasses(controller),
      actions: this.buildControllerActions(controller),
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
            uuid: getElementUUID(target),
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
        selector: controller.outlets.getSelectorForOutletName(key),
        elements: Array.from(outlets).map((outlet) => {
          return {
            id: outlet.id,
            uuid: getElementUUID(outlet.element),
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
          uuid: getElementUUID(action.element),
        },
        keyFilter: action.keyFilter || null,
        eventTarget: action.eventTargetName || "element",
        params: action.params,
        hasParams: Object.keys(action.params).length > 0,
      }
    })
  }

  // Built lazily so the snapshot reflects Stimulus' state after it processed the same mutations
  getStimulusData() {
    return Array.from(this.controllerElements.values()).flatMap((element) => this.identifiersFor(element).map((identifier) => this.buildStimulusElementData(element, identifier)))
  }
}
