const optionsForm = document.getElementById("options-form");
const highlightFramesInput = document.getElementById("highlight-frames");
const displayDetailBoxInput = document.getElementById("display-detail-box");
const frameColorInput = document.getElementById("frames-color");
const frameBlacklistInput = document.getElementById("frames-blacklist");
const highlightFramesToggles = document.querySelectorAll(".highlight-frames-toggle-elements");

const toggleFrameColorInput = (show) => {
  if (show) {
    highlightFramesToggles.forEach((element) => element.classList.remove("d-none"));
  } else {
    highlightFramesToggles.forEach((element) => element.classList.add("d-none"));
  }
}

const init = () => {
  const data = chrome.storage.sync.get("options");
  const options = data.options || { frames: false, detailBox: false, frameColor: "#5cd8e5", frameBlacklist: "" };

  highlightFramesInput.checked = options.frames;
  displayDetailBoxInput.checked = options.detailBox;
  frameColorInput.value = options.frameColor;
  frameBlacklistInput.value = options.frameBlacklist;
  toggleFrameColorInput(options.frames);
}

init()

// Event listeners to persist selected options
highlightFramesInput.addEventListener("change", (event) => {
  toggleFrameColorInput(event.target.checked);
  options.frames = event.target.checked;
  chrome.storage.sync.set({ options });
});

displayDetailBoxInput.addEventListener("change", (event) => {
  options.detailBox = event.target.checked;
  chrome.storage.sync.set({ options });
});

frameColorInput.addEventListener("change", (event) => {
  options.frameColor = event.target.value;
  chrome.storage.sync.set({ options });
});

frameBlacklistInput.addEventListener("input", (event) => {
  options.frameBlacklist = event.target.value;
  chrome.storage.sync.set({ options });
})
