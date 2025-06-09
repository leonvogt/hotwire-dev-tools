let turboFrames = $state([])
let turboStreams = $state([])

export function setTurboFrames(frames) {
  turboFrames = Array.from(frames).map((frame) => {
    return {
      id: frame.id,
      src: frame.src,
      uuid: frame.uuid,
      html: frame.html,
      loading: frame.loading,
      innerHTML: frame.innerHTML,
      attributes: frame.attributes || {},
    }
  })
}

export function getTurboFrames() {
  return turboFrames
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

export default {
  setTurboFrames,
  getTurboFrames,
  addTurboStream,
  getTurboStreams,
}
