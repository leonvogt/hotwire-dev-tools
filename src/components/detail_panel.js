import { getMetaContent, debounce } from "../utils/utils"
import { turboStreamTargetElements } from "../utils/turbo_utils"
import { addHighlightOverlayToElements, removeHighlightOverlay } from "../utils/highlight"
import DOMScanner from "../utils/dom_scanner"
import * as Icons from "../utils/icons"

import hljs from "highlight.js/lib/core"
import xml from "highlight.js/lib/languages/xml"
hljs.registerLanguage("xml", xml)

const STIMULUS_TAB_ID = "hotwire-dev-tools-stimulus-tab"
const TURBO_FRAME_TAB_ID = "hotwire-dev-tools-turbo-frame-tab"
const TURBO_STREAM_TAB_ID = "hotwire-dev-tools-turbo-stream-tab"
const INFO_TAB_ID = "hotwire-dev-tools-info-tab"

export default class DetailPanel {
  constructor(devTool) {
    this.devTool = devTool
    this.shadowRoot = this.shadowContainer.attachShadow({ mode: "open" })
  }

  render = debounce(async () => {
    await this.injectCSSToShadowRoot()
    this.createOrUpdateDetailPanel()

    this.listenForTabNavigation()
    this.listenForToggleCollapse()
    this.listenForStimulusControllerHover()
    this.listenForTurboFrameHover()
    this.listenForTurboStreamInteractions()
  }, 150)

  dispose() {
    this.shadowRoot.innerHTML = ""
  }

  injectCSSToShadowRoot = async () => {
    if (this.shadowRoot.querySelector("style")) return

    const style = document.createElement("style")
    style.textContent = await this.devTool.detailPanelCSS()
    this.shadowRoot.appendChild(style)
  }

  createOrUpdateDetailPanel() {
    const container = this.detailPanelContainer
    container.innerHTML = this.html
    this.shadowRoot.appendChild(container)
    this.toggleDetailPanelVisibility()
  }

