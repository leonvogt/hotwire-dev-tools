import { writable } from "svelte/store"
import { debounce } from "../utils/utils"

const breakpoints = {
  md: 640,
  lg: 960,
}

let width = typeof window !== "undefined" ? window.innerWidth : 1024

function updateWidth() {
  const newWidth = window.innerWidth
  width = newWidth === 0 ? width : newWidth
  return width
}

function isLargerThan(minWidth) {
  if (typeof window === "undefined") return false
  return updateWidth() > minWidth
}

function detectOrientation() {
  return isLargerThan(breakpoints.lg) ? "landscape" : "portrait"
}

function detectBreakpoint() {
  if (isLargerThan(breakpoints.lg)) return "lg"
  if (isLargerThan(breakpoints.md)) return "md"
  return "sm"
}

function detectHorizontalPanes() {
  return detectOrientation() === "portrait"
}

export const orientation = writable(detectOrientation())
export const breakpoint = writable(detectBreakpoint())
export const horizontalPanes = writable(detectHorizontalPanes())

export const handleResize = debounce(() => {
  orientation.set(detectOrientation())
  breakpoint.set(detectBreakpoint())
  horizontalPanes.set(detectHorizontalPanes())
}, 100)
