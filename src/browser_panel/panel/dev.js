// Development entry point for standalone panel testing
// Run with: npm run dev:panel

import App from "./App.svelte"
import { mount } from "svelte"
import {
  connection,
  setTurboFrames,
  setTurboCables,
  setStimulusData,
  setRegisteredStimulusIdentifiers,
  setTurboPermanentElements,
  setTurboTemporaryElements,
  setTurboConfig,
  addTurboEvent,
  addTurboStream,
} from "../State.svelte.js"

// Mock Chrome APIs for standalone development
window.chrome = {
  devtools: {
    panels: {
      themeName: "light",
    },
    inspectedWindow: {
      tabId: 1,
    },
  },
  storage: {
    sync: {
      get: async (key) => {
        const stored = localStorage.getItem(`mock_chrome_storage_${key}`)
        return stored ? JSON.parse(stored) : {}
      },
      set: (data, callback) => {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(`mock_chrome_storage_${key}`, JSON.stringify(value))
        })
        callback?.()
      },
      remove: async (key) => {
        localStorage.removeItem(`mock_chrome_storage_${key}`)
      },
    },
  },
  runtime: {
    getURL: (path) => path,
    lastError: null,
    getManifest: () => ({
      version: "0.0.0-dev",
      name: "Hotwire Dev Tools (Development)",
    }),
  },
}

// Set connection as active
connection.connectedToBackend = true
connection.isPermanentlyDisconnected = false

// Load mock data
loadMockData()

// Mount Svelte app
document.body.classList.toggle("dark", false)
export default mount(App, { target: document.querySelector("#app") })

