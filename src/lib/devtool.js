import { loadCSS } from "./utils"

export default class Devtool {
  constructor(origin = null) {
    this.options = this.defaultOptions
    this.registeredStimulusControllers = []
    this.turboDetails = {}

    this.origin = origin
    this.detailPanelCSSContent = null

    this.getOptions()
  }

  // Always try to use the origin, to see if page-specific options are available
  getOptions = async () => {
    const globalOptions = await chrome.storage.sync.get("options")
    const pageOptions = this.origin ? (await chrome.storage.sync.get(this.origin))[this.origin] : {}

    this.options = pageOptions?.options || globalOptions?.options || this.defaultOptions
    return this.options
  }

  saveOptions = (options) => {
    const newOptions = { ...this.options, ...options }
    const dataToStore = this.origin ? { options: newOptions } : newOptions
    const key = this.origin || "options"

    chrome.storage.sync.set({ [key]: dataToStore }, () => {
      const error = chrome.runtime.lastError
      if (error) {
        if (error.message.includes("MAX_WRITE_OPERATIONS_PER_MINUTE")) {
          console.error("Hotwire Dev Tools: Whoops! We are sorry but you've reached the maximum number of options changes allowed per minute. Please try again later.")
        } else {
          console.error("Hotwire Dev Tools: Error while saving options:", error)
        }
        return
      }

      // Options were saved successfully
      this.options = newOptions
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

  get isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf("firefox") > -1
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
        consoleLogTurboStreams: false,
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
