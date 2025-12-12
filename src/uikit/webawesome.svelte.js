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

// Set WebAwesome base path to point to the correct location of the WebAwesome icons
import { setBasePath, registerIconLibrary } from "@awesome.me/webawesome/dist/webawesome.js"
setBasePath("/dist")

// Register our custom icons
registerIconLibrary("custom", {
  resolver: (name) => {
    return `/icons/${name}.svg`
  },
  mutator: (svg) => svg.setAttribute("fill", "currentColor"),
})
