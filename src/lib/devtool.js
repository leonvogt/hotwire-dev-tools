import { loadCSS } from "./utils"

export default class Devtool {
  constructor() {
    this.options = this.defaultOptions
    this.registeredStimulusControllers = []
    this.turboDetails = {}
    this.detailPanelCSSContent = null

    this.getOptions().then((options) => {
      this.options = options
    })
  }

  getOptions = async () => {
    const data = await chrome.storage.sync.get("options")
    return data?.options || this.defaultOptions
  }

  saveOptions = (options) => {
    const newOptions = { ...this.options, ...options }
    chrome.storage.sync.set({ options: newOptions })
    this.options = newOptions
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
