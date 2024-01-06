chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  document.getElementById("turbo-frame-list").innerHTML = "";
  const frames = request.frames;
  frames.forEach((frame) => {
    const template = document.getElementById("turbo-frame-template");
    const clone = template.content.cloneNode(true);

    const frameIdElement = clone.querySelector(".turbo-frame-id");
    frameIdElement.innerText = frame.id;

    document.getElementById("turbo-frame-list").appendChild(clone);
  });
});
