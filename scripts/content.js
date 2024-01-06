const port = chrome.runtime.connect({name: "knockknock"});
port.onMessage.addListener(function(msg) {
  switch (msg.type) {
    case "FRAME_DETAILS":
      sendFrameDetails(msg.frameId);
      break;
  }
});

const sendFrames = async () => {
  const frames = Array.from(document.querySelectorAll("turbo-frame")).map((frame) => {
    return {
      id: frame.id,
      src: frame.src
    };
  });

  // This will be the first request. Because we can't be sure that the port is
  // already connected, we'll use chrome.runtime.sendMessage instead of port.postMessage.
  chrome.runtime.sendMessage({
    type: "FRAME_LIST",
    frames: frames
  });
}

const sendFrameDetails = async (frameId) => {
  const frame = document.getElementById(frameId);
  const frameDetails = {
    id: frame.id,
    src: frame.src
  };

  port.postMessage({
    type: "FRAME_DETAILS",
    frameDetails: frameDetails
  });
}

const events = ["DOMContentLoaded", "turbo:load", "turbolinks:load", "turbo:frame-load"];
events.forEach(event => {
  document.addEventListener(event, sendFrames);
});
