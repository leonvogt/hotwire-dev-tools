document.querySelectorAll("turbo-frame").forEach((frame) => {
  frame.style.border = "1px #5CD8E5 solid";
  frame.style.borderRadius = "5px";
  frame.style.display = "block";

  const infoBadge = document.createElement("span");
  infoBadge.textContent = `#${frame.id}`
  frame.insertAdjacentElement("afterbegin", infoBadge);
});
