const optionsForm = document.getElementById("optionsForm");
const watchFramesInput = document.getElementById("watch-frames");
const frameColorInput = document.getElementById("frames-color");
const options = {};

// Initialize the form with the user's option settings
const data = await chrome.storage.sync.get("options");
Object.assign(options, data.options);
watchFramesInput.checked = Boolean(options.frames);
frameColorInput.value = options.frameColor;

// Event listeners to persist selected settings
watchFramesInput.addEventListener("change", (event) => {
  options.frames = event.target.checked;
  chrome.storage.sync.set({ options });
});

frameColorInput.addEventListener("change", (event) => {
  options.frameColor = event.target.value;
  chrome.storage.sync.set({ options });
});
