import Devtool from "./lib/devtool"

const devTool = new Devtool()

const turboHighlightFrames = document.getElementById("turbo-highlight-frames")
const turboHighlightFramesOutlineWidth = document.getElementById("turbo-highlight-frames-outline-width")
const turboHighlightFramesOutlineStyle = document.getElementById("turbo-highlight-frames-outline-style")
const turboHighlightFramesOutlineColor = document.getElementById("turbo-highlight-frames-outline-color")
const turboHighlightFramesBlacklist = document.getElementById("turbo-highlight-frames-blacklist")
const turboHighlightFramesToggles = document.querySelectorAll(".turbo-highlight-frames-toggle-element")
const turboHighlightFramesIgnoreEmpty = document.getElementById("turbo-highlight-frames-ignore-empty")

const stimulusHighlightControllers = document.getElementById("stimulus-highlight-controllers")
const stimulusHighlightControllersOulingWidth = document.getElementById("stimulus-highlight-controllers-outline-width")
const stimulusHighlightControllersOutlineStyle = document.getElementById("stimulus-highlight-controllers-outline-style")
const stimulusHighlightControllersOutlineColor = document.getElementById("stimulus-highlight-controllers-outline-color")
const stimulusHighlightControllersBlacklist = document.getElementById("stimulus-highlight-controllers-blacklist")
const stimulusHighlightControllersToggles = document.querySelectorAll(".stimulus-highlight-controllers-toggle-element")

const detailPanelShow = document.getElementById("detail-panel-show")
const detailPanelShowStimulusTab = document.getElementById("detail-panel-show-stimulus-tab")
const detailPanelShowTurboFrameTab = document.getElementById("detail-panel-show-turbo-frame-tab")
const detailPanelShowTurboStreamTab = document.getElementById("detail-panel-show-turbo-stream-tab")
const detailPanelToggles = document.querySelectorAll(".detail-panel-toggle-element")

const toggleTurboHighlightFramesInputs = (show) => {
  if (show) {
    turboHighlightFramesToggles.forEach((element) => element.classList.remove("d-none"))
  } else {
    turboHighlightFramesToggles.forEach((element) => element.classList.add("d-none"))
  }
}

const toggleStimulusHighlightControllersInputs = (show) => {
  if (show) {
    stimulusHighlightControllersToggles.forEach((element) => element.classList.remove("d-none"))
  } else {
    stimulusHighlightControllersToggles.forEach((element) => element.classList.add("d-none"))
  }
}

const toggleDetailPanelInputs = (show) => {
  if (show) {
    detailPanelToggles.forEach((element) => element.classList.remove("d-none"))
  } else {
    detailPanelToggles.forEach((element) => element.classList.add("d-none"))
  }
}

const maybeHideDetailPanel = () => {
  const { showStimulusTab, showTurboFrameTab, showTurboStreamTab } = devTool.options.detailPanel
  const showDetailPanel = showStimulusTab || showTurboFrameTab || showTurboStreamTab

  if (!showDetailPanel) {
    detailPanelShow.checked = false
    toggleDetailPanelInputs(false)
  }
}

