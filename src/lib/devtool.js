import { loadCSS } from "./utils"

export default class Devtool {
  constructor() {
    this.options = this.getOptions()
    this.stimulusControllers = []
    this.turboDetails = {}
    this.detailPanelCSSText = null
  }

  getOptions = () => {
    const options = localStorage.getItem("hotwire-dev-tools-options")
    if (!options) return this.defaultOptions

    try {
      return JSON.parse(options)
    } catch (error) {
      console.warn("Hotwire Dev Tools: Invalid options:", options)
      return this.defaultOptions
    }
  }

  saveOptions = (options) => {
    const newOptions = { ...this.options, ...options }
    localStorage.setItem("hotwire-dev-tools-options", JSON.stringify(newOptions))
    this.options = newOptions
  }

  detailPanelCSS = async () => {
    if (this.detailPanelCSSText) return this.detailPanelCSSText

    this.detailPanelCSSText = await loadCSS(chrome.runtime.getURL("styles/detail_panel.css"))
    return this.detailPanelCSSText
  }

  get defaultOptions() {
    return {
      frames: false,
      detailPanel: false,
      frameColor: "#5cd8e5",
      frameBlacklist: "",
      detailPanelCollapsed: false,
      currentTab: "hotwire-dev-tools-stimulus-tab",
    }
  }
}