  listenForTabNavigation() {
    const tablist = this.shadowRoot.querySelector(".hotwire-dev-tools-tablist")
    tablist.addEventListener("click", this.#handleClickTab)
  }

  listenForToggleCollapse() {
    this.shadowRoot.querySelector(".hotwire-dev-tools-collapse-button").addEventListener("click", this.#handleClickToggleCollapse)
  }

  addTurboStreamToDetailPanel = (event) => {
    if (!this.devTool.options.detailPanel.show || !this.isTabEnabled(TURBO_STREAM_TAB_ID)) return

    const turboStream = event.target
    const action = turboStream.getAttribute("action")
    const target = turboStream.getAttribute("target")
    const targets = turboStream.getAttribute("targets")
    const targetSelector = target ? `#${target}` : targets
    const targetElements = turboStreamTargetElements(turboStream)
    const time = new Date().toLocaleTimeString()

    const entry = document.createElement("div")
    entry.classList.add("hotwire-dev-tools-entry", "flex-column", "turbo-stream")
    if (targetSelector) {
      entry.dataset.targetSelector = targetSelector
    }

    const turboStreamContent = hljs.highlight(turboStream.outerHTML, { language: "html" }).value
    entry.innerHTML = `
      <div class="hotwire-dev-tools-entry-time">
        <small>${time}</small>
      </div>
      <div class="hotwire-dev-tools-entry-content">
        <span class="text-ellipsis" title="${action}">${action}</span>
        <span class="text-ellipsis" title="${targetSelector || ""}">${targetSelector || ""}</span>
      </div>
      <div class="hotwire-dev-tools-entry-details turbo-streams d-none">
        <pre><code class="language-html">${turboStreamContent}</code></pre>
      </div>
    `

    const streamTab = this.shadowRoot.getElementById(TURBO_STREAM_TAB_ID)
    streamTab.prepend(entry)
    streamTab.querySelector(".hotwire-dev-tools-no-entry")?.remove()

    if ((target || targets) && (targetElements || []).length === 0) {
      entry.classList.add("hotwire-dev-tools-entry-warning")
      entry.title = "Target not found"
    }

    this.listenForTurboStreamInteractions()
    this.addTabEffect(TURBO_STREAM_TAB_ID)
  }

  addTabEffect = debounce((tabId) => {
    const tab = this.shadowRoot.querySelector(`[data-tab-id="${tabId}"]`)
    if (!tab || tab.classList.contains("active")) return
    const animationClass = "animate__animated animate__headShake"
    tab.classList.add(...animationClass.split(" "))
    setTimeout(() => tab.classList.remove(...animationClass.split(" ")), 10000)
  }, 150)

  toggleDetailPanelVisibility = (hide = this.devTool.options.detailPanel.collapsed) => {
    const detailPanelContainer = this.shadowRoot.getElementById("hotwire-dev-tools-detail-panel-container")

    if (hide) {
      this.shadowRoot.querySelector(".collapse-icon").style.display = "none"
      this.shadowRoot.querySelector(".expand-icon").style.display = "contents"

      detailPanelContainer.classList.add("collapsed")
    } else {
      this.shadowRoot.querySelector(".collapse-icon").style.display = "contents"
      this.shadowRoot.querySelector(".expand-icon").style.display = "none"

      detailPanelContainer.classList.remove("collapsed")
    }
  }

  listenForStimulusControllerHover = () => {
    this.shadowRoot.querySelectorAll(`#${STIMULUS_TAB_ID} .hotwire-dev-tools-entry`).forEach((entry) => {
      entry.addEventListener("mouseenter", this.#handleMouseEnterStimulusController)
      entry.addEventListener("mouseleave", this.#handleMouseLeaveStimulusController)
    })
  }

  listenForTurboFrameHover = () => {
    this.shadowRoot.querySelectorAll(`#${TURBO_FRAME_TAB_ID} .hotwire-dev-tools-entry`).forEach((entry) => {
      entry.addEventListener("mouseenter", this.#handleMouseEnterTurboFrame)
      entry.addEventListener("mouseleave", this.#handleMouseLeaveTurboFrame)
    })
  }

  listenForTurboStreamInteractions = () => {
    this.shadowRoot.querySelectorAll(`#${TURBO_STREAM_TAB_ID} .hotwire-dev-tools-entry`).forEach((entry) => {
      entry.addEventListener("click", this.#handleClickTurboStream)
      entry.addEventListener("mouseenter", this.#handleMouseEnterTurboStream)
      entry.addEventListener("mouseleave", this.#handleMouseLeaveTurboStream)
    })
  }

  isTabEnabled = (tabId) => {
    return this.tabs.map((tab) => tab.id).includes(tabId)
  }

  #handleClickTab = (event) => {
    this.shadowRoot.querySelectorAll(".hotwire-dev-tools-tablink, .hotwire-dev-tools-tab-content").forEach((tab) => {
      tab.classList.remove("active")
    })

    const clickedTab = event.target.closest(".hotwire-dev-tools-tablink")
    const desiredTabContent = this.shadowRoot.getElementById(clickedTab.dataset.tabId)

    clickedTab.classList.add("active")
    desiredTabContent.classList.add("active")

    const options = this.devTool.options
    options.detailPanel.currentTab = clickedTab.dataset.tabId
    options.detailPanel.collapsed = false

    this.devTool.saveOptions(options)
    this.toggleDetailPanelVisibility()
  }

  #handleClickToggleCollapse = () => {
    const options = this.devTool.options
    options.detailPanel.collapsed = !options.detailPanel.collapsed

    this.devTool.saveOptions(options)
    this.toggleDetailPanelVisibility()
  }

  #handleMouseEnterTurboStream = (event) => {
    const selector = event.currentTarget.dataset.targetSelector
    const elements = document.querySelectorAll(selector)
    addHighlightOverlayToElements(elements, this.devTool.options.turbo.highlightFramesOutlineColor)
  }

  #handleMouseLeaveTurboStream = () => {
    removeHighlightOverlay()
  }

  #handleClickTurboStream = (event) => {
    const entryDetails = event.target.closest(".hotwire-dev-tools-entry").querySelector(".hotwire-dev-tools-entry-details")
    const wasCollapsed = entryDetails.classList.contains("d-none")

    this.shadowRoot.querySelectorAll(".hotwire-dev-tools-entry-details").forEach((entryDetails) => {
      entryDetails.classList.add("d-none")
    })

    if (wasCollapsed) {
      entryDetails.classList.remove("d-none")
    }
    entryDetails.closest(".hotwire-dev-tools-entry").scrollIntoView({ behavior: "smooth" })
  }

  #handleMouseEnterStimulusController = (event) => {
    const controllerId = event.currentTarget.getAttribute("data-stimulus-controller-id")
    const elements = document.querySelectorAll(`[data-controller="${controllerId}"]`)
    addHighlightOverlayToElements(elements, this.devTool.options.stimulus.highlightControllersOutlineColor)
  }

  #handleMouseLeaveStimulusController = () => {
    removeHighlightOverlay()
  }

  #handleMouseEnterTurboFrame = (event) => {
    const frameId = event.currentTarget.getAttribute("data-turbo-frame-id")
    const elements = document.querySelectorAll(`turbo-frame#${frameId}`)
    addHighlightOverlayToElements(elements, this.devTool.options.turbo.highlightFramesOutlineColor)
  }

  #handleMouseLeaveTurboFrame = () => {
    removeHighlightOverlay()
  }

