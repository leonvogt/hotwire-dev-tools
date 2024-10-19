export const addHighlightOverlayToElements = (elements, color = "#77e8b9", overlayClassName = "hotwire-dev-tools-highlight-overlay", opacity = "0.2") => {
  elements.forEach((element) => {
    const rect = element.getBoundingClientRect()
    createOverlay(rect, color, overlayClassName, opacity)
  })
}

export const createOverlay = (rect, color, overlayClassName, opacity) => {
  const overlay = document.createElement("div")
  overlay.className = overlayClassName
  overlay.style.position = "absolute"
  overlay.style.zIndex = 9999999
  overlay.style.opacity = opacity
  overlay.style.top = `${rect.top + window.scrollY}px`
  overlay.style.left = `${rect.left + window.scrollX}px`
  overlay.style.width = `${rect.width}px`
  overlay.style.height = `${rect.height}px`
  overlay.style.backgroundColor = color
  document.body.appendChild(overlay)
}

export const removeHighlightOverlay = (selector = ".hotwire-dev-tools-highlight-overlay") => {
  const overlays = document.querySelectorAll(selector)
  overlays.forEach((overlay) => overlay.remove())
}