function loadMockData() {
  // Mock Turbo Frames
  setTurboFrames([
    {
      uuid: "frame-1",
      id: "user-profile",
      tagName: "turbo-frame",
      hasUniqueId: true,
      attributes: {
        id: "user-profile",
        src: "/users/123",
        loading: "lazy",
        target: "_top",
      },
      referenceElements: [
        {
          uuid: "ref-1",
          tagName: "a",
          attributes: { href: "/users/123", "data-turbo-frame": "user-profile" },
        },
      ],
      children: [
        {
          uuid: "frame-1-1",
          id: "user-avatar",
          tagName: "turbo-frame",
          hasUniqueId: true,
          attributes: {
            id: "user-avatar",
            src: "/users/123/avatar",
            loading: "lazy",
          },
          referenceElements: [],
          children: [],
        },
      ],
    },
    {
      uuid: "frame-2",
      id: "notifications",
      tagName: "turbo-frame",
      hasUniqueId: true,
      attributes: {
        id: "notifications",
        src: "/notifications",
        loading: "eager",
        autoscroll: "",
        busy: "",
      },
      referenceElements: [],
      children: [],
    },
    {
      uuid: "frame-3",
      id: "sidebar-content",
      tagName: "turbo-frame",
      hasUniqueId: false,
      attributes: {
        id: "sidebar-content",
        disabled: "",
      },
      referenceElements: [
        {
          uuid: "ref-2",
          tagName: "form",
          attributes: { action: "/sidebar", "data-turbo-frame": "sidebar-content" },
        },
        {
          uuid: "ref-3",
          tagName: "a",
          attributes: { href: "/sidebar/load", "data-turbo-frame": "sidebar-content" },
        },
      ],
      children: [],
    },
  ])

  // Mock Turbo Cable Streams
  setTurboCables([
    {
      channel: "Turbo::StreamsChannel",
      signedStreamName: "user_123_notifications",
      connected: true,
    },
    {
      channel: "Turbo::StreamsChannel",
      signedStreamName: "chat_room_456",
      connected: false,
    },
  ])

  // Mock Stimulus Data
  setStimulusData([
    {
      uuid: "stimulus-1",
      id: "main-dropdown",
      identifier: "dropdown",
      tagName: "div",
      attributes: { id: "main-dropdown", class: "dropdown is-active", "data-controller": "dropdown" },
      values: [
        { key: "open", name: "openValue", type: "Boolean", defaultValue: false, value: true },
        { key: "placement", name: "placementValue", type: "String", defaultValue: "bottom", value: "bottom-start" },
        { key: "offset", name: "offsetValue", type: "Number", defaultValue: 0, value: 8 },
      ],
      targets: [
        {
          name: "menuTarget",
          key: "menu",
          elements: [{ id: "dropdown-menu", uuid: "target-1", tagName: "ul", attributes: { id: "dropdown-menu", class: "dropdown-menu" } }],
        },
        {
          name: "triggerTarget",
          key: "trigger",
          elements: [{ id: "dropdown-trigger", uuid: "target-2", tagName: "button", attributes: { id: "dropdown-trigger", class: "btn btn-primary" } }],
        },
      ],
      outlets: [
        {
          name: "tooltipOutlet",
          key: "tooltip",
          selector: "#tooltip-1",
          elements: [{ id: "tooltip-1", uuid: "outlet-1", tagName: "div", attributes: { id: "tooltip-1", "data-controller": "tooltip" } }],
        },
      ],
      classes: [
        { name: "activeClass", key: "active", classes: ["is-active", "dropdown--open"] },
        { name: "hiddenClass", key: "hidden", classes: ["hidden", "invisible"] },
      ],
      actions: [
        {
          descriptor: "click->dropdown#toggle",
          eventName: "click",
          methodName: "toggle",
          element: { id: "dropdown-trigger", uuid: "action-el-1", tagName: "button", attributes: { id: "dropdown-trigger" }, classes: ["btn", "btn-primary"] },
          keyFilter: null,
          eventTarget: "element",
          params: {},
          hasParams: false,
        },
        {
          descriptor: "keydown.escape->dropdown#close",
          eventName: "keydown",
          methodName: "close",
          element: { id: "main-dropdown", uuid: "action-el-2", tagName: "div", attributes: { id: "main-dropdown" }, classes: ["dropdown", "is-active"] },
          keyFilter: "escape",
          eventTarget: "element",
          params: {},
          hasParams: false,
        },
        {
          descriptor: "click@window->dropdown#closeOnClickOutside",
          eventName: "click",
          methodName: "closeOnClickOutside",
          element: { id: "main-dropdown", uuid: "action-el-3", tagName: "div", attributes: { id: "main-dropdown" }, classes: ["dropdown", "is-active"] },
          keyFilter: null,
          eventTarget: "window",
          params: {},
          hasParams: false,
        },
      ],
    },
    {
      uuid: "stimulus-2",
      id: "secondary-dropdown",
      identifier: "dropdown",
      tagName: "div",
      attributes: { id: "secondary-dropdown", class: "dropdown", "data-controller": "dropdown" },
      values: [
        { key: "open", name: "openValue", type: "Boolean", defaultValue: false, value: false },
        { key: "placement", name: "placementValue", type: "String", defaultValue: "bottom", value: "bottom-end" },
      ],
      targets: [
        {
          name: "menuTarget",
          key: "menu",
          elements: [{ id: "dropdown-menu-2", uuid: "target-3", tagName: "ul", attributes: { id: "dropdown-menu-2", class: "dropdown-menu" } }],
        },
      ],
      outlets: [],
      classes: [],
      actions: [
        {
          descriptor: "click->dropdown#toggle",
          eventName: "click",
          methodName: "toggle",
          element: { id: "dropdown-trigger-2", uuid: "action-el-4", tagName: "button", attributes: { id: "dropdown-trigger-2" }, classes: ["btn"] },
          keyFilter: null,
          eventTarget: "element",
          params: {},
          hasParams: false,
        },
      ],
    },
    {
      uuid: "stimulus-3",
      id: null,
      identifier: "modal",
      tagName: "dialog",
      attributes: { class: "modal modal-lg", "data-controller": "modal" },
      values: [
        { key: "backdrop", name: "backdropValue", type: "String", defaultValue: "true", value: "static" },
        { key: "keyboard", name: "keyboardValue", type: "Boolean", defaultValue: true, value: false },
      ],
      targets: [
        {
          name: "contentTarget",
          key: "content",
          elements: [{ id: null, uuid: "target-4", tagName: "div", attributes: { class: "modal-content" } }],
        },
        {
          name: "closeButtonTarget",
          key: "closeButton",
          elements: [
            { id: null, uuid: "target-5", tagName: "button", attributes: { class: "btn-close" } },
            { id: null, uuid: "target-6", tagName: "button", attributes: { class: "modal-close is-large" } },
          ],
        },
      ],
      outlets: [],
      classes: [{ name: "showClass", key: "show", classes: ["show", "is-visible"] }],
      actions: [
        {
          descriptor: "click->modal#open",
          eventName: "click",
          methodName: "open",
          element: { id: null, uuid: "action-el-5", tagName: "button", attributes: { class: "open-modal" }, classes: ["open-modal"] },
          keyFilter: null,
          eventTarget: "element",
          params: {},
          hasParams: false,
        },
        {
          descriptor: "click->modal#close",
          eventName: "click",
          methodName: "close",
          element: { id: null, uuid: "action-el-6", tagName: "button", attributes: { class: "btn-close" }, classes: ["btn-close"] },
          keyFilter: null,
          eventTarget: "element",
          params: {},
          hasParams: false,
        },
      ],
    },
    {
      uuid: "stimulus-4",
      id: "copy-btn",
      identifier: "clipboard",
      tagName: "button",
      attributes: { id: "copy-btn", class: "btn btn-sm", "data-controller": "clipboard" },
      values: [
        { key: "content", name: "contentValue", type: "String", defaultValue: "", value: "Hello, World!" },
        { key: "successDuration", name: "successDurationValue", type: "Number", defaultValue: 1500, value: 2000 },
      ],
      targets: [],
      outlets: [],
      classes: [{ name: "copiedClass", key: "copied", classes: ["text-success", "copied"] }],
      actions: [
        {
          descriptor: "click->clipboard#copy",
          eventName: "click",
          methodName: "copy",
          element: { id: "copy-btn", uuid: "action-el-7", tagName: "button", attributes: { id: "copy-btn" }, classes: ["btn", "btn-sm"] },
          keyFilter: null,
          eventTarget: "element",
          params: { format: "text/plain" },
          hasParams: true,
        },
      ],
    },
  ])

  // Mock registered Stimulus identifiers
  setRegisteredStimulusIdentifiers(["dropdown", "modal", "clipboard", "tabs", "tooltip", "popover", "carousel", "accordion"])

  // Mock Turbo Permanent Elements
  setTurboPermanentElements([
    { uuid: "perm-1", tagName: "div", attributes: { id: "flash-messages", "data-turbo-permanent": "" } },
    { uuid: "perm-2", tagName: "audio", attributes: { id: "audio-player", "data-turbo-permanent": "" } },
  ])

  // Mock Turbo Temporary Elements (elements with data-turbo-temporary)
  setTurboTemporaryElements([{ uuid: "temp-1", tagName: "div", attributes: { id: "loading-spinner", class: "spinner", "data-turbo-temporary": "" } }])

  // Mock Turbo Config
  setTurboConfig({
    drive: true,
    progressBar: true,
    progressBarDelay: 500,
  })

  // Mock Turbo Events
  const now = Date.now()
  addTurboEvent({
    uuid: "event-1",
    eventName: "turbo:load",
    time: new Date(now - 5000).toISOString(),
    url: "http://localhost:3000/dashboard",
    details: {},
  })
  addTurboEvent({
    uuid: "event-2",
    eventName: "turbo:frame-load",
    time: new Date(now - 3000).toISOString(),
    url: "http://localhost:3000/users/123",
    frameId: "user-profile",
    details: { timing: { fetchStart: 10, responseEnd: 150 } },
  })
  addTurboEvent({
    uuid: "event-3",
    eventName: "turbo:before-fetch-request",
    time: new Date(now - 1000).toISOString(),
    url: "http://localhost:3000/notifications",
    details: { fetchOptions: { method: "GET" } },
  })

  // Mock Turbo Streams
  addTurboStream({
    uuid: "stream-1",
    time: new Date(now - 2000).toISOString(),
    action: "append",
    target: "notifications",
    targets: null,
    targetSelector: "#notifications",
    turboStreamContent: '<div class="notification">New message received!</div>',
  })
  addTurboStream({
    uuid: "stream-2",
    time: new Date(now - 500).toISOString(),
    action: "replace",
    target: "user-count",
    targets: null,
    targetSelector: "#user-count",
    turboStreamContent: '<span id="user-count">42 users online</span>',
  })
  addTurboStream({
    uuid: "stream-3",
    time: new Date().toISOString(),
    action: "remove",
    target: "old-notification",
    targets: null,
    targetSelector: "#old-notification",
    turboStreamContent: "",
  })
}
