export function createConnectionState() {
  let connectedToBackend = $state(false)
  let isPermanentlyDisconnected = $state(false)

  return {
    get isPermanentlyDisconnected() {
      return isPermanentlyDisconnected
    },
    set isPermanentlyDisconnected(value) {
      isPermanentlyDisconnected = value
    },

    get connectedToBackend() {
      return connectedToBackend
    },
    set connectedToBackend(value) {
      connectedToBackend = value
    },
  }
}
export const connection = createConnectionState()

let turboFrames = $state([])
let turboCables = $state([])
let turboStreams = $state([])
let turboEvents = $state([])
let stimulusData = $state([])
let registeredStimulusIdentifiers = $state([])
let turboPermanentElements = $state([])
let turboTemporaryElements = $state([])
let turboConfig = $state({})

export function setTurboFrames(frames, url) {
  turboFrames = frames
}

export function getTurboFrames() {
  return turboFrames
}

export function setTurboCables(cables, url) {
  turboCables = cables
}

export function getTurboCables() {
  return turboCables
}

export function setStimulusData(data, url) {
  stimulusData = data
}

export function getStimulusData() {
  return stimulusData
}

export function setRegisteredStimulusIdentifiers(identifiers, url) {
  registeredStimulusIdentifiers = identifiers
}

export function getRegisteredStimulusIdentifiers() {
  return registeredStimulusIdentifiers
}

export function setTurboPermanentElements(elements, url) {
  turboPermanentElements = elements
}

export function getTurboPermanentElements() {
  return turboPermanentElements
}

export function setTurboTemporaryElements(elements, url) {
  turboTemporaryElements = elements
}

export function getTurboTemporaryElements() {
  return turboTemporaryElements
}

export function setTurboConfig(config, url) {
  turboConfig = config
}

export function getTurboConfig() {
  return turboConfig
}

export function addTurboEvent(event) {
  const exists = turboEvents.some((e) => e.uuid === event.uuid)
  if (exists) return
  turboEvents = [...turboEvents, event]
}

export function getTurboEvents() {
  return turboEvents
}

export function clearTurboEvents() {
  turboEvents = []
}

export function addTurboStream(turboStream) {
  const exists = turboStreams.some((stream) => stream.uuid === turboStream.uuid)
  if (exists) return

  turboStreams = [
    ...turboStreams,
    {
      uuid: turboStream.uuid,
      time: turboStream.time,
      action: turboStream.action,
      target: turboStream.target,
      targets: turboStream.targets,
      targetSelector: turboStream.targetSelector,
      turboStreamContent: turboStream.turboStreamContent,
    },
  ]
}

export function getTurboStreams() {
  return turboStreams
}

export function clearTurboStreams() {
  turboStreams = []
}

export default {
  setTurboFrames,
  getTurboFrames,
  addTurboStream,
  getTurboStreams,
  clearTurboStreams,
}
