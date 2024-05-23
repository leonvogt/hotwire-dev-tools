const optionsForm = document.getElementById("options-form");
const watchFramesInput = document.getElementById("watch-frames");
const watchStreamsInput = document.getElementById("watch-streams");
const frameColorInput = document.getElementById("frames-color");
const frameBlacklistInput = document.getElementById("frames-blacklist");
const watchFramesToggles = document.querySelectorAll(".watch-frames-toggle-elements");

const toggleFrameColorInput = (show) => {
  if (show) {
    watchFramesToggles.forEach((element) => element.classList.remove("d-none"));
  } else {
    watchFramesToggles.forEach((element) => element.classList.add("d-none"));
  }
}

// Initialize the form with the user's options
const data = await chrome.storage.sync.get("options");
const options = data.options || { frames: false, streams: false, frameColor: "#5cd8e5", frameBlacklist: "" };

watchFramesInput.checked = options.frames;
watchStreamsInput.checked = options.streams;
frameColorInput.value = options.frameColor;
frameBlacklistInput.value = options.frameBlacklist;
toggleFrameColorInput(options.frames);

// Event listeners to persist selected options
watchFramesInput.addEventListener("change", (event) => {
  toggleFrameColorInput(event.target.checked);
  options.frames = event.target.checked;
  chrome.storage.sync.set({ options });
});

watchStreamsInput.addEventListener("change", (event) => {
  options.streams = event.target.checked;
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
