import { ensureUUIDOnElement, getUUIDFromElement, serializeAttributes } from "$utils/utils.js"

// The TurboCableObserver class is responsible for observing `<turbo-cable-stream-source>` elements,
// which are used in Turbo Streams to manage WebSocket connections.
export default class TurboCableObserver {
  constructor(delegate) {
    this.delegate = delegate
    this.streamSources = new Map() // UUID -> Turbo Cable Stream Source data
  }

  matchElement(element) {
    return element.tagName?.toLowerCase() === "turbo-cable-stream-source"
  }

  matchElementsInTree(tree) {
    const match = this.matchElement(tree) ? [tree] : []
    const matches = Array.from(tree.querySelectorAll("turbo-cable-stream-source"))
    return match.concat(matches)
  }

  elementMatched(element) {
    const uuid = ensureUUIDOnElement(element)

    if (!this.streamSources.has(uuid)) {
      const turboCableData = this.buildTurboCableData(element)
      this.streamSources.set(uuid, turboCableData)
      this.delegate.turboCableChanged()
    }
  }

  elementUnmatched(element) {
    const uuid = getUUIDFromElement(element)

    if (this.streamSources.has(uuid)) {
      this.streamSources.delete(uuid)
      this.delegate.turboCableChanged()
    }
  }

  elementAttributeChanged(element, attributeName, oldValue) {
    if (this.matchElement(element)) {
      const uuid = getUUIDFromElement(element)
      if (this.streamSources.has(uuid)) {
        const turboCableData = this.streamSources.get(uuid)
        const newValue = element.getAttribute(attributeName)

        if (newValue === null) {
          delete turboCableData.attributes[attributeName]
        } else {
          turboCableData.attributes[attributeName] = newValue
        }
        turboCableData.connected = element.hasAttribute("connected")

        this.delegate.turboCableChanged()
      }
    }
  }

  buildTurboCableData(element) {
    return {
      connected: element.hasAttribute("connected"),
      attributes: serializeAttributes(element),
    }
  }

  getTurboCableData() {
    return Array.from(this.streamSources.values())
  }
}
