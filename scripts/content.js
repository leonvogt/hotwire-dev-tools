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

const sendCurrentState = async () => {
  sendFrames();
  sendStimulusList();
}

const highlightTurboFrames = async () => {
  const options = await getOptions();
  const frameColor = options?.frameColor || "#5cd8e5";

  document.querySelectorAll("turbo-frame").forEach((frame) => {
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

      if (frame.hasAttribute("src")) {
        badgeContent.classList.add("frame-with-src");
      }
      badgeContainer.appendChild(badgeContent);
      frame.insertAdjacentElement("afterbegin", badgeContainer);
    }
  });
}

const removeInfoBadgesFromTurboFrames = () => {
  document.querySelectorAll("turbo-frame").forEach((frame) => {
    frame.querySelector(".turbo-frame-info-badge-container")?.remove();
  });
}

const watchTurboFrames = async () => {
  const options = await getOptions();
  if (Boolean(options.frames)) {
    document.body.classList.add("watch-turbo-frames");
    highlightTurboFrames();
  } else {
    document.body.classList.remove("watch-turbo-frames");
    removeInfoBadgesFromTurboFrames();
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.options?.newValue) {
    saveOptions(changes.options.newValue);
    document.dispatchEvent(new CustomEvent("hotwire-dev-tools:options-changed", { detail: changes.options.newValue }));
  }
});

const saveOptions = async (options) => {
  localStorage.setItem("options", JSON.stringify(options));
}

const getOptions = async () => {
  return JSON.parse(localStorage.getItem("options"));
}

const init = async () => {
  const data = await chrome.storage.sync.get("options");
  saveOptions(data.options);
  watchTurboFrames();
}

const events = ["DOMContentLoaded", "turbolinks:load", "turbo:load", "turbo:frame-load", "hotwire-dev-tools:options-changed"];
events.forEach((event) => {
  document.addEventListener(event, sendCurrentState);
  document.addEventListener(event, init);
});
