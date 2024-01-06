document.querySelectorAll("turbo-frame").forEach((frame) => {
  frame.style.border = "1px #5CD8E5 solid";
  frame.style.borderRadius = "5px";
  frame.style.display = "block";

  const infoBadge = document.createElement("span");
  infoBadge.textContent = `#${frame.id}`
  frame.insertAdjacentElement("afterbegin", infoBadge);
});

const sendFrames = async () => {
  chrome.runtime.sendMessage({
    type: "FRAMES",
    frames: Array.from(document.querySelectorAll("turbo-frame")).map((frame) => {
      return {
        id: frame.id,
        src: frame.src
      };
    }),
  });
}

const events = ["DOMContentLoaded", "turbo:load", "turbolinks:load", "turbo:frame-load"];
events.forEach(event => {
  document.addEventListener(event, sendFrames);
});
