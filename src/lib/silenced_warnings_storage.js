import { SILENCED_WARNINGS_STORAGE_KEY } from "$lib/constants"

async function allSilencedWarnings() {
  const stored = await chrome.storage.sync.get(SILENCED_WARNINGS_STORAGE_KEY)
  return stored[SILENCED_WARNINGS_STORAGE_KEY] || {}
}

function persistSilencedWarnings(all) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [SILENCED_WARNINGS_STORAGE_KEY]: all }, () => {
      const error = chrome.runtime.lastError
      if (error) {
        console.error("Hotwire Dev Tools: Error while saving silenced warnings:", error)
      }
      resolve()
    })
  })
}

export async function getSilencedWarnings(origin) {
  if (!origin) return []
  const all = await allSilencedWarnings()
  return all[origin] || []
}

export async function silenceWarning(warningId, origin) {
  if (!origin) return
  const all = await allSilencedWarnings()
  const silencedForOrigin = new Set(all[origin] || [])
  silencedForOrigin.add(warningId)
  all[origin] = Array.from(silencedForOrigin)
  await persistSilencedWarnings(all)
}

export async function unsilenceWarning(warningId, origin) {
  if (!origin) return
  const all = await allSilencedWarnings()
  const silencedForOrigin = (all[origin] || []).filter((id) => id !== warningId)
  if (silencedForOrigin.length > 0) {
    all[origin] = silencedForOrigin
  } else {
    delete all[origin]
  }
  await persistSilencedWarnings(all)
}
