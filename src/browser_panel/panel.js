/* @refresh reload */
import { inspectorPortName } from "./ports"
import { handleBackendToPanelMessage } from "./messaging"

/* Entrypoint for Extension panel, integrates with Devtools/extension APIs, initialises the solidJS app, see also index.html */
function connect() {
  // There's probably a better way than injecting backend.js from here
  // eg. watching the active tab in content.ts or background.ts
  // the flow goes:
  // 1. [panel] inject backend
  // 2. [panel] connect on an "inspector" port
  // 3. connection is picked up by background
  // 4. background injects proxy (because the connection was triggered by an "inspector" port)
  // 5. proxy starts a connection back to background
  //    1. proxy forwards backend.window.postMessage on this connection
  // 6. background starts a 2-way pipe between proxy and devtools
  // What that means is that messages go:
  // - panel/devtools -(port)-> background -(port)-> proxy -(window)-> backend
  // - backend -(window)-> proxy -(port)-> background -(port)-> panel/devtools
  injectScript(chrome.runtime.getURL("/dist/scripts/backend.js"), () => {
    const port = chrome.runtime.connect({
      name: inspectorPortName(chrome.devtools.inspectedWindow.tabId),
    })

    let disconnected = false

    port.onDisconnect.addListener(() => {
      disconnected = true
    })

    port.onMessage.addListener(function (message) {
      // ignore further messages
      if (disconnected) return
      handleBackendToPanelMessage(message, port)
    })
  })
}

function onReload(reloadFn) {
  chrome.devtools.network.onNavigated.addListener(reloadFn)
}

/**
 * Inject a globally evaluated script, in the same context with the actual
 * user app.
 *
 * @param {String} scriptName
 * @param {Function} cb
 */

function injectScript(scriptName, cb) {
  const src = `
    (function() {
      var script = document.constructor.prototype.createElement.call(document, 'script');
      script.src = "${scriptName}";
      document.documentElement.appendChild(script);
      script.parentNode.removeChild(script);
    })()
  `
  chrome.devtools.inspectedWindow.eval(src, function (res, err) {
    if (err) {
      console.log(err)
    }
    cb()
  })
}

connect()
onReload(() => {
  connect()
})

// let connectionPort = {}

// chrome.runtime.onConnect.addListener(function (port) {
//   console.debug("panel.js: Connected ...")
//   connectionPort = port
//   connectionPort.postMessage({ type: "CONNECTED" })
//   connectionPort.onMessage.addListener(function (message) {
//     console.log("panel.js: Received message:", message)
//     switch (message.type) {
//       case "FRAME_DETAILS":
//         populateFrameDetails(message.frameDetails)
//         break
//       case "FRAME_LIST":
//         populateFrameList(message.frames)
//         break
//       case "STIMULUS_LIST":
//         populateStimulusList(message.stimulusControllers)
//         break
//     }
//   })
// })

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   switch (message.type) {
//     case "TURBO_STREAMS":
//       populateTurboStreamList(message.turboStreams)
//       break
//   }
// })

// const populateFrameList = (frames) => {
//   document.getElementById("turbo-frame-list").innerHTML = ""

//   frames.forEach((frame) => {
//     const template = document.getElementById("turbo-frame-template")
//     const clone = template.content.cloneNode(true)

//     const frameInfoElement = clone.querySelector(".turbo-frame")
//     frameInfoElement.dataset.frameId = frame.id

//     const frameIdElement = clone.querySelector(".turbo-frame-id")
//     frameIdElement.innerText = frame.id
//     frameIdElement.dataset.frameId = frame.id

//     document.getElementById("turbo-frame-list").appendChild(clone)
//   })
// }

// const populateFrameDetails = (frameDetails) => {
//   const template = document.getElementById("turbo-frame-details-template")
//   const clone = template.content.cloneNode(true)

//   const frameIdElement = clone.querySelector(".turbo-frame-id")
//   frameIdElement.innerText = frameDetails.id

//   document.getElementById("turbo-frame-details").innerHTML = ""
//   document.getElementById("turbo-frame-details").appendChild(clone)
// }

// const populateTurboStreamList = (turboStreams) => {
//   turboStreams.forEach((turboStream) => {
//     const parsedTurboStreamContent = parseHTMLString(turboStream)
//     const parsedTurboStream = parsedTurboStreamContent.querySelector("turbo-stream")
//     const action = parsedTurboStream.getAttribute("action")
//     const target = parsedTurboStream.getAttribute("target")

//     const template = document.getElementById("turbo-stream-template")
//     const clone = template.content.cloneNode(true)

//     const turboStreamActionElement = clone.querySelector(".turbo-stream-action")
//     turboStreamActionElement.innerText = action

//     const turboStreamTargetElement = clone.querySelector(".turbo-stream-target")
//     turboStreamTargetElement.innerText = target

//     document.getElementById("turbo-stream-list").appendChild(clone)
//   })
// }

// const populateStimulusList = (stimulusControllerElements) => {
//   document.getElementById("stimulus-list").innerHTML = ""

//   const groupedStimulusControllerElements = stimulusControllerElements.reduce((acc, stimulusControllerElement) => {
//     const stimulusControllerId = stimulusControllerElement.dataset.controller
//     if (!acc[stimulusControllerId]) {
//       acc[stimulusControllerId] = []
//     }
//     acc[stimulusControllerId].push(stimulusControllerElement)
//     return acc
//   })

//   Object.keys(groupedStimulusControllerElements).forEach((stimulusControllerId) => {
//     const stimulusControllerElements = groupedStimulusControllerElements[stimulusControllerId]

//     const template = document.getElementById("stimulus-template")
//     const clone = template.content.cloneNode(true)

//     const stimulusIdElement = clone.querySelector(".stimulus-id")
//     stimulusIdElement.innerText = `${stimulusControllerId} (${stimulusControllerElements.length})`

//     document.getElementById("stimulus-list").appendChild(clone)
//   })
// }

// const parseHTMLString = (htmlString) => {
//   const template = document.createElement("template")
//   template.innerHTML = htmlString
//   return template.content
// }

// // Handle tab navigation
// document.querySelector(".tablist").addEventListener("click", (event) => {
//   document.querySelectorAll(".tabcontent, .tablinks").forEach((tab) => {
//     tab.className = tab.className.replace(" active", "")
//   })

//   const clickedTab = event.target
//   const desiredTabContent = document.getElementById(event.target.dataset.tabId)
//   clickedTab.className += " active"
//   desiredTabContent.className += " active"
// })

// // Handle frame selection
// document.getElementById("turbo-frame-list").addEventListener("click", (e) => {
//   if (!e.target.dataset.frameId) return

//   const frameId = e.target.dataset.frameId
//   connectionPort.postMessage({
//     type: "FRAME_DETAILS",
//     frameId: frameId,
//   })
// })

// // Handle refresh calls
// document.querySelector(".refresh-turbo-frames").addEventListener("click", () => {
//   connectionPort.postMessage({ type: "FRAME_LIST" })
// })
// document.querySelector(".refresh-stimulus").addEventListener("click", () => {
//   connectionPort.postMessage({ type: "STIMULUS_LIST" })
// })
