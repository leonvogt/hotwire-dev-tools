export const addHighlightOverlay = (selector, className, color = "#77e8b9") => {
  const elements = document.querySelectorAll(selector)
  elements.forEach((element) => {
    const rect = element.getBoundingClientRect()
    const overlay = document.createElement("div")
    overlay.className = `hotwire-dev-tools-highlight-overlay ${className}`
    overlay.style.position = "absolute"
    overlay.style.top = `${rect.top + window.scrollY}px`
    overlay.style.left = `${rect.left + window.scrollX}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`
    overlay.style.backgroundColor = color
    document.body.appendChild(overlay)
  })
}

export const removeHighlightOverlay = (selector) => {
  const overlays = document.querySelectorAll(selector)
  overlays.forEach((overlay) => overlay.remove())
}
