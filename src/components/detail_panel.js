import { getMetaContent } from "../lib/utils";
import * as Icons from "../lib/icons"

export default class DetailPanel {
  constructor(devTool) {
    this.devTool = devTool;
  }

  get header() {
    return `
      <div class="hotwire-dev-tools-detail-box-header">
        <div class="hotwire-dev-tools-tablist">
          <button class="hotwire-dev-tools-tablink ${this.currentTab === "hotwire-dev-tools-stimulus-tab" ? "active" : ""}" data-tab-id="hotwire-dev-tools-stimulus-tab">
            Stimulus
          </button>
          <button class="hotwire-dev-tools-tablink ${this.currentTab === "hotwire-dev-tools-turbo-frame-tab" ? "active" : ""}" data-tab-id="hotwire-dev-tools-turbo-frame-tab">
            Frames
          </button>
          <button class="hotwire-dev-tools-tablink ${this.currentTab === "hotwire-dev-tools-turbo-stream-tab" ? "active" : ""}" data-tab-id="hotwire-dev-tools-turbo-stream-tab">
            Streams
          </button>
          <button class="hotwire-dev-tools-tablink tablink-with-icon ${this.currentTab === "hotwire-dev-tools-info-tab" ? "active" : ""}" data-tab-id="hotwire-dev-tools-info-tab">
            ${Icons.info}
          </button>
        </div>
        <button class="hotwire-dev-tools-collapse-button"></button>
      </div>
    `
  }

  get stimulusTabContent() {
    const sortedControllerIds = Object.keys(this.groupedStimulusControllerElements).sort();

    const entries = [];
    sortedControllerIds.forEach((stimulusControllerId) => {
      let indicator = "";
      if (this.devTool.stimulusControllers.length > 0 && !this.devTool.stimulusControllers.includes(stimulusControllerId)) {
        indicator = `<span style="color: red;" title="Controller not registered">✗</span>`
      }

      const stimulusControllerElements = this.groupedStimulusControllerElements[stimulusControllerId];
      entries.push(`
        <div class="hotwire-dev-tools-entry">
          <span>${stimulusControllerId}<sup>${stimulusControllerElements.length}</sup></span>
          ${indicator}
        </div>
      `);
    });

    return entries.join('')
  }

  get turboFrameTabContent() {
    const entries = [];
    const frames = Array.from(document.querySelectorAll("turbo-frame"));
    frames.sort((a, b) => a.id.localeCompare(b.id));
    frames.forEach((frame) => {
      const entry = `
        <div class="hotwire-dev-tools-entry">
          <span>${frame.id}</span>
        </div>
      `;
      entries.push(entry);
    })

    return entries.join('')
  }

  get infoTabContent() {
    return `
      <div class="info-tab-content">
        <div class="info-tab-content-turbo">
          <pre>
            <span>Turbo Frames:</span>
            <span>${document.querySelectorAll("turbo-frame").length}</span>
          </pre>
          <pre>
            <span>Link Prefetch:</span>
            <span>${getMetaContent("turbo-prefetch") !== "false" ? "On" : "Off"}</span>
          </pre>
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
    const stimulusControllerElements = document.querySelectorAll('[data-controller]');
    if (stimulusControllerElements.length === 0) return {};

    const groupedElements = {};
    stimulusControllerElements.forEach(element => {
      element.dataset.controller.split(" ").forEach((stimulusControllerId) => {
        if (!groupedElements[stimulusControllerId]) {
          groupedElements[stimulusControllerId] = [];
        }
        groupedElements[stimulusControllerId].push(element);
      });
    });

    return groupedElements;
  }

  get currentTab() {
    return this.devTool.options.currentTab;
  }

  get html() {
    return `
      ${this.header}
      <div class="hotwire-dev-tools-tab-content ${this.currentTab === "hotwire-dev-tools-stimulus-tab" ? "active" : ""}" id="hotwire-dev-tools-stimulus-tab">
        ${this.stimulusTabContent}
      </div>
      <div class="hotwire-dev-tools-tab-content ${this.currentTab === "hotwire-dev-tools-turbo-frame-tab" ? "active" : ""}" id="hotwire-dev-tools-turbo-frame-tab">
        ${this.turboFrameTabContent}
      </div>
      <div class="hotwire-dev-tools-tab-content ${this.currentTab === "hotwire-dev-tools-turbo-stream-tab" ? "active" : ""}" id="hotwire-dev-tools-turbo-stream-tab">
      </div>
      <div class="hotwire-dev-tools-tab-content ${this.currentTab === "hotwire-dev-tools-info-tab" ? "active" : ""}" id="hotwire-dev-tools-info-tab">
        ${this.infoTabContent}
      </div>
    `
  }

  addTurboStreamToDetailBox = (event) => {
    const turboStream = event.target;
    const action = turboStream.getAttribute("action");
    const target = turboStream.getAttribute("target");

    const entry = document.createElement("div");
    entry.classList.add("hotwire-dev-tools-entry");
    entry.appendChild(Object.assign(document.createElement("span"), { innerText: action }));
    entry.appendChild(Object.assign(document.createElement("span"), { innerText: target }));

    document.getElementById("hotwire-dev-tools-turbo-stream-tab").prepend(entry);

  }
}
