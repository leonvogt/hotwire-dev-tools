// UUIDs for the elements reported to the panel. Only kept in memory, never written to the DOM.

// Keeps UUIDs unique across page reloads
const prefix = Date.now().toString(36)
let counter = 0

const uuidsByElement = new WeakMap()
const elementsByUUID = new Map() // UUID -> WeakRef<Element>
const cleanup = new FinalizationRegistry((uuid) => elementsByUUID.delete(uuid))

export const getElementUUID = (element) => {
  let uuid = uuidsByElement.get(element)
  if (!uuid) {
    uuid = `${prefix}-${(++counter).toString(36)}`
    uuidsByElement.set(element, uuid)
    elementsByUUID.set(uuid, new WeakRef(element))
    cleanup.register(element, uuid)
  }
  return uuid
}

export const getElementByUUID = (uuid) => {
  const element = elementsByUUID.get(uuid)?.deref()
  return element?.isConnected ? element : null
}
