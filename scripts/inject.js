const sendRegisteredControllers = () => {
  const registeredControllers = Array.from(window.Stimulus?.router.modulesByIdentifier.keys())
  window.postMessage({ source: "inject", message: "stimulusController", registeredControllers: registeredControllers }, window.location.origin);
}

const events = ["DOMContentLoaded", "turbolinks:load", "turbo:load", "turbo:frame-load"];
events.forEach((event) => {
  document.addEventListener(event, sendRegisteredControllers);
});