  get panelHeader() {
    return `
      <div class="hotwire-dev-tools-detail-panel-header">
        <div class="hotwire-dev-tools-tablist">
          ${this.tabs.map((tab) => `<button class="hotwire-dev-tools-tablink ${this.currentTab === tab.id ? "active" : ""}" data-tab-id="${tab.id}">${tab.label}</button>`).join("")}
        </div>
        <button class="hotwire-dev-tools-collapse-button">
          <span class="collapse-icon">${Icons.xmark}</span>
          <span class="expand-icon">${Icons.arrowUp}</span>
        </button>
      </div>
    `
  }

  get stimulusTabContent() {
    const groupedControllers = DOMScanner.groupedStimulusControllerElements
    const sortedControllerIds = Object.keys(groupedControllers).sort()

    if (sortedControllerIds.length === 0) {
      return `
        <div class="hotwire-dev-tools-no-entry">
          <span>No Stimulus controllers found on this page</span>
          <span>We'll keep looking</span>
        </div>
      `
    }

    const entries = []
    const detectedRegistedStimulusControllers = this.devTool.registeredStimulusControllers.length > 0
    sortedControllerIds.forEach((stimulusControllerId) => {
      let entryAttributes = { class: "hotwire-dev-tools-entry", "data-stimulus-controller-id": stimulusControllerId }

      const controllerNotRegistered = detectedRegistedStimulusControllers && !this.devTool.registeredStimulusControllers.includes(stimulusControllerId)
      if (controllerNotRegistered) {
        entryAttributes.class += " hotwire-dev-tools-entry-warning"
        entryAttributes.title = "Controller not registered"
      }

      const stimulusControllerElements = groupedControllers[stimulusControllerId]
      entries.push(`
        <div ${Object.entries(entryAttributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(" ")}>
          <span>${stimulusControllerId}<sup>${stimulusControllerElements.length}</sup></span>
        </div>
      `)
    })

    return entries.join("")
  }

  get turboFrameTabContent() {
    const frames = Array.from(DOMScanner.turboFrameElements)
    if (frames.length === 0) {
      return `
        <div class="hotwire-dev-tools-no-entry">
          <span>No Turbo Frames found on this page</span>
          <span>We'll keep looking</span>
        </div>
      `
    }

    const entries = []
    frames.forEach((frame) => {
      const nonUniqueFrameId = frames.filter((f) => f.id === frame.id).length > 1
      let className = "hotwire-dev-tools-entry"
      let title = ""
      if (nonUniqueFrameId) {
        className += " hotwire-dev-tools-entry-warning"
        title = "Multiple frames with the same id"
      }
      entries.push(`
        <div class="${className}" data-turbo-frame-id="${frame.id}" title="${title}">
          <span>${frame.id}</span>
          ${frame.hasAttribute("src") ? `<span class="frame-with-src" title="Asynchronous Turbo Frame - ${frame.getAttribute("src")}">${Icons.clock}</span>` : ""}
        </div>
      `)
    })
    return entries.join("")
  }

  get turboSteamTabContent() {
    const streamTabEntries = Array.from(this.shadowRoot.querySelectorAll(`#${TURBO_STREAM_TAB_ID} .hotwire-dev-tools-entry`))
    if (streamTabEntries.length > 0) {
      return streamTabEntries.map((entry) => entry.outerHTML).join("")
    }

    return `
      <div class="hotwire-dev-tools-no-entry">
        <span>No Turbo Streams seen yet</span>
        <span>We'll keep looking</span>
      </div>
    `
  }

