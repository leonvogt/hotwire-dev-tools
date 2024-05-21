const optionsForm = document.getElementById("optionsForm");
const watchFramesInput = document.getElementById("watch-frames");
const frameColorInput = document.getElementById("frames-color");

const toggleFrameColorInput = (show) => {
  if (show) {
    frameColorInput.classList.remove("d-none");
  } else {
    frameColorInput.classList.add("d-none");
  }
}

// Initialize the form with the user's options
const data = await chrome.storage.sync.get("options");
const options = data.options || { frames: false, frameColor: "#5cd8e5" };

watchFramesInput.checked = options.frames;
frameColorInput.value = options.frameColor;
toggleFrameColorInput(options.frames);

// Event listeners to persist selected options
watchFramesInput.addEventListener("change", (event) => {
  toggleFrameColorInput(event.target.checked);
  options.frames = event.target.checked;
  chrome.storage.sync.set({ options });
});

frameColorInput.addEventListener("change", (event) => {
  options.frameColor = event.target.value;
  chrome.storage.sync.set({ options });
});
