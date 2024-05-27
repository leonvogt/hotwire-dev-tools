const sendRegisteredControllers = () => {
  const registeredControllers = window.Stimulus?.router.modulesByIdentifier.keys()
  window.postMessage({ source: "inject", message: "stimulusController", registeredControllers: Array.from(registeredControllers || []) }, window.location.origin);
}

const sendTurboDetails = () => {
  const details = {
    turboDriveEnabled: window.Turbo?.session.drive,
  }
  window.postMessage({ source: "inject", message: "turboDetails", details: details }, window.location.origin);
}

const sendWindowDetails = () => {
  sendRegisteredControllers();
  sendTurboDetails();
}

const events = ["DOMContentLoaded", "turbolinks:load", "turbo:load", "turbo:frame-load"];
events.forEach((event) => {
  document.addEventListener(event, sendWindowDetails);
});
