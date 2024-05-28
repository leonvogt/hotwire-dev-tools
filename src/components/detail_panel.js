import { getMetaContent } from "../lib/utils"
import * as Icons from "../lib/icons"

export default class DetailPanel {
  constructor(devTool) {
    this.devTool = devTool
  }

  get header() {
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

  get currentTab() {
    return this.devTool.options.currentTab
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
      ${this.header}
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

  addTurboStreamToDetailPanel = (event) => {
    const turboStream = event.target
    const action = turboStream.getAttribute("action")
    const target = turboStream.getAttribute("target")

    const entry = document.createElement("div")
    entry.classList.add("hotwire-dev-tools-entry")
    entry.appendChild(Object.assign(document.createElement("span"), { innerText: action }))
    entry.appendChild(Object.assign(document.createElement("span"), { innerText: target }))

    document.getElementById("hotwire-dev-tools-turbo-stream-tab").prepend(entry)
  }
}
