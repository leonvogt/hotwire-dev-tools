import { html, render } from "lit-html";
import { getMetaContent } from "./lib/utils";

import {
  createDetailBoxContainer,
  createDetailBoxHeader,
  createDetailBoxTabs,
} from "./lib/element_creation";

const state = {
  stimulusControllers: []
}

const highlightTurboFrames = () => {
  const options = getOptions();
  if (!options.frames) {
    document.body.classList.remove("watch-turbo-frames");
    document.querySelectorAll("turbo-frame").forEach((frame) => {
      frame.querySelector(".turbo-frame-info-badge-container")?.remove();
    });
    return
  }

  document.body.classList.add("watch-turbo-frames");
  const { frameColor, frameBlacklist } = options;

  let blacklistedFrames = [];
  if (frameBlacklist) {
    try {
      blacklistedFrames = Array.from(document.querySelectorAll(frameBlacklist));
    } catch (error) {
      console.warn("Hotwire Dev Tools: Invalid frameBlacklist selector:", frameBlacklist);
    }
  }

  const turboFrames = Array.from(document.querySelectorAll("turbo-frame")).filter(frame => !blacklistedFrames.includes(frame));
  turboFrames.forEach((frame) => {
    // Set the frame's outline color
    frame.style.outline = `2px dashed ${frameColor}`;

    // Add a badge to the frame (or update the existing one)
    const badgeClass = "turbo-frame-info-badge"
    const existingBadge = frame.querySelector(`.${badgeClass}`)
    if (existingBadge) {
      existingBadge.style.backgroundColor = frameColor;
    } else {
      const badgeContainer = document.createElement("div");
      badgeContainer.classList.add("turbo-frame-info-badge-container");
      badgeContainer.dataset.turboTemporary = true;

      const badgeContent = document.createElement("span");
      badgeContent.textContent = `ʘ #${frame.id}`
      badgeContent.classList.add(badgeClass);
      badgeContent.style.backgroundColor = frameColor;
      badgeContent.onclick = () => {
        navigator.clipboard.writeText(frame.id);
      }

      if (frame.hasAttribute("src")) {
        badgeContent.classList.add("frame-with-src");
      }
      badgeContainer.appendChild(badgeContent);
      frame.insertAdjacentElement("afterbegin", badgeContainer);
    }
  });
}

