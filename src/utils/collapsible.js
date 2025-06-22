export const collapseEntryRows = (uuid, event, collapsibles, stickyParents) => {
  event.stopPropagation()

  const isCurrentlyCollapsed = collapsibles[uuid] || false
  const frameElement = event.target.closest(".entry-row")
  const containerElement = frameElement.nextElementSibling

  if (containerElement && containerElement.classList.contains("children-container")) {
    if (isCurrentlyCollapsed) {
      // Expanding
      containerElement.classList.remove("collapsed")
      containerElement.style.height = "0px"
      containerElement.offsetHeight

      const targetHeight = containerElement.scrollHeight
      containerElement.style.height = `${targetHeight}px`
      setTimeout(() => {
        containerElement.style.height = ""
        if (stickyParents) {
          toggleStickyParent(uuid, frameElement, true, stickyParents)
        }
      }, 300) // Match the transition duration in CSS
    } else {
      // Collapsing
      const startHeight = containerElement.scrollHeight
      containerElement.style.height = `${startHeight}px`
      containerElement.offsetHeight

      containerElement.style.height = "0px"
      if (stickyParents) {
        toggleStickyParent(uuid, frameElement, false, stickyParents)
      }
      setTimeout(() => {
        containerElement.classList.add("collapsed")
      }, 300) // Match the transition duration
    }
  }

  collapsibles[uuid] = !isCurrentlyCollapsed
}

export const toggleStickyParent = (uuid, frameElement, makeSticky, stickyParents) => {
  if (makeSticky) {
    frameElement.classList.add("sticky-parent")
    stickyParents[uuid] = frameElement
  } else {
    frameElement.classList.remove("sticky-parent")
    delete stickyParents[uuid]
  }
}

export const checkStickyVisibility = (scrollableList, stickyParents, collapsibles) => {
  if (!scrollableList) return

  Object.entries(stickyParents).forEach(([uuid, frameElement]) => {
    const containerElement = frameElement.nextElementSibling
    if (!containerElement || !containerElement.classList.contains("children-container")) return

    const isCurrentlyCollapsed = collapsibles[uuid] || false
    if (isCurrentlyCollapsed) {
      frameElement.classList.remove("sticky-parent")
      return
    }

    const children = Array.from(containerElement.querySelectorAll(".entry-row"))
    const isAnyChildVisible = children.some((child) => {
      const rect = child.getBoundingClientRect()
      const parentRect = scrollableList.getBoundingClientRect()
      return rect.bottom > parentRect.top && rect.top < parentRect.bottom
    })

    if (isAnyChildVisible) {
      frameElement.classList.add("sticky-parent")
    } else {
      frameElement.classList.remove("sticky-parent")
    }
  })
}
