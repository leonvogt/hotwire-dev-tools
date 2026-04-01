import { writable } from "svelte/store"
import { MediaQuery } from "svelte/reactivity"
import { debounce } from "$utils/utils"

const breakpoints = {
  md: 640,
  lg: 960,
}
const large = new MediaQuery(`(min-width: ${breakpoints.lg}px)`)
const medium = new MediaQuery(`(min-width: ${breakpoints.md}px)`)

const detectOrientation = () => {
  return medium.current ? "landscape" : "portrait"
}

const detectHorizontalPanes = () => {
  return detectOrientation() === "portrait"
}

const detectBreakpoint = () => {
  if (large.current) return "lg"
  if (medium.current) return "md"
  return "sm"
}

export const orientation = writable(detectOrientation())
export const breakpoint = writable(detectBreakpoint())
export const horizontalPanes = writable(detectHorizontalPanes())

export const handleResize = debounce(() => {
  orientation.set(detectOrientation())
  breakpoint.set(detectBreakpoint())
  horizontalPanes.set(detectHorizontalPanes())
}, 100)