function groupedStimulusControllerElements() {
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

const addTurboStreamToDetailBox = (event) => {
  const turboStream = event.target;
  const action = turboStream.getAttribute("action");
  const target = turboStream.getAttribute("target");

  const entry = document.createElement("div");
  entry.classList.add("hotwire-dev-tools-entry");
  entry.appendChild(Object.assign(document.createElement("span"), { innerText: action }));
  entry.appendChild(Object.assign(document.createElement("span"), { innerText: target }));

  document.getElementById("hotwire-dev-tools-turbo-stream-tab").prepend(entry);
}

const createTurboStreamDetailBoxContent = () => {
  const existingContent = document.getElementById("hotwire-dev-tools-turbo-stream-tab");
  if (existingContent) {
    return existingContent;
  }

  const content = document.createElement("div");
  content.classList.add("hotwire-dev-tools-tab-content");
  content.id = "hotwire-dev-tools-turbo-stream-tab";

  return content
}

const createTurboFrameDetailBoxContent = () => {
  const existingContent = document.getElementById("hotwire-dev-tools-turbo-frame-tab");
  if (existingContent) {
    return existingContent;
  }

  const content = document.createElement("div");
  content.classList.add("hotwire-dev-tools-tab-content");
  content.id = "hotwire-dev-tools-turbo-frame-tab";

  document.querySelectorAll("turbo-frame").forEach((frame) => {
    const entry = document.createElement("div");
    entry.classList.add("hotwire-dev-tools-entry");
    entry.appendChild(Object.assign(document.createElement("span"), { innerText: frame.id }));
    content.appendChild(entry);
  })

  return content
}

const createStimulusDetailBoxContent = () => {
  const existingContent = document.getElementById("hotwire-dev-tools-stimulus-tab");
  if (existingContent) {
    existingContent.remove();
  }

  const content = document.createElement("div");
  content.classList.add("hotwire-dev-tools-tab-content", "active");
  content.id = "hotwire-dev-tools-stimulus-tab";

  const groupedStimulusControllers = groupedStimulusControllerElements();
  for (const stimulusControllerId in groupedStimulusControllers) {
    const stimulusControllerElements = groupedStimulusControllers[stimulusControllerId];
    const entry = document.createElement("div");
    entry.classList.add("hotwire-dev-tools-entry");

    // Stimulus controller identifier
    const stimulusIdentifierSpan = document.createElement("span");
    stimulusIdentifierSpan.innerText = stimulusControllerId;

    // Amount of elements with the same controller
    const stimulusIdentifierAmount = document.createElement("sup");
    stimulusIdentifierAmount.innerText = stimulusControllerElements.length;
    stimulusIdentifierSpan.appendChild(stimulusIdentifierAmount);
    entry.appendChild(stimulusIdentifierSpan);

    // Indicator if the controller is not registered
    if (state.stimulusControllers.length > 0 && !state.stimulusControllers.includes(stimulusControllerId)) {
      const registeredIndicator = document.createElement("span");
      registeredIndicator.innerText = "✗";
      registeredIndicator.style.color = "red";
      registeredIndicator.title = "Controller not registered";
      entry.appendChild(registeredIndicator);
    }

    content.appendChild(entry);
  }

  return content
}

const createInfoBoxContent = () => {
  const existingContent = document.getElementById("hotwire-dev-tools-info-tab");
  if (existingContent) {
    return existingContent;
  }

  const content = document.createElement("div");
  content.classList.add("hotwire-dev-tools-tab-content");
  content.id = "hotwire-dev-tools-info-tab";

  const turboContent = html`
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
  `;
  render(turboContent, content);

  return content
}

const createDetailBoxCollapseButton = () => {
  const existingCloseButton = document.querySelector(".hotwire-dev-tools-collapse-button");
  if (existingCloseButton) {
    return existingCloseButton;
  }
  const closeButton = document.createElement("button");
  closeButton.classList.add("hotwire-dev-tools-collapse-button");
  closeButton.onclick = () => {
    const container = document.getElementById("hotwire-dev-tools-detail-box-container")
    container.classList.toggle("collapsed");
    saveOptions({ detailBoxCollapsed: container.classList.contains("collapsed") });
  }
  return closeButton;
}

const renderDetailBox = () => {
  const container = createDetailBoxContainer();
  const options = getOptions();
  if (!options.detailBox) {
    container.remove();
    return;
  }
  if (options.detailBoxCollapsed) {
    container.classList.add("collapsed");
  }

  const header = createDetailBoxHeader();
  header.appendChild(createDetailBoxTabs());
  header.appendChild(createDetailBoxCollapseButton());

  container.appendChild(header);
  container.appendChild(createStimulusDetailBoxContent());
  container.appendChild(createTurboStreamDetailBoxContent());
  container.appendChild(createTurboFrameDetailBoxContent());
  container.appendChild(createInfoBoxContent());
  document.body.appendChild(container);

  listenForTabNavigation();
}

const listenForTabNavigation = () => {
  const tablist = document.querySelector(".hotwire-dev-tools-tablist");
  tablist.addEventListener("click", (event) => {
    document.querySelectorAll(".hotwire-dev-tools-tablink, .hotwire-dev-tools-tab-content").forEach((tab) => {
      tab.classList.remove("active");
    });

    const clickedTab = event.target.closest(".hotwire-dev-tools-tablink");
    const desiredTabContent = document.getElementById(clickedTab.dataset.tabId);

    clickedTab.classList.add("active");
    desiredTabContent.classList.add("active");
  })
}

const injectCustomScript = () => {
  const existingScript = document.getElementById("hotwire-dev-tools-inject-script");
  if (existingScript) return;

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("dist/inject.js");
  script.id = "hotwire-dev-tools-inject-script";
  document.documentElement.appendChild(script);
}

const injectedScriptMessageHandler = (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data.source !== "inject") return;

  switch (event.data.message) {
    case "stimulusController":
      if (event.data.registeredControllers && event.data.registeredControllers.constructor === Array) {
        state.stimulusControllers = event.data.registeredControllers;
        renderDetailBox();
      }
      break;
  }
}

const saveOptions = (options) => {
  const currentOptions = getOptions();
  const newOptions = { ...currentOptions, ...options };
  localStorage.setItem("hotwire-dev-tools-options", JSON.stringify(newOptions));
}

const getOptions = () => {
  const defaultOptions = { frames: false, detailBox: false, frameColor: "#5cd8e5", frameBlacklist: "", detailBoxCollapsed: false };

  const options = localStorage.getItem("hotwire-dev-tools-options")
  if (options === "undefined") return defaultOptions;

  try {
    return JSON.parse(options);
  } catch (error) {
    console.warn("Hotwire Dev Tools: Invalid options:", options);
    return defaultOptions;
  }
}

const init = async () => {
  const data = await chrome.storage.sync.get("options");
  saveOptions(data.options);
  highlightTurboFrames();
  renderDetailBox();
  injectCustomScript();
}

const events = ["DOMContentLoaded", "turbolinks:load", "turbo:load", "turbo:frame-load", "hotwire-dev-tools:options-changed"];
events.forEach(event => document.addEventListener(event, init));
document.addEventListener("turbo:before-stream-render", addTurboStreamToDetailBox);

// Listen for potential message from the injected script
window.addEventListener("message", injectedScriptMessageHandler);

// Listen for option changes made in the popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.options?.newValue) {
    saveOptions(changes.options.newValue);
    document.dispatchEvent(new CustomEvent("hotwire-dev-tools:options-changed", { detail: changes.options.newValue }));
  }
});
