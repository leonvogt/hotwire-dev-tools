window.__ALPINE_DEVTOOLS_AGENT__ = {
  components: new Map(),
  listeners: new Set(),

  // Initialize the agent
  init() {
    console.log("Alpine DevTools Agent initialized")

    this.setupMutationObserver()
    this.scanForComponents()

    // Listen for messages from DevTools panel
    window.addEventListener("message", (event) => {
      if (event.data && event.data.source === "alpine-devtools-panel") {
        this.handleCommand(event.data.payload)
      }
    })

    // Announce presence to DevTools
    this.notifyDevTools({ type: "AGENT_READY", alpine: !!window.Alpine })
  },

  // Watch for DOM changes to detect new Alpine components
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let componentChanged = false

      for (let mutation of mutations) {
        if (mutation.target.hasAttribute && (mutation.target.hasAttribute("x-data") || mutation.target.querySelector("[x-data]"))) {
          componentChanged = true
          break
        }
      }

      if (componentChanged) {
        this.scanForComponents()
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
    })
  },

  // Discover Alpine components
  scanForComponents() {
    // Clear previous components
    this.components.clear()

    // Find and register all Alpine components
    document.querySelectorAll("[x-data]").forEach((el) => {
      const componentId = this.generateId(el)
      const componentData = window.Alpine.$data(el)
      const name = el.getAttribute("x-data") || el.id || "Anonymous Component"

      this.components.set(componentId, {
        id: componentId,
        name: name,
        el,
        data: componentData,
        // Extract more metadata like directives, etc.
        directives: this.extractDirectives(el),
      })
    })

    this.notifyDevTools({
      type: "COMPONENTS_UPDATED",
      components: Array.from(this.components.values(), (comp) => ({
        id: comp.id,
        name: comp.name,
        data: this.serializeData(comp.data),
        directives: comp.directives,
      })),
    })
  },

  // Generate unique ID for components
  generateId(el) {
    if (!el.__alpine_devtools_id) {
      el.__alpine_devtools_id = `alpine-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    }
    return el.__alpine_devtools_id
  },

  // Extract x-directives from an element
  extractDirectives(el) {
    const directives = []
    for (const attr of el.attributes) {
      if (attr.name.startsWith("x-") && attr.name !== "x-data") {
        directives.push({
          name: attr.name,
          value: attr.value,
        })
      }
    }
    return directives
  },

  // Make data serializable for messaging
  serializeData(data) {
    try {
      return JSON.parse(JSON.stringify(data))
    } catch (e) {
      return {
        __error: "Data contains circular references or non-serializable values",
      }
    }
  },

  // Bridge to DevTools
  notifyDevTools(message) {
    window.postMessage(
      {
        source: "alpine-devtools-agent",
        payload: message,
      },
      "*",
    )
  },

  // Handle incoming commands from DevTools
  handleCommand(cmd) {
    switch (cmd.type) {
      case "GET_COMPONENTS":
        this.scanForComponents()
        break

      case "INSPECT_COMPONENT":
        const component = this.components.get(cmd.id)
        if (component) {
          // Highlight the component in the page
          const prevOutline = component.el.style.outline
          component.el.style.outline = "2px solid #4285F4"
          setTimeout(() => {
            component.el.style.outline = prevOutline
          }, 1500)
        }
        break

      case "EDIT_COMPONENT":
        const targetComp = this.components.get(cmd.id)
        if (targetComp) {
          // Update nested property using path
          const pathParts = cmd.path.split(".")
          let current = targetComp.data

          // Navigate to the parent object
          for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]]
            if (current === undefined) return
          }

          // Update the value
          current[pathParts[pathParts.length - 1]] = cmd.value

          // Notify about the update
          this.notifyDevTools({
            type: "COMPONENT_UPDATED",
            id: cmd.id,
            data: this.serializeData(targetComp.data),
          })
        }
        break
    }
  },
}

// Initialize the agent
window.__ALPINE_DEVTOOLS_AGENT__.init()
