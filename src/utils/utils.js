export const getMetaElement = (name) => {
  return document.querySelector(`meta[name="${name}"]`)
}

export const getMetaContent = (name) => {
  const element = getMetaElement(name)
  return element && element.content
}

export const debounce = (fn, delay) => {
  let timeoutId = null

  return (...args) => {
    const callback = () => fn.apply(this, args)
    clearTimeout(timeoutId)
    timeoutId = setTimeout(callback, delay)
  }
}

export const loadCSS = async (url) => {
  return fetch(url)
    .then((response) => response.text())
    .then((css) => css)
    .catch((error) => console.error("Hotwire Dev Tools: Error loading CSS", error))
}

export const inspectElement = (selector) => {
  chrome.devtools.inspectedWindow.eval(`inspect(document.querySelector('${selector}'))`)
}

export const serializeHTMLElement = (element, escapeHTML) => {
  if (!(element instanceof Element)) {
    throw new Error("Expected an Element")
  }

  const attributes = Array.from(element.attributes)
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(" ")

  const tagName = element.tagName.toLowerCase()
  const string = `<${tagName}${attributes ? " " + attributes : ""}></${tagName}>`

  if (escapeHTML) {
    return string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
  }

  return string
}
