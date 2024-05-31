export const turboStreamTargetElements = (turboStream) => {
  const target = turboStream.getAttribute("target")
  const targets = turboStream.getAttribute("targets")

  if (target) {
    return targetElementsById(target)
  } else if (targets) {
    return targetElementsByQuery(targets)
  } else {
    ;[]
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
  const elements = document.querySelectorAll(targets)

  if (elements.length !== 0) {
    return Array.prototype.slice.call(elements)
  } else {
    return []
  }
}
