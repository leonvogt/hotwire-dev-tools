const connectionPort = chrome.runtime.connect({ name: "knockknock" });
let connected = false;

connectionPort.onMessage.addListener(function (message) {
  console.log("content.js: Received message:", message);
  switch (message.type) {
    case "CONNECTED":
      console.debug("content.js: Connected ...");
      connected = true;
      break;
    case "FRAME_LIST":
      sendFrames();
      break;
    case "FRAME_DETAILS":
      sendFrameDetails(message.frameId);
      break;
    case "STIMULUS_LIST":
      sendStimulusList();
      break;
  }
});

const sendFrames = async () => {
  if (!connected) {
    console.debug("content.js#sendFrames: Not connected yet");
    return;
  }

  const frames = Array.from(document.querySelectorAll("turbo-frame")).map((frame) => {
    return {
      id: frame.id,
      src: frame.src
    };
  });

  // This will be the first request. Because we can't be sure that the port is
  // already connected, we'll use chrome.runtime.sendMessage instead of port.postMessage.
  connectionPort.postMessage({
    type: "FRAME_LIST",
    frames: frames
  });
}

const sendFrameDetails = async (frameId) => {
  if (!connected) {
    console.debug("content.js#sendFrameDetails: Not connected yet");
    return;
  }

  const frame = document.getElementById(frameId);
  const frameDetails = {
    id: frame.id,
    src: frame.src
  };

  connectionPort.postMessage({
    type: "FRAME_DETAILS",
    frameDetails: frameDetails
  });
}

const sendStimulusList = async () => {
  if (!connected) {
    console.debug("content.js#sendStimulusList: Not connected yet");
    return;
  }

  const stimulusControllers = Array.from(document.querySelectorAll("[data-controller]")).map((element) => {
    return {
      id: element.dataset.controller
    };
  });

  connectionPort.postMessage({
    type: "STIMULUS_LIST",
    stimulusControllers: stimulusControllers
  });
}

const sendCurrentStateToPanel = async () => {
  sendFrames();
  sendStimulusList();
}

