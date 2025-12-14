import { ensureUUIDOnElement, getUUIDFromElement, stringifyHTMLElementTag, getElementPath, serializeAttributes } from "$utils/utils.js"

export default class TurboFrameObserver {
  constructor(delegate) {
    this.delegate = delegate
    this.frames = new Map() // UUID -> frame data
  }

  matchElement(element) {
    return element.tagName?.toLowerCase() === "turbo-frame"
  }

  matchElementsInTree(tree) {
    const match = this.matchElement(tree) ? [tree] : []
    const matches = Array.from(tree.querySelectorAll("turbo-frame"))
    return match.concat(matches)
  }

  elementMatched(element) {
    const uuid = ensureUUIDOnElement(element)

    if (!this.frames.has(uuid)) {
      const frameData = this.buildFrameData(element)
      this.frames.set(uuid, frameData)
      this.delegate.turboFramesChanged()
    }
  }

  elementUnmatched(element) {
    const uuid = getUUIDFromElement(element)

    if (this.frames.has(uuid)) {
      this.frames.delete(uuid)
      this.delegate.turboFramesChanged()
    }
  }

  elementAttributeChanged(element, attributeName, oldValue) {
    if (this.matchElement(element)) {
      const uuid = getUUIDFromElement(element)
      if (this.frames.has(uuid)) {
        const frameData = this.frames.get(uuid)
        const newValue = element.getAttribute(attributeName)

        if (newValue === null) {
          delete frameData.attributes[attributeName]
        } else {
          frameData.attributes[attributeName] = newValue
        }

        frameData.serializedTag = stringifyHTMLElementTag(element)

        this.delegate.turboFramesChanged()
      }
    }
  }

  buildFrameData(element) {
    return {
      id: element.id,
      uuid: getUUIDFromElement(element),
      serializedTag: stringifyHTMLElementTag(element),
      attributes: serializeAttributes(element),
      tagName: element.tagName.toLowerCase(),
      referenceElements: Array.from(document.querySelectorAll(`[data-turbo-frame='${element.id}']`)).map((element) => {
        return {
          serializedTargetTag: stringifyHTMLElementTag(element, false),
          elementPath: getElementPath(element),
          attributes: serializeAttributes(element),
          tagName: element.tagName.toLowerCase(),
        }
      }),
      children: [],
      element,
    }
  }

  getFrameData() {
    const buildFrameTree = () => {
      const rootFrames = []
      this.frames.forEach((frameData) => {
        frameData.children = []
      })

      this.frames.forEach((frameData) => {
        const element = frameData.element
        const parentElement = element.parentElement?.closest("turbo-frame")

        if (parentElement) {
          const parentUUID = getUUIDFromElement(parentElement)
          if (parentUUID && this.frames.has(parentUUID)) {
            this.frames.get(parentUUID).children.push(frameData)
          } else {
            // Parent exists but not in our tracking => add as root
            rootFrames.push(frameData)
          }
        } else {
          // No parent frame => this is a root frame
          rootFrames.push(frameData)
        }
      })

      return rootFrames
    }

    // Remove DOM elements before sending
    const stripDOMElements = (frameData) => {
      const { element, children, ...cleanData } = frameData
      const strippedChildren = children.map((child) => stripDOMElements(child))
      return { ...cleanData, children: strippedChildren }
    }

    const frameTree = buildFrameTree()
    return frameTree.map((frame) => stripDOMElements(frame))
  }
}
