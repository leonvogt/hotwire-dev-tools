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
    })
  }

  addTurboStreamToDetailPanel = (event) => {
    const turboStream = event.target
    const action = turboStream.getAttribute("action")
    const target = turboStream.getAttribute("target")

    const entry = document.createElement("div")
    entry.classList.add("hotwire-dev-tools-entry")
    entry.innerHTML = `
      <span>${action}</span>
      <span>${target}</span>
    `

    this.shadowRoot.getElementById("hotwire-dev-tools-turbo-stream-tab").prepend(entry)
  }

  get panelHeader() {
    const tabs = [
      { id: "hotwire-dev-tools-stimulus-tab", label: "Stimulus" },
      { id: "hotwire-dev-tools-turbo-frame-tab", label: "Frames" },
      { id: "hotwire-dev-tools-turbo-stream-tab", label: "Streams" },
      { id: "hotwire-dev-tools-info-tab", label: Icons.info, icon: true },
    ]

    return `
      <div class="hotwire-dev-tools-detail-panel-header">
        <div class="hotwire-dev-tools-tablist">
          ${tabs
            .map(
              (tab) => `
            <button class="hotwire-dev-tools-tablink ${this.currentTab === tab.id ? "active" : ""} ${tab.icon ? "tablink-with-icon" : ""}" data-tab-id="${tab.id}">
              ${tab.label}
            </button>
          `,
            )
            .join("")}
        </div>
        <button class="hotwire-dev-tools-collapse-button"></button>
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
    return frames
      .map(
        (frame) => `
      <div class="hotwire-dev-tools-entry">
        <span>${frame.id}</span>
      </div>
    `,
      )
      .join("")
  }

  get infoTabContent() {
    return `
      <div class="info-tab-content">
        <div class="info-tab-content-turbo">
          <pre>
            <span>Turbo Frames:</span>
            <span>${document.querySelectorAll("turbo-frame").length}</span>
          </pre>
          ${
            getMetaContent("turbo-prefetch") === "false"
              ? `
            <pre>
              <span>Link Prefetch:</span>
              <span>Off</span>
            </pre>
          `
              : ""
          }
          <pre>
            <span>Refresh Control:</span>
            <span>${getMetaContent("turbo-refresh-method") || "-"}</span>
          </pre>
          <pre>
            <span>Vist Control:</span>
            <span>${getMetaContent("turbo-visit-control") || "-"}</span>
          </pre>
          <pre>
            <span>Cache Control:</span>
            <span>${getMetaContent("turbo-cache-control") || "-"}</span>
          </pre>
        </div>

        <div class="info-tab-content-stimulus">
          <pre>
            <span>Stimulus Controllers:</span>
            <span>${document.querySelectorAll("[data-controller]").length}</span>
          </pre>
        </div>
      </div>
    `
  }

  get groupedStimulusControllerElements() {
    const stimulusControllerElements = document.querySelectorAll("[data-controller]")
    if (stimulusControllerElements.length === 0) return {}

    const groupedElements = {}
    stimulusControllerElements.forEach((element) => {
      element.dataset.controller.split(" ").forEach((stimulusControllerId) => {
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
    container.dataset.turboPermanent = true
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
    const tabContents = [
      {
        id: "hotwire-dev-tools-stimulus-tab",
        content: this.stimulusTabContent,
      },
      {
        id: "hotwire-dev-tools-turbo-frame-tab",
        content: this.turboFrameTabContent,
      },
      { id: "hotwire-dev-tools-turbo-stream-tab", content: "" }, // Assuming the content is empty as in the original code
      { id: "hotwire-dev-tools-info-tab", content: this.infoTabContent },
    ]

    return `
      ${this.panelHeader}
      ${tabContents
        .map(
          (tab) => `
        <div class="hotwire-dev-tools-tab-content ${this.currentTab === tab.id ? "active" : ""}" id="${tab.id}">
          ${tab.content}
        </div>
      `,
        )
        .join("")}
    `
  }

  get currentTab() {
    return this.devTool.options.currentTab
  }
}
