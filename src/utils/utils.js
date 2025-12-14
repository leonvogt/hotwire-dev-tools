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

export const stringifyHTMLElementTag = (element, createClosingTag = true) => {
  if (!(element instanceof Element)) {
    throw new Error("Expected an Element")
  }

  const attributes = Array.from(element.attributes)
    .filter(({ name }) => name !== "data-hotwire-dev-tools-uuid")
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(" ")

  const tagName = element.tagName.toLowerCase()
  let string = `<${tagName}${attributes ? " " + attributes : ""}>`
  if (createClosingTag) {
    string += `</${tagName}>`
  }

  return string
}

export const stringifyHTMLElementTagShallow = (element) => {
  if (!(element instanceof Element)) {
    throw new Error("Expected an Element")
  }
  const tagName = element.tagName.toLowerCase()
  const id = element.id ? ` id="${element.id}"` : ""
  return `<${tagName}${id} ...>`
}

export const generateUUID = () => {
  return crypto.randomUUID()
}

// Copy to clipboard is bit tricky from a devtool panel context.
// Currently, we're using the common trick of creating a textarea and using the `document.execCommand("copy")` method, which is deprecated.
// Problem: When calling `navigator.clipboard.writeText` from:
// - a devtools panel context, it throws the error: "The Clipboard API has been blocked because of a permissions policy applied to the current document."
// - a content script context, it throws the error: "Failed to execute 'writeText' on 'Clipboard': Document is not focused"
// In the future, we should look into how we can improve this.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard
export const copyToClipboard = (value) => {
  const textarea = document.createElement("textarea")
  textarea.value = value != null ? value : ""
  textarea.style.position = "absolute"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand("copy")
  textarea.remove()
}

export const handleKeyboardNavigation = (event, collection, currentIndex) => {
  let newIndex = currentIndex

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault()
      newIndex = currentIndex < collection.length - 1 ? currentIndex + 1 : 0
      break
    case "ArrowUp":
      event.preventDefault()
      newIndex = currentIndex > 0 ? currentIndex - 1 : collection.length - 1
      break
    case "Home":
      event.preventDefault()
      newIndex = 0
      break
    case "End":
      event.preventDefault()
      newIndex = collection.length - 1
      break
    case "Enter":
      event.preventDefault()
      newIndex = currentIndex
      break
    default:
      return
  }

  return newIndex
}

export const getUUIDFromElement = (element) => {
  const uuid = element.getAttribute("data-hotwire-dev-tools-uuid")
  return uuid || null
}

export const setUUIDToElement = (element) => {
  const uuid = generateUUID()
  element.setAttribute("data-hotwire-dev-tools-uuid", uuid)
  return uuid
}

export const ensureUUIDOnElement = (element) => {
  let uuid = getUUIDFromElement(element)
  if (!uuid) {
    uuid = setUUIDToElement(element)
  }
  return uuid
}

export const getElementPath = (element) => {
  const path = []
  while (element && element.parentElement) {
    const siblings = Array.from(element.parentElement.children)
    const index = siblings.indexOf(element)
    path.unshift(index)
    element = element.parentElement
  }
  return path
}

export const getElementFromIndexPath = (path) => {
  let element = document.documentElement
  for (const index of path) {
    element = element.children[index]
    if (!element) return null
  }
  return element
}

export const safeStringifyEventDetail = (detail) => {
  const seen = new WeakSet()
  return JSON.parse(
    JSON.stringify(detail, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular Reference]"
        }
        seen.add(value)
      }
      // Remove problematic DOM elements and functions
      if (value instanceof HTMLElement || typeof value === "function") {
        return "[Object]"
      }
      return value
    }),
  )
}

export const flattenNodes = (tree) => {
  return tree.flatMap((node) => [node, ...flattenNodes(node.children || [])])
}

export const capitalizeFirstChar = (str) => {
  if (typeof str !== "string" || str === undefined || str.length === 0) {
    return str
  }
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const selectorByUUID = (uuid) => {
  return `[data-hotwire-dev-tools-uuid="${uuid}"]`
}

export const serializeAttributes = (element) => {
  return Array.from(element.attributes).reduce((map, attr) => {
    map[attr.name] = attr.value
    return map
  }, {})
}
