// This file is copied from the WebAwesome project, to handle color scheme switching

let initialPageLoadComplete = document.readyState === "complete"

if (!initialPageLoadComplete) {
  window.addEventListener("load", () => {
    initialPageLoadComplete = true
  })
}

/**
 * A wrapper around `document.startViewTransition()` that fails gracefully in unsupportive browsers.
 */
export async function doViewTransition(callback, { ignoreInitialLoad = true } = {}) {
  // Skip transitions on initial page load
  if (!initialPageLoadComplete && ignoreInitialLoad) {
    callback()
    return
  }

  const canUseViewTransitions = document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches

  if (canUseViewTransitions) {
    await document.startViewTransition(callback).finished
  } else {
    callback()
  }
}

//
// Updates the color scheme when a color scheme selector changes
//
function updateTheme(value) {
  localStorage.setItem("color-scheme", value)

  const isDark = value === "dark" || (value === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  doViewTransition(() => {
    document.documentElement.classList.toggle("wa-dark", isDark)
  })

  // Sync all selectors
  document.querySelectorAll(".color-scheme-selector").forEach((el) => (el.value = value))
}

// Handle changes
document.addEventListener("input", (e) => {
  if (e.target.matches(".color-scheme-selector")) {
    updateTheme(e.target.value)
  }
})

// Handle backslash key toggle
document.addEventListener("keydown", (e) => {
  if (e.key === "\\" && !e.composedPath().some((el) => el.tagName === "INPUT")) {
    const current = localStorage.getItem("color-scheme") || "auto"
    const isDark = current === "dark" || (current === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    updateTheme(isDark ? "light" : "dark")
  }
})

// Initialize
const saved = localStorage.getItem("color-scheme") || "auto"
updateTheme(saved)
