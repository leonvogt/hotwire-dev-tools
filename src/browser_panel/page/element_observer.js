export default class ElementObserver {
  constructor(element, delegate) {
    this.element = element
    this.delegate = delegate
    this.started = false
    this.elements = new Set()

    this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations))

    this.mutationObserverInit = {
      attributes: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
    }
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
      const elements = this.matchElementsInTree()
      for (const element of elements) {
        this.matchElement(element)
      }
    }
  }

  matchElementsInTree(tree = this.element) {
    return this.delegate.matchElementsInTree(tree)
  }

  matchElement(element) {
    if (!this.elements.has(element) && this.delegate.matchElement(element)) {
      this.elements.add(element)
      if (this.delegate.elementMatched) {
        this.delegate.elementMatched(element)
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

  processRemovedNodes(nodes) {
    for (const node of Array.from(nodes)) {
      const element = this.elementFromNode(node)
      if (element) {
        this.processTree(element, this.removeElement)
      }
    }
  }

  processAddedNodes(nodes) {
    for (const node of Array.from(nodes)) {
      const element = this.elementFromNode(node)
      if (element) {
        this.processTree(element, this.matchElement)
      }
    }
  }

  processAttributeChange(node, attributeName, oldValue) {
    if (attributeName == "data-hotwire-dev-tools-id") return

    const element = this.elementFromNode(node)
    if (element && this.elements.has(element)) {
      if (this.delegate.elementAttributeChanged) {
        this.delegate.elementAttributeChanged(element, attributeName, oldValue)
      }
    }
  }

  elementFromNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return node
    }
  }

  processTree(tree, processor) {
    for (const element of this.matchElementsInTree(tree)) {
      processor.call(this, element)
    }
  }

  removeElement(element) {
    if (this.elements.has(element)) {
      this.elements.delete(element)
      if (this.delegate.elementUnmatched) {
        this.delegate.elementUnmatched(element)
      }
    }
  }
}
