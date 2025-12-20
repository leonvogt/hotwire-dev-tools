# Hotwire Dev Tools - Copilot Instructions

## Project Overview

Browser extension (Chrome/Firefox/Safari) for debugging Hotwire (Turbo + Stimulus) applications. Built with **Svelte 5** using runes (`$state`, `$props`, `$derived`) and **esbuild**.

## Architecture - Four-Part Communication Flow

```
Panel (UI) ←→ Background ←→ Proxy ←→ Backend (page context)
```

- **Panel** ([src/browser_panel/panel/](src/browser_panel/panel/)): Svelte UI in DevTools, communicates via Chrome ports
- **Background** ([src/background.js](src/background.js)): Routes messages between panel and proxy, handles tab lifecycle
- **Proxy** ([src/browser_panel/proxy.js](src/browser_panel/proxy.js)): Content script bridging extension world ↔ page world via `window.postMessage`
- **Backend** ([src/browser_panel/page/backend.js](src/browser_panel/page/backend.js)): Injected into page context, hooks into Hotwire APIs

Messages flow: `Panel → Background → Proxy → Backend` and back. See [ARCHITECTURE.md](ARCHITECTURE.md) for diagrams.

## Key Development Commands

```bash
npm run dev          # Build + watch mode (Chrome by default)
npm run build        # Production build for Chrome
npm run build firefox  # Build for Firefox
npm run build safari   # Build for Safari
npm run format       # Run Prettier
```

Load extension from `public/` folder after building.

## Code Conventions

### Import Aliases (configured in [build.js](build.js))

```javascript
import { ... } from "$src/..."        // src/
import { ... } from "$uikit/..."      // src/uikit/
import { ... } from "$components/..." // src/components/
import { ... } from "$utils/..."      // src/utils/
import { ... } from "$lib/..."        // src/lib/
```

### Svelte 5 Runes Pattern

State uses Svelte 5 runes syntax. See [State.svelte.js](src/browser_panel/State.svelte.js):

```javascript
let turboFrames = $state([]) // Reactive state
export function getTurboFrames() {
  return turboFrames
}
export function setTurboFrames(frames) {
  turboFrames = frames
}
```

Components use `$props()` and `$state()`:

```svelte
let { value, onSave } = $props()
let editValue = $state(value)
```

### Message Constants

All message types are defined in [src/lib/constants.js](src/lib/constants.js):

- `BACKEND_TO_PANEL_MESSAGES`: Backend → Panel data updates
- `PANEL_TO_BACKEND_MESSAGES`: Panel → Backend commands
- `PORT_IDENTIFIERS`: Port naming for Chrome runtime

### Observer Pattern for DOM Monitoring

Backend uses observers ([src/browser_panel/page/](src/browser_panel/page/)) to watch DOM changes:

- `TurboFrameObserver`, `StimulusObserver`, `TurboCableObserver`, etc.
- Observers implement `matchElement()`, `elementMatched()`, `elementUnmatched()`

## Browser-Specific Build

Build system uses Mustache templating for [manifest.template.json](manifest.template.json):

- `__IS_CHROME__`, `__IS_FIREFOX__`, `__IS_SAFARI__` flags available at build time
- Safari uses background scripts; Chrome uses service workers

## UI Components

- Uses **Web Awesome** (`@awesome.me/webawesome`) for UI components (`<wa-icon>`, `<wa-button>`, etc.)
- Custom components in [src/uikit/](src/uikit/) and [src/components/](src/components/)

## Legacy vs DevTools Panel

Two coexisting systems (consolidation in progress):

1. **Popup/Content Script** ([src/popup.js](src/popup.js), [src/content.js](src/content.js)): Legacy feature toggles
2. **DevTools Panel**: New primary interface - focus development here
