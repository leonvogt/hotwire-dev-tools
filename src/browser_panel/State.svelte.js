let turboFrames = $state([])

export function setTurboFrames(frames) {
  turboFrames = Array.from(frames).map((frame) => {
    return {
      id: frame.id,
      src: frame.src,
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

export default {
  setTurboFrames,
  getTurboFrames,
}
