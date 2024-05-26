export const createDetailBoxContainer = () => {
  const existingContainer = document.getElementById("hotwire-dev-tools-detail-box-container");
  if (existingContainer) {
    return existingContainer;
  }
  const container = document.createElement("div");
  container.id = "hotwire-dev-tools-detail-box-container";
  container.dataset.turboPermanent = true;
  return container;
}

export const createStimulusTab = () => {
  const existingTab = document.querySelector("[data-tab-id='hotwire-dev-tools-stimulus-tab']");

  if (existingTab) {
    return existingTab;
  }
  const stimulusTab = document.createElement("button");
  stimulusTab.classList.add("hotwire-dev-tools-tablink", "active");
  stimulusTab.dataset.tabId = "hotwire-dev-tools-stimulus-tab";
  stimulusTab.innerText = "Stimulus";
  return stimulusTab;
}

export const createTurboStreamTab = () => {
  const existingTab = document.querySelector("[data-tab-id='hotwire-dev-tools-turbo-stream-tab']");

  if (existingTab) {
    return existingTab;
  }
  const turboStreamTab = document.createElement("button");
  turboStreamTab.classList.add("hotwire-dev-tools-tablink");
  turboStreamTab.dataset.tabId = "hotwire-dev-tools-turbo-stream-tab";
  turboStreamTab.innerText = "Streams";
  return turboStreamTab;
}

export const createTurboFrameTab = () => {
  const existingTab = document.querySelector("[data-tab-id='hotwire-dev-tools-turbo-frame-tab']");

  if (existingTab) {
    return existingTab;
  }
  const turboFrameTab = document.createElement("button");
  turboFrameTab.classList.add("hotwire-dev-tools-tablink");
  turboFrameTab.dataset.tabId = "hotwire-dev-tools-turbo-frame-tab";
  turboFrameTab.innerText = "Frames";
  return turboFrameTab;
}

export const createDetailBoxHeader = () => {
  const existingHeader = document.querySelector(".hotwire-dev-tools-detail-box-header");
  if (existingHeader) {
    return existingHeader;
  }
  const header = document.createElement("div");
  header.classList.add("hotwire-dev-tools-detail-box-header");
  return header;
}

export const createDetailBoxCollapseButton = () => {
  const existingCloseButton = document.querySelector(".hotwire-dev-tools-collapse-button");
  if (existingCloseButton) {
    return existingCloseButton;
  }
  const closeButton = document.createElement("button");
  closeButton.classList.add("hotwire-dev-tools-collapse-button");
  closeButton.onclick = () => {
    const container = document.getElementById("hotwire-dev-tools-detail-box-container")
    container.classList.toggle("collapsed");
    saveOptions({ detailBoxCollapsed: container.classList.contains("collapsed") });
  }
  return closeButton;
}

export const createDetailBoxTabList = () => {
  const existingTablist = document.querySelector(".hotwire-dev-tools-tablist");
  if (existingTablist) {
    return existingTablist;
  }
  const tablist = document.createElement("div");
  tablist.classList.add("hotwire-dev-tools-tablist");
  return tablist;
}

export const createDetailBoxTabs = () => {
  const tablist = createDetailBoxTabList();
  tablist.appendChild(createStimulusTab());
  tablist.appendChild(createTurboFrameTab());
  tablist.appendChild(createTurboStreamTab());
  return tablist;
}
