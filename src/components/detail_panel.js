import { getMetaContent, debounce } from "../lib/utils"
import { turboStreamTargetElements } from "../lib/turbo_utils"
import { addHighlightOverlay, removeHighlightOverlay } from "../lib/highlight"
import * as Icons from "../lib/icons"

import hljs from "highlight.js/lib/core"
import xml from "highlight.js/lib/languages/xml"
hljs.registerLanguage("xml", xml)

export default class DetailPanel {
  constructor(devTool) {
    this.devTool = devTool
    this.shadowRoot = this.shadowContainer.attachShadow({ mode: "open" })
  }

  render = debounce(() => {
    this.injectCSSToShadowRoot()
    this.createOrUpdateDetailPanel()

    this.listenForTabNavigation()
    this.listenForCollapse()
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

    container.classList.toggle("collapsed", this.devTool.options.detailPanel.collapsed)
    this.toggleCollapse()
  }

  listenForTabNavigation() {
    const tablist = this.shadowRoot.querySelector(".hotwire-dev-tools-tablist")
    tablist.addEventListener("click", this.#handleClickTab)
  }

  listenForCollapse() {
    this.shadowRoot.querySelector(".hotwire-dev-tools-collapse-button").addEventListener("click", this.#handleClickCollapse)
  }

  addTurboStreamToDetailPanel = (event) => {
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

    const streamTab = this.shadowRoot.getElementById("hotwire-dev-tools-turbo-stream-tab")
    streamTab.prepend(entry)
    streamTab.querySelector(".hotwire-dev-tools-no-entry")?.remove()

    if ((target || targets) && (targetElements || []).length === 0) {
      entry.classList.add("hotwire-dev-tools-entry-warning")
      entry.title = "Target not found"
    }

    this.listenForTurboStreamInteractions()
    this.addTabEffect("hotwire-dev-tools-turbo-stream-tab")
  }

  addTabEffect = debounce((tabId) => {
    const tab = this.shadowRoot.querySelector(`[data-tab-id="${tabId}"]`)
    if (!tab || tab.classList.contains("active")) return
    const animationClass = "animate__animated animate__headShake"
    tab.classList.add(...animationClass.split(" "))
    setTimeout(() => tab.classList.remove(...animationClass.split(" ")), 10000)
  }, 150)

  toggleCollapse = () => {
    if (this.devTool.options.detailPanel.collapsed) {
      this.shadowRoot.querySelector(".collapse-icon").style.display = "none"
      this.shadowRoot.querySelector(".expand-icon").style.display = "contents"
    } else {
      this.shadowRoot.querySelector(".collapse-icon").style.display = "contents"
      this.shadowRoot.querySelector(".expand-icon").style.display = "none"
    }
  }

  listenForStimulusControllerHover = () => {
    this.shadowRoot.querySelectorAll("#hotwire-dev-tools-stimulus-tab .hotwire-dev-tools-entry").forEach((entry) => {
      entry.addEventListener("mouseenter", this.#handleMouseEnterStimulusController)
      entry.addEventListener("mouseleave", this.#handleMouseLeaveStimulusController)
    })
  }

  listenForTurboFrameHover = () => {
    this.shadowRoot.querySelectorAll("#hotwire-dev-tools-turbo-frame-tab .hotwire-dev-tools-entry").forEach((entry) => {
      entry.addEventListener("mouseenter", this.#handleMouseEnterTurboFrame)
      entry.addEventListener("mouseleave", this.#handleMouseLeaveTurboFrame)
    })
  }

  listenForTurboStreamInteractions = () => {
    this.shadowRoot.querySelectorAll("#hotwire-dev-tools-turbo-stream-tab .hotwire-dev-tools-entry").forEach((entry) => {
      entry.addEventListener("click", this.#handleClickTurboStream)
      entry.addEventListener("mouseenter", this.#handleMouseEnterTurboStream)
      entry.addEventListener("mouseleave", this.#handleMouseLeaveTurboStream)
    })
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

    if (options.detailPanel.collapsed) {
      this.toggleCollapse()
      options.detailPanel.collapsed = false
    }

    this.devTool.saveOptions(options)
  }

  #handleClickCollapse = () => {
    const container = this.shadowRoot.getElementById("hotwire-dev-tools-detail-panel-container")
    container.classList.toggle("collapsed")

    const options = this.devTool.options
    options.detailPanel.collapsed = container.classList.contains("collapsed")
    this.devTool.saveOptions(options)
    this.toggleCollapse()
  }

  #handleMouseEnterTurboStream = (event) => {
    const selector = event.currentTarget.dataset.targetSelector
    addHighlightOverlay(selector, "hotwire-dev-tools-turbo-stream-highlight-overlay")
  }

  #handleMouseLeaveTurboStream = () => {
    removeHighlightOverlay(".hotwire-dev-tools-turbo-stream-highlight-overlay")
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
    addHighlightOverlay(`[data-controller="${controllerId}"]`, "hotwire-dev-tools-stimulus-highlight-overlay")
  }

  #handleMouseLeaveStimulusController = () => {
    removeHighlightOverlay(".hotwire-dev-tools-stimulus-highlight-overlay")
  }

  #handleMouseEnterTurboFrame = (event) => {
    const frameId = event.currentTarget.getAttribute("data-turbo-frame-id")
    addHighlightOverlay(`#${frameId}`, "hotwire-dev-tools-turbo-frame-highlight-overlay")
  }

  #handleMouseLeaveTurboFrame = () => {
    removeHighlightOverlay(".hotwire-dev-tools-turbo-frame-highlight-overlay")
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
    const sortedControllerIds = Object.keys(this.groupedStimulusControllerElements).sort()

    if (sortedControllerIds.length === 0) {
      return `
        <div class="hotwire-dev-tools-no-entry">
          <span>No Stimulus controllers found on this page</span>
          <span>We'll keep looking</span>
        </div>
      `
    }

    const entries = []
    sortedControllerIds.forEach((stimulusControllerId) => {
      let indicator = ""
      if (this.devTool.registeredStimulusControllers.length > 0 && !this.devTool.registeredStimulusControllers.includes(stimulusControllerId)) {
        indicator = `<span style="color: red;" title="Controller not registered">✗</span>`
      }

      const stimulusControllerElements = this.groupedStimulusControllerElements[stimulusControllerId]
      entries.push(`
        <div class="hotwire-dev-tools-entry" data-stimulus-controller-id="${stimulusControllerId}">
          <span>${stimulusControllerId}<sup>${stimulusControllerElements.length}</sup></span>
          ${indicator}
        </div>
      `)
    })

    return entries.join("")
  }

  get turboFrameTabContent() {
    const frames = Array.from(document.querySelectorAll("turbo-frame")).sort((a, b) => a.id.localeCompare(b.id))
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
    const streamTabEntries = Array.from(this.shadowRoot.querySelectorAll("#hotwire-dev-tools-turbo-stream-tab .hotwire-dev-tools-entry"))
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
            <span>${document.querySelectorAll("turbo-frame").length}</span>
          </div>
          ${
            getMetaContent("turbo-prefetch") === "false"
              ? `
            <div class="info-tab-content-wrapper">
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
          <div class="info-tab-content-wrapper" title="Defines how Turbo handles scrolling. Meta Tag: turbo-refresh-scroll">
            <span>Vist Control:</span>
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
            <span>${document.querySelectorAll("[data-controller]").length}</span>
          </div>
        </div>
      </div>
    `
  }

  get groupedStimulusControllerElements() {
    const stimulusControllerElements = document.querySelectorAll("[data-controller]")
    if (stimulusControllerElements.length === 0) return {}

    const groupedElements = {}
    stimulusControllerElements.forEach((element) => {
      element.dataset.controller
        .split(" ")
        .filter((stimulusControllerId) => stimulusControllerId.trim() !== "")
        .forEach((stimulusControllerId) => {
          if (!groupedElements[stimulusControllerId]) {
            groupedElements[stimulusControllerId] = []
          }
          groupedElements[stimulusControllerId].push(element)
        })
    })

    return groupedElements
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
    const existingShadowContainer = document.getElementById("hotwire-dev-tools-shadow-container")
    if (existingShadowContainer) {
      return existingShadowContainer
    }
    const shadowContainer = document.createElement("div")
    shadowContainer.id = "hotwire-dev-tools-shadow-container"
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
      enabledTabs.push({ id: "hotwire-dev-tools-stimulus-tab", label: "Stimulus", content: this.stimulusTabContent })
    }
    if (showTurboFrameTab) {
      enabledTabs.push({ id: "hotwire-dev-tools-turbo-frame-tab", label: "Frames", content: this.turboFrameTabContent })
    }
    if (showTurboStreamTab) {
      enabledTabs.push({ id: "hotwire-dev-tools-turbo-stream-tab", label: "Streams", content: this.turboSteamTabContent })
    }
    if (enabledTabs.length > 0) {
      enabledTabs.push({ id: "hotwire-dev-tools-info-tab", label: Icons.info, content: this.infoTabContent })
    }

    return enabledTabs
  }

  get currentTab() {
    return this.devTool.options.detailPanel.currentTab
  }
}
