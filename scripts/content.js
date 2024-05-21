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

const addInfoBadgesToTurboFrames = () => {
  document.querySelectorAll("turbo-frame").forEach((frame) => {
    const badgeContainer = document.createElement("div");
    badgeContainer.classList.add("turbo-frame-info-badge-container");

    const infoBadge = document.createElement("span");
    infoBadge.textContent = `ʘ #${frame.id}`
    infoBadge.classList.add("turbo-frame-info-badge");
    if (frame.hasAttribute("src")) {
      infoBadge.classList.add("frame-with-src");
    }
    badgeContainer.appendChild(infoBadge);

    frame.insertAdjacentElement("afterbegin", badgeContainer);
  });
}

const removeInfoBadgesFromTurboFrames = () => {
  document.querySelectorAll("turbo-frame").forEach((frame) => {
    frame.querySelector(".turbo-frame-info-badge-container")?.remove();
  });
}

const watchTurboFrames = (watchFrames) => {
  console.log("watchTurboFrames", watchFrames);
  if (watchFrames) {
    document.body.classList.add("watch-turbo-frames");
    addInfoBadgesToTurboFrames();
  } else {
    document.body.classList.remove("watch-turbo-frames");
    removeInfoBadgesFromTurboFrames();
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.options?.newValue) {
    const watchFrames = Boolean(changes.options.newValue.frames);
    watchTurboFrames(watchFrames);
  }
});

const init = async () => {
  const data = await chrome.storage.sync.get("options");
  watchTurboFrames(Boolean(data.options?.frames));
}

const events = ["DOMContentLoaded", "turbolinks:load", "turbo:load", "turbo:frame-load"];
events.forEach((event) => {
  document.addEventListener(event, sendCurrentState);
  document.addEventListener(event, init);
});