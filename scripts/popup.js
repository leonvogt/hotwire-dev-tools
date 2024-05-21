const optionsForm = document.getElementById("optionsForm");
const options = {};

// Initialize the form with the user's option settings
const data = await chrome.storage.sync.get("options");
Object.assign(options, data.options);
optionsForm.frames.checked = Boolean(options.frames);

// Persist selected options
optionsForm.frames.addEventListener("change", (event) => {
  options.frames = event.target.checked;
  chrome.storage.sync.set({ options });
});
