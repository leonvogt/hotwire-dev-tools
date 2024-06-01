import { loadCSS } from "./utils"

export default class Devtool {
  constructor() {
    this.options = this.defaultOptions
    this.stimulusControllers = []
    this.turboDetails = {}
    this.detailPanelCSSText = null

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
    if (this.detailPanelCSSText) return this.detailPanelCSSText

    this.detailPanelCSSText = await loadCSS(chrome.runtime.getURL("styles/detail_panel.css"))
    return this.detailPanelCSSText
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
      stimulus: {},
      detailPanel: {
        show: false,
        collapsed: false,
        currentTab: "hotwire-dev-tools-stimulus-tab",
      },
    }
  }
}
