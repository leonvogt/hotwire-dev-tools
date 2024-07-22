import Devtool from "./lib/devtool"
import { MONITORING_EVENTS } from "./lib/monitoring_events"

const devTool = new Devtool()

const versionString = document.getElementById("version-string")

const pageSpecificOptions = document.getElementById("page-specific-options")

const turboHighlightFrames = document.getElementById("turbo-highlight-frames")
const turboHighlightFramesOutlineWidth = document.getElementById("turbo-highlight-frames-outline-width")
const turboHighlightFramesOutlineStyle = document.getElementById("turbo-highlight-frames-outline-style")
const turboHighlightFramesOutlineColor = document.getElementById("turbo-highlight-frames-outline-color")
const turboHighlightFramesBlacklist = document.getElementById("turbo-highlight-frames-blacklist")
const turboHighlightFramesToggles = document.querySelectorAll(".turbo-highlight-frames-toggle-element")
const turboHighlightFramesIgnoreEmpty = document.getElementById("turbo-highlight-frames-ignore-empty")
const turboHighlightFramesWithOverlay = document.getElementById("turbo-highlight-frames-with-overlay")
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

const monitorEvents = document.getElementById("monitor-events")
const monitorEventsToggles = document.querySelectorAll(".monitor-events-toggle-element")
const monitorEventsCheckboxContainer = document.querySelector(".monitor-events-checkbox-container")
const monitorEventsSelectAll = document.getElementById("monitor-events-select-all")

const toggleInputs = (toggleElements, show) => {
  toggleElements.forEach((element) => {
    element.classList.toggle("d-none", !show)
  })
}

// When the popup is opened, the CSS transitions are disabled to prevent flickering
// After initializing the form, we enable the transition effects again
const enableCSSTransitions = () => {
  setTimeout(() => {
    document.body.classList.remove("no-transitions")
  }, 100)
}

const saveOptions = async (options) => {
  devTool.saveOptions(options, pageSpecificOptions.checked)
}

const initializeForm = async (options) => {
  const { turbo, stimulus, detailPanel, monitor } = options

  const originOptionsExist = await devTool.originOptionsExist()
  pageSpecificOptions.checked = originOptionsExist

  turboHighlightFrames.checked = turbo.highlightFrames
  turboConsoleLogTurboStreams.checked = turbo.consoleLogTurboStreams
  turboHighlightFramesWithOverlay.checked = turbo.highlightFramesWithOverlay
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

  monitorEvents.checked = monitor.events.length > 0

  if (devTool.isFirefox) {
    // In Firefox the color picker inside an extension popup doesn't really work (See https://github.com/leonvogt/hotwire-dev-tools/issues/20)
    // Workaround: Change the input type to text so the user can input the color manually
    turboHighlightFramesOutlineColor.type = "text"
    turboHighlightFramesOutlineColor.placeholder = devTool.defaultOptions.turbo.highlightFramesOutlineColor

    stimulusHighlightControllersOutlineColor.type = "text"
    stimulusHighlightControllersOutlineColor.placeholder = devTool.defaultOptions.stimulus.highlightControllersOutlineColor
  }

  const activeEvents = Array.from(options.monitor?.events || [])

  MONITORING_EVENTS.forEach((event) => {
    const wrapper = document.createElement("div")
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = `monitor-${event}`
    checkbox.value = event
    checkbox.checked = activeEvents.includes(event)

    const label = document.createElement("label")
    label.htmlFor = `monitor-${event}`
    label.textContent = event

    wrapper.appendChild(checkbox)
    wrapper.appendChild(label)
    document.querySelector(".monitor-events-checkbox-container").appendChild(wrapper)
  })

  toggleInputs(turboHighlightFramesToggles, turbo.highlightFrames)
  toggleInputs(stimulusHighlightControllersToggles, stimulus.highlightControllers)
  toggleInputs(detailPanelToggles, detailPanel.show)
  toggleInputs(monitorEventsToggles, monitorEvents.checked)
  enableCSSTransitions()
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

  pageSpecificOptions.addEventListener("change", async (event) => {
    if (!event.target.checked) {
      await devTool.removeOptionsForOrigin()

      // Reset the form to the global options
      await devTool.setOptions()
      initializeForm(devTool.options)
    }
  })

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

  turboHighlightFramesWithOverlay.addEventListener("change", (event) => {
    turbo.highlightFramesWithOverlay = event.target.checked
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
    detailPanel.collapsed = false
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

  monitorEvents.addEventListener("change", (event) => {
    const checked = event.target.checked
    toggleInputs(monitorEventsToggles, checked)
    if (!checked) {
      options.monitor.events = []
      saveOptions(options)
    }
  })

  monitorEventsCheckboxContainer.addEventListener("change", (event) => {
    const checkbox = event.target
    const eventValue = checkbox.value

    if (checkbox.checked) {
      options.monitor.events.push(eventValue)
    } else {
      options.monitor.events = options.monitor.events.filter((event) => event !== eventValue)
    }

    saveOptions(options)
  })

  monitorEventsSelectAll.addEventListener("click", (event) => {
    event.preventDefault()
    const allCheckboxes = document.querySelectorAll(".monitor-events-checkbox-container input[type='checkbox']")
    const allChecked = Array.from(allCheckboxes).every((checkbox) => checkbox.checked)

    allCheckboxes.forEach((checkbox) => {
      checkbox.checked = !allChecked
    })

    options.monitor.events = allChecked ? [] : MONITORING_EVENTS
    saveOptions(options)
  })
}

const getCurrentTabOrigin = async () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError)
      }

      if (tabs.length === 0) {
        return reject(new Error("No active tab found"))
      }

      if (!tabs[0].url) {
        return reject(new Error("Active tab has no URL"))
      }

      const origin = new URL(tabs[0].url).origin
      resolve(origin)
    })
  })
}

;(async () => {
  try {
    const origin = await getCurrentTabOrigin()
    devTool.origin = origin
  } catch (error) {
    // If we can't get the origin, we just work with the global user options
    document.querySelector(".page-specific-options-wrapper").remove()
  }

  versionString.textContent = devTool.version

  const options = await devTool.getOptions()
  initializeForm(options)
  setupEventListeners(options)
})()
