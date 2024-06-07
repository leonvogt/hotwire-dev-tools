import Devtool from "./lib/devtool"

const devTool = new Devtool()

const turboHighlightFrames = document.getElementById("turbo-highlight-frames")
const turboHighlightFramesOutlineWidth = document.getElementById("turbo-highlight-frames-outline-width")
const turboHighlightFramesOutlineStyle = document.getElementById("turbo-highlight-frames-outline-style")
const turboHighlightFramesOutlineColor = document.getElementById("turbo-highlight-frames-outline-color")
const turboHighlightFramesBlacklist = document.getElementById("turbo-highlight-frames-blacklist")
const turboHighlightFramesToggles = document.querySelectorAll(".turbo-highlight-frames-toggle-element")
const turboHighlightFramesIgnoreEmpty = document.getElementById("turbo-highlight-frames-ignore-empty")
const turboConsoleLogTurboStreams = document.getElementById("turbo-console-log-turbo-streams")

const stimulusHighlightControllers = document.getElementById("stimulus-highlight-controllers")
const stimulusHighlightControllersOutlineWidth = document.getElementById("stimulus-highlight-controllers-outline-width")
const stimulusHighlightControllersOutlineStyle = document.getElementById("stimulus-highlight-controllers-outline-style")
const stimulusHighlightControllersOutlineColor = document.getElementById("stimulus-highlight-controllers-outline-color")
const stimulusHighlightControllersBlacklist = document.getElementById("stimulus-highlight-controllers-blacklist")
const stimulusHighlightControllersToggles = document.querySelectorAll(".stimulus-highlight-controllers-toggle-element")

const detailPanelShow = document.getElementById("detail-panel-show")
const detailPanelShowStimulusTab = document.getElementById("detail-panel-show-stimulus-tab")
const detailPanelShowTurboFrameTab = document.getElementById("detail-panel-show-turbo-frame-tab")
const detailPanelShowTurboStreamTab = document.getElementById("detail-panel-show-turbo-stream-tab")
const detailPanelToggles = document.querySelectorAll(".detail-panel-toggle-element")

const toggleInputs = (toggleElements, show) => {
  toggleElements.forEach((element) => {
    element.classList.toggle("d-none", !show)
  })
}

const saveOptions = async (options) => {
  devTool.saveOptions(options)
}

const initializeForm = (options) => {
  const { turbo, stimulus, detailPanel } = options

  turboHighlightFrames.checked = turbo.highlightFrames
  turboConsoleLogTurboStreams.checked = turbo.consoleLogTurboStreams
  turboHighlightFramesIgnoreEmpty.checked = turbo.ignoreEmptyFrames
  turboHighlightFramesOutlineColor.value = turbo.highlightFramesOutlineColor
  turboHighlightFramesOutlineStyle.value = turbo.highlightFramesOutlineStyle
  turboHighlightFramesOutlineWidth.value = turbo.highlightFramesOutlineWidth
  turboHighlightFramesBlacklist.value = turbo.highlightFramesBlacklist

  stimulusHighlightControllers.checked = stimulus.highlightControllers
  stimulusHighlightControllersOutlineColor.value = stimulus.highlightControllersOutlineColor
  stimulusHighlightControllersOutlineStyle.value = stimulus.highlightControllersOutlineStyle
  stimulusHighlightControllersOutlineWidth.value = stimulus.highlightControllersOutlineWidth
  stimulusHighlightControllersBlacklist.value = stimulus.highlightControllersBlacklist

  detailPanelShow.checked = detailPanel.show
  detailPanelShowStimulusTab.checked = detailPanel.showStimulusTab
  detailPanelShowTurboFrameTab.checked = detailPanel.showTurboFrameTab
  detailPanelShowTurboStreamTab.checked = detailPanel.showTurboStreamTab

  if (devTool.isFirefox) {
    // In Firefox the color picker inside an extension popup doesn't really work (See https://github.com/leonvogt/hotwire-dev-tools/issues/20)
    // Workaround: Change the input type to text so the user can input the color manually
    turboHighlightFramesOutlineColor.type = "text"
    turboHighlightFramesOutlineColor.placeholder = devTool.defaultOptions.turbo.highlightFramesOutlineColor

    stimulusHighlightControllersOutlineColor.type = "text"
    stimulusHighlightControllersOutlineColor.placeholder = devTool.defaultOptions.stimulus.highlightControllersOutlineColor
  }

  toggleInputs(turboHighlightFramesToggles, turbo.highlightFrames)
  toggleInputs(stimulusHighlightControllersToggles, stimulus.highlightControllers)
  toggleInputs(detailPanelToggles, detailPanel.show)
}

