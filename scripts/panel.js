let activePort = {}

chrome.runtime.onConnect.addListener(function(port) {
  activePort = port;
  port.onMessage.addListener(function(request) {
    switch (request.type) {
      case "FRAME_DETAILS":
        populateFrameDetails(request.frameDetails);
        break;
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "FRAME_LIST":
      populateFrameList(request.frames);
      break;
    case "TURBO_STREAMS":
      populateTurboStreamList(request.turboStreams);
      break;
  }
});

const populateFrameList = (frames) => {
  document.getElementById("turbo-frame-list").innerHTML = "";

  frames.forEach((frame) => {
    const template = document.getElementById("turbo-frame-template");
    const clone = template.content.cloneNode(true);

    const frameInfoElement = clone.querySelector(".turbo-frame");
    frameInfoElement.dataset.frameId = frame.id;

    const frameIdElement = clone.querySelector(".turbo-frame-id");
    frameIdElement.innerText = frame.id;
    frameIdElement.dataset.frameId = frame.id;

    document.getElementById("turbo-frame-list").appendChild(clone);
  });
}

const populateFrameDetails = (frameDetails) => {
  const template = document.getElementById("turbo-frame-details-template");
  const clone = template.content.cloneNode(true);

  const frameIdElement = clone.querySelector(".turbo-frame-id");
  frameIdElement.innerText = frameDetails.id;

  document.getElementById("turbo-frame-details").innerHTML = "";
  document.getElementById("turbo-frame-details").appendChild(clone);
}

const populateTurboStreamList = (turboStreams) => {
  turboStreams.forEach((turboStream) => {
    const template = document.getElementById("turbo-stream-template");
    const clone = template.content.cloneNode(true);

    const turboStreamContentElement = clone.querySelector(".turbo-stream-content");
    turboStreamContentElement.innerText = turboStream;

    document.getElementById("turbo-stream-list").appendChild(clone);
  });
}

// Handle tab navigation
document.querySelector(".tablist").addEventListener("click", (event) => {
  document.querySelectorAll(".tabcontent, .tablinks").forEach((tab) => {
    tab.className = tab.className.replace(" active", "");
  });

  const clickedTab = event.target;
  const desiredTabContent = document.getElementById(event.target.dataset.tabId);
  clickedTab.className += " active";
  desiredTabContent.className += " active";
})

// Handle frame selection
document.getElementById("turbo-frame-list").addEventListener("click", (e) => {
  if (!e.target.dataset.frameId) return;

  const frameId = e.target.dataset.frameId;
  activePort.postMessage({
    type: "FRAME_DETAILS",
    frameId: frameId
  });
})
