import Devtool from "./lib/devtool"

const devTool = new Devtool()

const turboHighlightFrames = document.getElementById("turbo-highlight-frames")
const turboHighlightFramesOutlineWidth = document.getElementById("turbo-highlight-frames-outline-width")
const turboHighlightFramesOutlineStyle = document.getElementById("turbo-highlight-frames-outline-style")
const turboHighlightFramesOutlineColor = document.getElementById("turbo-highlight-frames-outline-color")
const turboHighlightFramesBlacklist = document.getElementById("turbo-highlight-frames-blacklist")
const turboHighlightFramesToggles = document.querySelectorAll(".turbo-highlight-frames-toggle-element")

const detailPanelShow = document.getElementById("detail-panel-show")

const toggleTurboHighlightFramesInputs = (show) => {
  if (show) {
    turboHighlightFramesToggles.forEach((element) => element.classList.remove("d-none"))
  } else {
    turboHighlightFramesToggles.forEach((element) => element.classList.add("d-none"))
  }
}

const initializeForm = (options) => {
  turboHighlightFrames.checked = options.turbo.highlightFrames
  turboHighlightFramesOutlineColor.value = options.turbo.highlightFramesOutlineColor
  turboHighlightFramesOutlineStyle.value = options.turbo.highlightFramesOutlineStyle
  turboHighlightFramesOutlineWidth.value = options.turbo.highlightFramesOutlineWidth
  turboHighlightFramesBlacklist.value = options.turbo.highlightFramesBlacklist

  detailPanelShow.checked = options.detailPanel.show
  toggleTurboHighlightFramesInputs(options.turbo.highlightFrames)
}

;(async () => {
  // Initialize form with persisted options
  const options = await devTool.getOptions()
  initializeForm(options)

  // Event listeners to persist selected options
  turboHighlightFrames.addEventListener("change", (event) => {
    toggleTurboHighlightFramesInputs(event.target.checked)
    options.turbo.highlightFrames = event.target.checked
    devTool.saveOptions(options)
  })

  turboHighlightFramesOutlineStyle.addEventListener("change", (event) => {
    options.turbo.highlightFramesOutlineStyle = event.target.value
    devTool.saveOptions(options)
  })

  turboHighlightFramesOutlineWidth.addEventListener("change", (event) => {
    options.turbo.highlightFramesOutlineWidth = event.target.value
    devTool.saveOptions(options)
  })

  turboHighlightFramesOutlineColor.addEventListener("change", (event) => {
    options.turbo.highlightFramesOutlineColor = event.target.value
    devTool.saveOptions(options)
  })

  turboHighlightFramesBlacklist.addEventListener("input", (event) => {
    options.turbo.highlightFramesBlacklist = event.target.value
    devTool.saveOptions(options)
  })

  detailPanelShow.addEventListener("change", (event) => {
    options.detailPanel.show = event.target.checked
    devTool.saveOptions(options)
  })
})()