const highlightTurboFrames = async () => {
  const options = await getOptions();
  if (!options.frames) {
    document.body.classList.remove("watch-turbo-frames");
    document.querySelectorAll("turbo-frame").forEach((frame) => {
      frame.querySelector(".turbo-frame-info-badge-container")?.remove();
    });
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
    frame.style.outline = `1px solid ${frameColor}`;

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

const createDetailBoxContainer = () => {
  const existingContainer = document.getElementById("hotwire-dev-tools-detail-box-container");
  if (existingContainer) {
    return existingContainer;
  }
  const container = document.createElement("div");
  container.id = "hotwire-dev-tools-detail-box-container";
  container.dataset.turboPermanent = true;
  return container;
}

const createStimulusTab = () => {
  const existingTab = document.querySelector("[data-tab-id='hotwire-dev-tools-stimulus-tab']");

  if (existingTab) {
    return existingTab;
  }
  const stimulusTab = document.createElement("button");
  stimulusTab.classList.add("hotwire-dev-tools-tablink", "active");
  stimulusTab.dataset.tabId = "hotwire-dev-tools-stimulus-tab";
  stimulusTab.innerText = "Stimulus";
  return stimulusTab;
}

const createTurboStreamTab = () => {
  const existingTab = document.querySelector("[data-tab-id='hotwire-dev-tools-turbo-stream-tab']");

  if (existingTab) {
    return existingTab;
  }
  const turboStreamTab = document.createElement("button");
  turboStreamTab.classList.add("hotwire-dev-tools-tablink");
  turboStreamTab.dataset.tabId = "hotwire-dev-tools-turbo-stream-tab";
  turboStreamTab.innerText = "Streams";
  return turboStreamTab;
}

const createTurboFrameTab = () => {
  const existingTab = document.querySelector("[data-tab-id='hotwire-dev-tools-turbo-frame-tab']");

  if (existingTab) {
    return existingTab;
  }
  const turboFrameTab = document.createElement("button");
  turboFrameTab.classList.add("hotwire-dev-tools-tablink");
  turboFrameTab.dataset.tabId = "hotwire-dev-tools-turbo-frame-tab";
  turboFrameTab.innerText = "Frames";
  return turboFrameTab;
}

const createDetailBoxHeader = () => {
  const existingHeader = document.querySelector(".hotwire-dev-tools-detail-box-header");
  if (existingHeader) {
    return existingHeader;
  }
  const header = document.createElement("div");
  header.classList.add("hotwire-dev-tools-detail-box-header");
  return header;
}

const createDetailBoxCloseButton = () => {
  const existingCloseButton = document.querySelector(".hotwire-dev-tools-close-button");
  if (existingCloseButton) {
    return existingCloseButton;
  }
  const closeButton = document.createElement("button");
  closeButton.classList.add("hotwire-dev-tools-close-button");
  closeButton.onclick = () => {
    document.getElementById("hotwire-dev-tools-detail-box-container").classList.toggle("collapsed");
  }
  return closeButton;
}

const createDetailBoxTabList = () => {
  const existingTablist = document.querySelector(".hotwire-dev-tools-tablist");
  if (existingTablist) {
    return existingTablist;
  }
  const tablist = document.createElement("div");
  tablist.classList.add("hotwire-dev-tools-tablist");
  return tablist;
}

const createDetailBoxTabs = () => {
  const tablist = createDetailBoxTabList();
  tablist.appendChild(createStimulusTab());
  tablist.appendChild(createTurboFrameTab());
  tablist.appendChild(createTurboStreamTab());
  return tablist;
}

const groupedStimulusControllerElements = () => {
  const stimulusControllerElements = Array.from(document.querySelectorAll("[data-controller]"));
  if (stimulusControllerElements.length === 0) return {};

  const groupedStimulusControllerElements = stimulusControllerElements.reduce((acc, stimulusControllerElement) => {
    const stimulusControllerId = stimulusControllerElement.dataset.controller;
    if (!acc[stimulusControllerId]) {
      acc[stimulusControllerId] = [];
    }
    acc[stimulusControllerId].push(stimulusControllerElement);
    return acc;
  })

  return groupedStimulusControllerElements;
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
    return existingContent;
  }

  const content = document.createElement("div");
  content.classList.add("hotwire-dev-tools-tab-content", "active");
  content.id = "hotwire-dev-tools-stimulus-tab";

  const groupedStimulusControllers = groupedStimulusControllerElements();
  Object.keys(groupedStimulusControllers).sort().forEach((stimulusControllerId) => {
    const stimulusControllerElements = groupedStimulusControllers[stimulusControllerId];
    const entry = document.createElement("div");
    entry.classList.add("hotwire-dev-tools-entry");

    const stimulusIdentifierSpan = document.createElement("span");
    stimulusIdentifierSpan.innerText = stimulusControllerId;
    if (stimulusControllerElements.length > 1) {
      const stimulusIdentifierAmount = document.createElement("sup");
      stimulusIdentifierAmount.innerText = stimulusControllerElements.length;
      stimulusIdentifierSpan.appendChild(stimulusIdentifierAmount);
    }

    entry.appendChild(stimulusIdentifierSpan);
    content.appendChild(entry);
  })

  return content
}

const renderDetailBox = async () => {
  const container = createDetailBoxContainer();
  const options = await getOptions();
  if (!options.detailBox) {
    container.remove();
    return;
  }

  const header = createDetailBoxHeader();
  header.appendChild(createDetailBoxTabs());
  header.appendChild(createDetailBoxCloseButton());

  container.appendChild(header);
  container.appendChild(createStimulusDetailBoxContent());
  container.appendChild(createTurboStreamDetailBoxContent());
  container.appendChild(createTurboFrameDetailBoxContent());
  document.body.appendChild(container);

  listenForTabNavigation();
}

const listenForTabNavigation = () => {
  const tablist = document.querySelector(".hotwire-dev-tools-tablist");
  tablist.addEventListener("click", (event) => {
    document.querySelectorAll(".hotwire-dev-tools-tablink, .hotwire-dev-tools-tab-content").forEach((tab) => {
      tab.classList.remove("active");
    });

    const clickedTab = event.target;
    const desiredTabContent = document.getElementById(event.target.dataset.tabId);

    clickedTab.classList.add("active");
    desiredTabContent.classList.add("active");
  })
}

const saveOptions = async (options) => {
  localStorage.setItem("hotwire-dev-tools-options", JSON.stringify(options));
}

const getOptions = () => {
  const defaultOptions = { frames: false, detailBox: false, frameColor: "#5cd8e5", frameBlacklist: "" };

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
}

const events = ["DOMContentLoaded", "turbolinks:load", "turbo:load", "turbo:frame-load", "hotwire-dev-tools:options-changed"];
events.forEach((event) => {
  document.addEventListener(event, sendCurrentStateToPanel);
  document.addEventListener(event, init);
});
document.addEventListener("turbo:before-stream-render", addTurboStreamToDetailBox);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.options?.newValue) {
    saveOptions(changes.options.newValue);
    document.dispatchEvent(new CustomEvent("hotwire-dev-tools:options-changed", { detail: changes.options.newValue }));
  }
});
