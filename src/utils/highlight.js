export const addHighlightOverlayToElements = (elementsOrSelector, color = "#007aff", overlayClassName = "hotwire-dev-tools-highlight-overlay", opacity = "0.2") => {
  removeHighlightOverlay()
  let elements = []

  if (typeof elementsOrSelector === "string") {
    elements = Array.from(document.querySelectorAll(elementsOrSelector))
  } else if (Array.isArray(elementsOrSelector) || elementsOrSelector instanceof NodeList || elementsOrSelector instanceof HTMLCollection) {
    elements = elementsOrSelector
  } else if (elementsOrSelector instanceof Element) {
    elements = [elementsOrSelector]
  }

  elements.forEach((element) => {
    const rect = element.getBoundingClientRect()

    // If the element is inside a dialog, use the dialog as the container
    // If we don't place the highlight inside the dialog, it will be clipped by the dialog
    const container = element.closest("dialog") || document.body
    createOverlay(rect, color, overlayClassName, opacity, container)
  })
}

export const createOverlay = (rect, color, overlayClassName, opacity, container = document.body) => {
  const overlay = document.createElement("div")
  overlay.className = overlayClassName
  overlay.style.position = "absolute"
  overlay.style.zIndex = 2147483647 // Highest possible z-index
  overlay.style.opacity = opacity
  overlay.style.top = `${rect.top + window.scrollY}px`
  overlay.style.left = `${rect.left + window.scrollX}px`
  overlay.style.width = `${rect.width}px`
  overlay.style.height = `${rect.height}px`
  overlay.style.backgroundColor = color
  overlay.style.pointerEvents = "none"
  container.appendChild(overlay)
}

export const removeHighlightOverlay = (selector = ".hotwire-dev-tools-highlight-overlay") => {
  const overlays = document.querySelectorAll(selector)
  overlays.forEach((overlay) => overlay.remove())
}
