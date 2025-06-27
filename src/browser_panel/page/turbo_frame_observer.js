export default class TurboFrameObserver {
  constructor(delegate = {}) {
    this.element = document
    this.started = false
    this.delegate = delegate
    this.frames = new Set()

    this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations))
    this.mutationObserverInit = { attributes: true, childList: true, subtree: true, attributeOldValue: true }
  }

  start() {
    if (!this.started) {
      this.started = true
      this.mutationObserver.observe(this.element, this.mutationObserverInit)
      this.refresh()
    }
  }

  stop() {
    if (this.started) {
      this.mutationObserver.takeRecords()
      this.mutationObserver.disconnect()
      this.started = false
    }
  }

  refresh() {
    if (this.started) {
      const frames = new Set(this.findAllTurboFrames())

      // Remove frames that no longer exist
      for (const frame of Array.from(this.frames)) {
        if (!frames.has(frame)) {
          this.removeFrame(frame)
        }
      }

      // Add new frames
      for (const frame of Array.from(frames)) {
        if (!this.frames.has(frame)) {
          this.addFrame(frame)
        }
      }
    }
  }

  processMutations(mutations) {
    if (this.started) {
      for (const mutation of mutations) {
        this.processMutation(mutation)
      }
    }
  }

  processMutation(mutation) {
    if (mutation.type === "childList") {
      this.processRemovedNodes(mutation.removedNodes)
      this.processAddedNodes(mutation.addedNodes)
    } else if (mutation.type === "attributes") {
      this.processAttributeChange(mutation.target, mutation.attributeName, mutation.oldValue)
    }
  }

  processAttributeChange(element, attributeName, oldValue) {
    if (this.isTurboFrame(element) && this.frames.has(element)) {
      const newValue = element.getAttribute(attributeName)
      if (this.delegate.frameAttributeChanged) {
        this.delegate.frameAttributeChanged(element, attributeName, oldValue, newValue)
      }
    }
  }

  processRemovedNodes(nodes) {
    for (const node of Array.from(nodes)) {
      if (this.isTurboFrame(node)) {
        this.removeFrame(node)
      }

      if (node.querySelectorAll) {
        const frames = node.querySelectorAll("turbo-frame")
        for (const frame of frames) {
          this.removeFrame(frame)
        }
      }
    }
  }

  processAddedNodes(nodes) {
    for (const node of Array.from(nodes)) {
      if (this.isTurboFrame(node)) {
        this.addFrame(node)
      }

      if (node.querySelectorAll) {
        const frames = node.querySelectorAll("turbo-frame")
        for (const frame of frames) {
          this.addFrame(frame)
        }
      }
    }
  }

  isTurboFrame(node) {
    return node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === "turbo-frame"
  }

  findAllTurboFrames() {
    return Array.from(document.querySelectorAll("turbo-frame"))
  }

  addFrame(frame) {
    if (!this.frames.has(frame)) {
      this.frames.add(frame)
      if (this.delegate.frameConnected) {
        this.delegate.frameConnected(frame)
      }
    }
  }

  removeFrame(frame) {
    if (this.frames.has(frame)) {
      this.frames.delete(frame)
      if (this.delegate.frameDisconnected) {
        this.delegate.frameDisconnected(frame)
      }
    }
  }
}
