import { getMetaContent, debounce } from "../lib/utils"
import * as Icons from "../lib/icons"

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
  }, 150)

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

    container.classList.toggle("collapsed", this.devTool.options.detailPanelCollapsed)
    this.toggleCollapse()
  }

  listenForTabNavigation() {
    const tablist = this.shadowRoot.querySelector(".hotwire-dev-tools-tablist")
    tablist.addEventListener("click", (event) => {
      this.shadowRoot.querySelectorAll(".hotwire-dev-tools-tablink, .hotwire-dev-tools-tab-content").forEach((tab) => {
        tab.classList.remove("active")
      })

      const clickedTab = event.target.closest(".hotwire-dev-tools-tablink")
      const desiredTabContent = this.shadowRoot.getElementById(clickedTab.dataset.tabId)

      clickedTab.classList.add("active")
      desiredTabContent.classList.add("active")

      this.devTool.saveOptions({ currentTab: clickedTab.dataset.tabId })
    })
  }

  listenForCollapse() {
    this.shadowRoot.querySelector(".hotwire-dev-tools-collapse-button").addEventListener("click", () => {
      const container = this.shadowRoot.getElementById("hotwire-dev-tools-detail-panel-container")
      container.classList.toggle("collapsed")
      this.devTool.saveOptions({
        detailPanelCollapsed: container.classList.contains("collapsed"),
      })
      this.toggleCollapse()
    })
  }

  addTurboStreamToDetailPanel = (event) => {
    const turboStream = event.target
    const action = turboStream.getAttribute("action")
    const target = turboStream.getAttribute("target")

    const entry = document.createElement("div")
    entry.classList.add("hotwire-dev-tools-entry")
    entry.innerHTML = `<span>${action}</span><span>${target}</span>`

    this.shadowRoot.getElementById("hotwire-dev-tools-turbo-stream-tab").prepend(entry)
  }

  toggleCollapse = () => {
    if (this.devTool.options.detailPanelCollapsed) {
      this.shadowRoot.querySelector(".collapse-icon").style.display = "none"
      this.shadowRoot.querySelector(".expand-icon").style.display = "contents"
    } else {
      this.shadowRoot.querySelector(".collapse-icon").style.display = "contents"
      this.shadowRoot.querySelector(".expand-icon").style.display = "none"
    }
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

    const entries = []
    sortedControllerIds.forEach((stimulusControllerId) => {
      let indicator = ""
      if (this.devTool.stimulusControllers.length > 0 && !this.devTool.stimulusControllers.includes(stimulusControllerId)) {
        indicator = `<span style="color: red;" title="Controller not registered">✗</span>`
      }

      const stimulusControllerElements = this.groupedStimulusControllerElements[stimulusControllerId]
      entries.push(`
        <div class="hotwire-dev-tools-entry">
          <span>${stimulusControllerId}<sup>${stimulusControllerElements.length}</sup></span>
          ${indicator}
        </div>
      `)
    })

    return entries.join("")
  }

  get turboFrameTabContent() {
    const frames = Array.from(document.querySelectorAll("turbo-frame")).sort((a, b) => a.id.localeCompare(b.id))
    return frames.map((frame) => `<div class="hotwire-dev-tools-entry"><span>${frame.id}</span></div>`).join("")
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
          <div class="info-tab-content-wrapper">
            <span>Refresh Control:</span>
            <span>${getMetaContent("turbo-refresh-method") || "-"}</span>
          </div>
          <div class="info-tab-content-wrapper">
            <span>Vist Control:</span>
            <span>${getMetaContent("turbo-visit-control") || "-"}</span>
          </div>
          <div class="info-tab-content-wrapper">
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
    return [
      { id: "hotwire-dev-tools-stimulus-tab", label: "Stimulus", content: this.stimulusTabContent },
      { id: "hotwire-dev-tools-turbo-frame-tab", label: "Frames", content: this.turboFrameTabContent },
      { id: "hotwire-dev-tools-turbo-stream-tab", label: "Streams", content: "" },
      { id: "hotwire-dev-tools-info-tab", label: Icons.info, content: this.infoTabContent },
    ]
  }

  get currentTab() {
    return this.devTool.options.currentTab
  }
}