const maybeHideDetailPanel = (options) => {
  const { showStimulusTab, showTurboFrameTab, showTurboStreamTab } = options.detailPanel
  const showDetailPanel = showStimulusTab || showTurboFrameTab || showTurboStreamTab

  if (!showDetailPanel) {
    detailPanelShow.checked = false
    toggleInputs(detailPanelToggles, false)
  }
}

const setupEventListeners = (options) => {
  const { turbo, stimulus, detailPanel } = options

  turboHighlightFrames.addEventListener("change", (event) => {
    const checked = event.target.checked
    turbo.highlightFrames = checked
    toggleInputs(turboHighlightFramesToggles, checked)
    saveOptions(options)
  })

  turboHighlightFramesOutlineStyle.addEventListener("change", (event) => {
    turbo.highlightFramesOutlineStyle = event.target.value
    saveOptions(options)
  })

  turboHighlightFramesOutlineWidth.addEventListener("change", (event) => {
    turbo.highlightFramesOutlineWidth = event.target.value
    saveOptions(options)
  })

  turboHighlightFramesOutlineColor.addEventListener("change", (event) => {
    turbo.highlightFramesOutlineColor = event.target.value
    saveOptions(options)
  })

  turboHighlightFramesBlacklist.addEventListener("input", (event) => {
    turbo.highlightFramesBlacklist = event.target.value
    saveOptions(options)
  })

  turboHighlightFramesIgnoreEmpty.addEventListener("change", (event) => {
    turbo.ignoreEmptyFrames = event.target.checked
    saveOptions(options)
  })

  turboConsoleLogTurboStreams.addEventListener("change", (event) => {
    turbo.consoleLogTurboStreams = event.target.checked
    saveOptions(options)
  })

  stimulusHighlightControllers.addEventListener("change", (event) => {
    const checked = event.target.checked
    stimulus.highlightControllers = checked
    toggleInputs(stimulusHighlightControllersToggles, checked)
    saveOptions(options)
  })

  stimulusHighlightControllersOutlineStyle.addEventListener("change", (event) => {
    stimulus.highlightControllersOutlineStyle = event.target.value
    saveOptions(options)
  })

  stimulusHighlightControllersOutlineWidth.addEventListener("change", (event) => {
    stimulus.highlightControllersOutlineWidth = event.target.value
    saveOptions(options)
  })

  stimulusHighlightControllersOutlineColor.addEventListener("change", (event) => {
    stimulus.highlightControllersOutlineColor = event.target.value
    saveOptions(options)
  })

  stimulusHighlightControllersBlacklist.addEventListener("input", (event) => {
    stimulus.highlightControllersBlacklist = event.target.value
    saveOptions(options)
  })

  detailPanelShow.addEventListener("change", (event) => {
    const showDetailPanel = event.target.checked
    detailPanel.show = showDetailPanel
    toggleInputs(detailPanelToggles, showDetailPanel)

    const anyTabActive = detailPanelShowStimulusTab.checked || detailPanelShowTurboFrameTab.checked || detailPanelShowTurboStreamTab.checked
    if (showDetailPanel && !anyTabActive) {
      // Enable all tabs by default
      detailPanelShowStimulusTab.checked = true
      detailPanelShowTurboFrameTab.checked = true
      detailPanelShowTurboStreamTab.checked = true

      options.detailPanel.showStimulusTab = true
      options.detailPanel.showTurboFrameTab = true
      options.detailPanel.showTurboStreamTab = true
    }

    saveOptions(options)
  })

  detailPanelShowStimulusTab.addEventListener("change", (event) => {
    detailPanel.showStimulusTab = event.target.checked
    saveOptions(options)
    maybeHideDetailPanel(options)
  })

  detailPanelShowTurboFrameTab.addEventListener("change", (event) => {
    detailPanel.showTurboFrameTab = event.target.checked
    saveOptions(options)
    maybeHideDetailPanel(options)
  })

  detailPanelShowTurboStreamTab.addEventListener("change", (event) => {
    detailPanel.showTurboStreamTab = event.target.checked
    saveOptions(options)
    maybeHideDetailPanel(options)
  })
}

;(async () => {
  const options = await devTool.getOptions()
  initializeForm(options)
  setupEventListeners(options)
})()
