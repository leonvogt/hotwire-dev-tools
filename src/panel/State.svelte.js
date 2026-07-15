import { getSilencedWarnings as fetchSilencedWarnings, silenceWarning as storageSilenceWarning, unsilenceWarning as storageUnsilenceWarning } from "$lib/silenced_warnings_storage"

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
let stimulusApiAvailable = $state(true)
let registeredStimulusIdentifiers = $state([])
let turboPermanentElements = $state([])
let turboTemporaryElements = $state([])
let turboConfig = $state({})
let warnings = $state([])
let warningsOrigin = $state(null)
let silencedWarningIds = $state([])

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

export function setStimulusData(data, url, apiAvailable) {
  stimulusData = data
  stimulusApiAvailable = apiAvailable
}

export function getStimulusData() {
  return stimulusData
}

export function isStimulusApiAvailable() {
  return stimulusApiAvailable
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

function originFromUrl(url) {
  if (!url) return null
  try {
    return new URL(atob(url)).origin
  } catch {
    return null
  }
}

async function loadSilencedWarnings(origin) {
  const silenced = await fetchSilencedWarnings(origin)
  // Guard against out-of-order resolution: only apply if the origin is still current.
  if (origin === warningsOrigin) {
    silencedWarningIds = silenced
  }
}

export function setWarnings(newWarnings, url) {
  warnings = newWarnings || []

  const origin = originFromUrl(url)
  if (origin && origin !== warningsOrigin) {
    warningsOrigin = origin
    loadSilencedWarnings(origin)
  }
}

export function getActiveWarnings() {
  return warnings.filter((warning) => !silencedWarningIds.includes(warning.id))
}

export function getSilencedWarnings() {
  return warnings.filter((warning) => silencedWarningIds.includes(warning.id))
}

export function getActiveWarningCount() {
  return getActiveWarnings().length
}

export async function silenceWarning(warningId) {
  if (!silencedWarningIds.includes(warningId)) {
    silencedWarningIds = [...silencedWarningIds, warningId]
  }
  if (warningsOrigin) await storageSilenceWarning(warningId, warningsOrigin)
}

export async function unsilenceWarning(warningId) {
  silencedWarningIds = silencedWarningIds.filter((id) => id !== warningId)
  if (warningsOrigin) await storageUnsilenceWarning(warningId, warningsOrigin)
}

// Keep the panel's silenced set in sync if warnings are muted elsewhere (e.g. the popup or another DevTools window).
if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.silencedWarnings && warningsOrigin) {
      loadSilencedWarnings(warningsOrigin)
    }
  })
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
      targetNotFound: turboStream.targetNotFound,
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
