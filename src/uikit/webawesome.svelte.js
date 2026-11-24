import "@awesome.me/webawesome/dist/styles/webawesome.css"
import "@awesome.me/webawesome/dist/styles/themes/default.css"
import "@awesome.me/webawesome/dist/styles/color/palettes/shoelace.css"

import "@awesome.me/webawesome/dist/components/button/button.js"
import "@awesome.me/webawesome/dist/components/select/select.js"
import "@awesome.me/webawesome/dist/components/callout/callout.js"
import "@awesome.me/webawesome/dist/components/dropdown/dropdown.js"
import "@awesome.me/webawesome/dist/components/skeleton/skeleton.js"
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js"
import "@awesome.me/webawesome/dist/components/spinner/spinner.js"
import "@awesome.me/webawesome/dist/components/badge/badge.js"
import "@awesome.me/webawesome/dist/components/tree/tree.js"
import "@awesome.me/webawesome/dist/components/input/input.js"
import "@awesome.me/webawesome/dist/components/switch/switch.js"
import "@awesome.me/webawesome/dist/components/tab-group/tab-group.js"

import { registerIconLibrary } from "@awesome.me/webawesome/dist/webawesome.js"
import { icons } from "$utils/icons.js"

// Replaces Web Awesome's default library, which would fetch icons from the Font Awesome CDN
registerIconLibrary("default", {
  resolver: (name) => {
    if (!icons[name]) {
      console.warn(`Hotwire Dev Tools: Icon "${name}" is missing in src/utils/icons.js`)
      return ""
    }
    return `data:image/svg+xml,${encodeURIComponent(icons[name])}`
  },
  mutator: (svg) => svg.setAttribute("fill", "currentColor"),
})