const initializeForm = (options) => {
  turboHighlightFrames.checked = options.turbo.highlightFrames
  turboHighlightFramesIgnoreEmpty.checked = options.turbo.ignoreEmptyFrames
  turboHighlightFramesOutlineColor.value = options.turbo.highlightFramesOutlineColor
  turboHighlightFramesOutlineStyle.value = options.turbo.highlightFramesOutlineStyle
  turboHighlightFramesOutlineWidth.value = options.turbo.highlightFramesOutlineWidth
  turboHighlightFramesBlacklist.value = options.turbo.highlightFramesBlacklist

  stimulusHighlightControllers.checked = options.stimulus.highlightControllers
  stimulusHighlightControllersOutlineColor.value = options.stimulus.highlightControllersOutlineColor
  stimulusHighlightControllersOutlineStyle.value = options.stimulus.highlightControllersOutlineStyle
  stimulusHighlightControllersOulingWidth.value = options.stimulus.highlightControllersOutlineWidth
  stimulusHighlightControllersBlacklist.value = options.stimulus.highlightControllersBlacklist

  detailPanelShow.checked = options.detailPanel.show
  detailPanelShowStimulusTab.checked = options.detailPanel.showStimulusTab
  detailPanelShowTurboFrameTab.checked = options.detailPanel.showTurboFrameTab
  detailPanelShowTurboStreamTab.checked = options.detailPanel.showTurboStreamTab

  if (devTool.isFirefox) {
    // In Firefox the color picker inside an extension popup doesn't really work (See https://github.com/leonvogt/hotwire-dev-tools/issues/20)
    // Workaround: Change the input type to text so the user can input the color manually
    turboHighlightFramesOutlineColor.type = "text"
    turboHighlightFramesOutlineColor.placeholder = devTool.defaultOptions.turbo.highlightFramesOutlineColor

    stimulusHighlightControllersOutlineColor.type = "text"
    stimulusHighlightControllersOutlineColor.placeholder = devTool.defaultOptions.stimulus.highlightControllersOutlineColor
  }

  toggleTurboHighlightFramesInputs(options.turbo.highlightFrames)
  toggleStimulusHighlightControllersInputs(options.stimulus.highlightControllers)
  toggleDetailPanelInputs(options.detailPanel.show)
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

  turboHighlightFramesIgnoreEmpty.addEventListener("change", (event) => {
    options.turbo.ignoreEmptyFrames = event.target.checked
    devTool.saveOptions(options)
  })

  stimulusHighlightControllers.addEventListener("change", (event) => {
    toggleStimulusHighlightControllersInputs(event.target.checked)
    options.stimulus.highlightControllers = event.target.checked
    devTool.saveOptions(options)
  })

  stimulusHighlightControllersOutlineStyle.addEventListener("change", (event) => {
    options.stimulus.highlightControllersOutlineStyle = event.target.value
    devTool.saveOptions(options)
  })

  stimulusHighlightControllersOulingWidth.addEventListener("change", (event) => {
    options.stimulus.highlightControllersOutlineWidth = event.target.value
    devTool.saveOptions(options)
  })

  stimulusHighlightControllersOutlineColor.addEventListener("change", (event) => {
    options.stimulus.highlightControllersOutlineColor = event.target.value
    devTool.saveOptions(options)
  })

  stimulusHighlightControllersBlacklist.addEventListener("input", (event) => {
    options.stimulus.highlightControllersBlacklist = event.target.value
    devTool.saveOptions(options)
  })

  detailPanelShow.addEventListener("change", (event) => {
    toggleDetailPanelInputs(event.target.checked)
    options.detailPanel.show = event.target.checked
    devTool.saveOptions(options)

    // Show all tabs by default
    const anyTabActive = detailPanelShowStimulusTab.checked || detailPanelShowTurboFrameTab.checked || detailPanelShowTurboStreamTab.checked
    if (event.target.checked && !anyTabActive) {
      detailPanelShowStimulusTab.checked = true
      detailPanelShowTurboFrameTab.checked = true
      detailPanelShowTurboStreamTab.checked = true
      options.detailPanel.showStimulusTab = true
      options.detailPanel.showTurboFrameTab = true
      options.detailPanel.showTurboStreamTab = true
      devTool.saveOptions(options)
    }
  })

  detailPanelShowStimulusTab.addEventListener("change", (event) => {
    options.detailPanel.showStimulusTab = event.target.checked
    devTool.saveOptions(options)
    maybeHideDetailPanel()
  })

  detailPanelShowTurboFrameTab.addEventListener("change", (event) => {
    options.detailPanel.showTurboFrameTab = event.target.checked
    devTool.saveOptions(options)
    maybeHideDetailPanel()
  })

  detailPanelShowTurboStreamTab.addEventListener("change", (event) => {
    options.detailPanel.showTurboStreamTab = event.target.checked
    devTool.saveOptions(options)
    maybeHideDetailPanel()
  })
})()
