const sendRegisteredControllers = () => {
  const registeredControllers = window.Stimulus?.controllers.map(controller => controller.scope.identifier);
  window.postMessage({ source: "inject", message: "stimulusController", registeredControllers: registeredControllers }, window.location.origin);
}

const events = ["DOMContentLoaded", "turbolinks:load", "turbo:load", "turbo:frame-load"];
events.forEach((event) => {
  document.addEventListener(event, sendRegisteredControllers);
});
