import { loadCSS } from "./utils"

export default class Devtool {
  constructor() {
    this.options = this.defaultOptions
    this.registeredStimulusControllers = []
    this.turboDetails = {}
    this.detailPanelCSSContent = null

    this.getOptions()
  }

  getOptions = async () => {
    const data = await chrome.storage.sync.get("options")
    this.options = data?.options || this.defaultOptions
    return this.options
  }

  saveOptions = (options) => {
    const newOptions = { ...this.options, ...options }

    chrome.storage.sync.set({ options: newOptions }, () => {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError
        console.error("Hotwire Dev Tools: Error saving data:", error)
        if (error.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
          alert("Hotwire Dev Tools: Whoops! We are sorry but you've reached the maximum number of options changes allowed per minute. Please try again later.")
          return
        }
      } else {
        // Data saved successfully
        this.options = newOptions
      }
    })
  }

  detailPanelCSS = async () => {
    if (this.detailPanelCSSContent) return this.detailPanelCSSContent

    this.detailPanelCSSContent = await loadCSS(chrome.runtime.getURL("styles/detail_panel.css"))
    return this.detailPanelCSSContent
  }

  shouldRenderDetailPanel = () => {
    const { show, showStimulusTab, showTurboFrameTab, showTurboStreamTab } = this.options.detailPanel
    return show && (showStimulusTab || showTurboFrameTab || showTurboStreamTab)
  }

  get defaultOptions() {
    return {
      turbo: {
        highlightFrames: false,
        highlightFramesOutlineWidth: "2px",
        highlightFramesOutlineStyle: "dashed",
        highlightFramesOutlineColor: "#5cd8e5",
        highlightFramesBlacklist: "",
        ignoreEmptyFrames: false,
      },
      stimulus: {
        highlightControllers: false,
        highlightControllersOutlineWidth: "2px",
        highlightControllersOutlineStyle: "dashed",
        highlightControllersOutlineColor: "#77e8b9",
        highlightControllersBlacklist: "",
      },
      detailPanel: {
        show: false,
        showStimulusTab: true,
        showTurboFrameTab: true,
        showTurboStreamTab: true,
        collapsed: false,
        currentTab: "hotwire-dev-tools-stimulus-tab",
      },
    }
  }
}
