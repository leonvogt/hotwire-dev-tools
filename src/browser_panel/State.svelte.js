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