  get infoTabContent() {
    return `
      <div class="info-tab-content">
        <div class="info-tab-content-turbo">
          <div class="info-tab-content-wrapper">
            <span>Turbo Frames:</span>
            <span>${DOMScanner.turboFrameElements.length}</span>
          </div>
          ${
            typeof this.devTool.turboDetails.turboDriveEnabled === "boolean"
              ? `
                <div class="info-tab-content-wrapper" title="Checks 'window.Turbo.session.drive' to see if Turbo Drive is enabled">
                  <span>Turbo Drive:</span>
                  <span>${this.devTool.turboDetails.turboDriveEnabled ? "On" : "Off"}</span>
                </div>
              `
              : `
                <div class="info-tab-content-wrapper" title="Checks 'window.Turbo.session.drive' to see if Turbo Drive is enabled">
                  <span>Turbo Drive:</span>
                  <span>-</span>
                </div>
              `
          }
          ${
            getMetaContent("turbo-prefetch") === "false"
              ? `
                  <div class="info-tab-content-wrapper" title="Checks the meta tag 'turbo-prefetch' to see if Link Prefetch is enabled">
                    <span>Link Prefetch:</span>
                    <span>Off</span>
                  </div>
                `
              : ""
          }
          <div class="info-tab-content-wrapper" title="Defines how Turbo handles page refreshes. Meta Tag: turbo-refresh-method">
            <span>Refresh Control:</span>
            <span>${getMetaContent("turbo-refresh-method") || "-"}</span>
          </div>
          <div class="info-tab-content-wrapper" title="Defines if Turbo should perform a full page reload. Meta Tag: turbo-visit-control">
            <span>Visit Control:</span>
            <span>${getMetaContent("turbo-visit-control") || "-"}</span>
          </div>
          <div class="info-tab-content-wrapper" title="Defines the turbo caching behavior. Meta Tag: turbo-cache-control">
            <span>Cache Control:</span>
            <span>${getMetaContent("turbo-cache-control") || "-"}</span>
          </div>
        </div>

        <div class="info-tab-content-stimulus">
          <div class="info-tab-content-wrapper">
            <span>Stimulus Controllers:</span>
            <span>${DOMScanner.stimulusControllerElements.length}</span>
          </div>
        </div>
      </div>
    `
  }

  get detailPanelContainer() {
    const existingContainer = this.shadowRoot.getElementById("hotwire-dev-tools-detail-panel-container")
    if (existingContainer) {
      return existingContainer
    }
    const container = document.createElement("div")
    container.id = "hotwire-dev-tools-detail-panel-container"
    return container
  }

  get shadowContainer() {
    const existingShadowContainer = DOMScanner.shadowContainer
    if (existingShadowContainer) {
      return existingShadowContainer
    }
    const shadowContainer = document.createElement("div")
    shadowContainer.id = DOMScanner.SHADOW_CONTAINER_ID
    document.body.appendChild(shadowContainer)
    return shadowContainer
  }

  get html() {
    return `
      ${this.panelHeader}
      ${this.tabs.map((tab) => `<div id="${tab.id}" class="hotwire-dev-tools-tab-content ${this.currentTab === tab.id ? "active" : ""}">${tab.content}</div>`).join("")}
    `
  }

  get tabs() {
    const { showStimulusTab, showTurboFrameTab, showTurboStreamTab } = this.devTool.options.detailPanel
    const enabledTabs = []
    if (showStimulusTab) {
      enabledTabs.push({ id: STIMULUS_TAB_ID, label: "Stimulus", content: this.stimulusTabContent })
    }
    if (showTurboFrameTab) {
      enabledTabs.push({ id: TURBO_FRAME_TAB_ID, label: "Frames", content: this.turboFrameTabContent })
    }
    if (showTurboStreamTab) {
      enabledTabs.push({ id: TURBO_STREAM_TAB_ID, label: "Streams", content: this.turboSteamTabContent })
    }
    if (enabledTabs.length > 0) {
      enabledTabs.push({ id: INFO_TAB_ID, label: Icons.info, content: this.infoTabContent })
    }

    return enabledTabs
  }

  get currentTab() {
    const options = this.devTool.options

    const storedCurrentTab = options.detailPanel.currentTab
    if (this.isTabEnabled(storedCurrentTab)) return storedCurrentTab

    const newCurrentTab = this.tabs[0].id
    options.detailPanel.currentTab = newCurrentTab
    this.devTool.saveOptions(options)
    return newCurrentTab
  }
}
