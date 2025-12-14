import { ensureUUIDOnElement, getUUIDFromElement, stringifyHTMLElementTag, getElementPath, serializeAttributes } from "$utils/utils.js"

export default class TurboAttributeElementsObserver {
  constructor(delegate) {
    this.delegate = delegate
    this.permanentElements = new Map() // UUID -> element data
    this.temporaryElements = new Map() // UUID -> element data
  }

  matchElement(element) {
    return element && element.hasAttribute && (element.hasAttribute("data-turbo-permanent") || element.hasAttribute("data-turbo-temporary"))
  }

  matchElementsInTree(tree) {
    if (!tree || !tree.querySelectorAll) return []

    const match = this.matchElement(tree) ? [tree] : []
    const permanentMatches = Array.from(tree.querySelectorAll("[data-turbo-permanent]"))
    const temporaryMatches = Array.from(tree.querySelectorAll("[data-turbo-temporary]"))
    return match.concat(permanentMatches, temporaryMatches)
  }

  elementMatched(element) {
    if (!element || !element.hasAttribute) return

    const uuid = ensureUUIDOnElement(element)
    const isPermanent = element.hasAttribute("data-turbo-permanent")
    const isTemporary = element.hasAttribute("data-turbo-temporary")

    if (isPermanent) {
      if (!this.permanentElements.has(uuid)) {
        const elementData = this.buildElementData(element, "permanent")
        this.permanentElements.set(uuid, elementData)
        this.delegate.turboPermanentElementsChanged()
      }
    }

    if (isTemporary) {
      if (!this.temporaryElements.has(uuid)) {
        const elementData = this.buildElementData(element, "temporary")
        this.temporaryElements.set(uuid, elementData)
        this.delegate.turboTemporaryElementsChanged()
      }
    }
  }

  elementUnmatched(element) {
    const uuid = getUUIDFromElement(element)

    if (uuid) {
      let changed = false

      if (this.permanentElements.has(uuid)) {
        this.permanentElements.delete(uuid)
        changed = true
      }

      if (this.temporaryElements.has(uuid)) {
        this.temporaryElements.delete(uuid)
        changed = true
      }

      if (changed) {
        this.delegate.turboPermanentElementsChanged()
        this.delegate.turboTemporaryElementsChanged()
      }
    }
  }

  elementAttributeChanged(element, attributeName, oldValue) {
    if (!element || !element.hasAttribute) return

    if (attributeName === "data-turbo-permanent" || attributeName === "data-turbo-temporary") {
      const uuid = getUUIDFromElement(element)

      if (uuid) {
        // Remove from both maps first
        const wasPermanent = this.permanentElements.has(uuid)
        const wasTemporary = this.temporaryElements.has(uuid)

        this.permanentElements.delete(uuid)
        this.temporaryElements.delete(uuid)

        // Re-add if element still matches
        if (this.matchElement(element)) {
          this.elementMatched(element)
        } else if (wasPermanent || wasTemporary) {
          this.delegate.turboPermanentElementsChanged()
          this.delegate.turboTemporaryElementsChanged()
        }
      }
    }
  }

  buildElementData(element, type) {
    return {
      uuid: getUUIDFromElement(element),
      id: element.id || null,
      attributes: serializeAttributes(element),
      tag: element.tagName.toLowerCase(),
      classes: Array.from(element.classList),
      serializedElement: stringifyHTMLElementTag(element),
      elementPath: getElementPath(element),
      type: type,
      innerHTML: element.innerHTML?.substring(0, 500) || "", // Truncate for performance
      outerHTML: element.outerHTML?.substring(0, 1000) || "", // Truncate for performance
    }
  }

  getPermanentElementsData() {
    return Array.from(this.permanentElements.values())
  }

  getTemporaryElementsData() {
    return Array.from(this.temporaryElements.values())
  }
}
