import Devtool from "./lib/devtool";

const devTool = new Devtool();

const highlightFramesInput = document.getElementById("highlight-frames");
const displayDetailPanelInput = document.getElementById("display-detail-panel");
const frameColorInput = document.getElementById("frames-color");
const frameBlacklistInput = document.getElementById("frames-blacklist");
const highlightFramesToggles = document.querySelectorAll(".highlight-frames-toggle-elements");

const toggleFrameColorInput = (show) => {
  if (show) {
    highlightFramesToggles.forEach(element => element.classList.remove("d-none"));
  } else {
    highlightFramesToggles.forEach(element => element.classList.add("d-none"));
  }
}

const initializeForm = (options) => {
  highlightFramesInput.checked = options.frames;
  displayDetailPanelInput.checked = options.detailPanel;
  frameColorInput.value = options.frameColor;
  frameBlacklistInput.value = options.frameBlacklist;
  toggleFrameColorInput(options.frames);
}

(async () => {
  const data = await chrome.storage.sync.get("options");
  const options = data.options || devTool.defaultOptions;

  initializeForm(options);

  // Event listeners to persist selected options
  highlightFramesInput.addEventListener("change", (event) => {
    toggleFrameColorInput(event.target.checked);
    options.frames = event.target.checked;
    chrome.storage.sync.set({ options });
  });

  displayDetailPanelInput.addEventListener("change", (event) => {
    options.detailPanel = event.target.checked;
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
})();
