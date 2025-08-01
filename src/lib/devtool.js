import { loadCSS } from "$utils/utils"
import { getContext, setContext } from "svelte"

export default class Devtool {
  constructor(origin = null) {
    this.options = this.defaultOptions
    this.registeredStimulusControllers = []
    this.turboDetails = {}

    this.origin = origin
    this.detailPanelCSSContent = null
  }

  setOptions = async () => {
    this.options = await this.getOptions()
  }

  getOptions = async () => {
    const globalOptions = await this.globalUserOptions()
    const originOptions = await this.originOptions()

    let options = originOptions || globalOptions || this.defaultOptions
    options = this.addMissingDefaultOptions(options)
    return options
  }

  globalUserOptions = async () => {
    const options = await chrome.storage.sync.get("options")
    return options?.options
  }

  originOptions = async () => {
    const pageOptions = await chrome.storage.sync.get(this.origin)
    return pageOptions[this.origin]?.options
  }

  saveOptions = async (options, saveToOriginStore = null) => {
    const newOptions = { ...this.options, ...options }
    let dataToStore = newOptions
    let key = "options"

    if (saveToOriginStore === null) {
      saveToOriginStore = await this.originOptionsExist()
    }

    if (saveToOriginStore) {
      dataToStore = this.origin ? { options: newOptions } : newOptions
      key = this.origin || "options"
    }

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

  removeOptionsForOrigin = async () => {
    await chrome.storage.sync.remove(this.origin)
  }

  originOptionsExist = async () => {
    const options = await this.originOptions()
    return !!options
  }

  detailPanelCSS = async () => {
    if (this.detailPanelCSSContent) return this.detailPanelCSSContent

    this.detailPanelCSSContent = await loadCSS(chrome.runtime.getURL("styles/hotwire_dev_tools_detail_panel.css"))
    return this.detailPanelCSSContent
  }

  shouldRenderDetailPanel = () => {
    const { show, showStimulusTab, showTurboFrameTab, showTurboStreamTab } = this.options.detailPanel
    return show && (showStimulusTab || showTurboFrameTab || showTurboStreamTab)
  }

  addMissingDefaultOptions = (options) => {
    if (options.addOptionsForVersion === this.version) return options

    const defaultOptions = this.defaultOptions
    for (const key in defaultOptions) {
      if (options[key] === undefined) {
        options[key] = defaultOptions[key]
      }
    }

    options.addOptionsForVersion = this.version
    return options
  }

  get version() {
    return chrome.runtime.getManifest().version
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
        highlightFramesWithOverlay: false,
        highlightFramesChanges: false,
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
      monitor: {
        events: [],
      },
      logWarnings: true,
    }
  }
}

const DEFAULT_KEY = "$_devtool_state"

export const getDevtoolInstance = (key = DEFAULT_KEY) => {
  return getContext(key)
}

export const setDevtoolInstance = (key = DEFAULT_KEY) => {
  const devtoolInstance = new Devtool()
  return setContext(key, devtoolInstance)
}
