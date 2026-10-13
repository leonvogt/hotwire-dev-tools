// `target` is an id, which isn't always a valid selector (e.g. "1_comments")
export const turboStreamTargetSelector = (turboStream) => {
  const target = turboStream.getAttribute("target")
  return target ? `#${CSS.escape(target)}` : turboStream.getAttribute("targets")
}

export const turboStreamTargetLabel = (target, targets) => {
  return target ? `#${target}` : targets
}

export const turboStreamTargetElements = (turboStream) => {
  const target = turboStream.getAttribute("target")
  const targets = turboStream.getAttribute("targets")

  if (target) {
    return targetElementsById(target)
  } else if (targets) {
    return targetElementsByQuery(targets)
  } else {
    return []
  }
}

export const targetElementsById = (target) => {
  const element = document.getElementById(target)

  if (element !== null) {
    return [element]
  } else {
    return []
  }
}

export const targetElementsByQuery = (targets) => {
  let elements
  try {
    elements = document.querySelectorAll(targets)
  } catch {
    return []
  }

  if (elements.length !== 0) {
    return Array.prototype.slice.call(elements)
  } else {
    return []
  }
}
