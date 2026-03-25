# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-browser DevTools extension (Chrome, Firefox, Safari) for debugging **Hotwire** applications (Turbo + Stimulus). Built with Svelte 5 and esbuild.

## Commands

```bash
npm run dev              # Watch mode (Chrome, default)
npm run build            # Production build (Chrome)
npm run build firefox    # Production build for Firefox
npm run build safari     # Production build for Safari
npm run dev:panel        # Watch mode + serve public/ on :3333 (for UI dev without reloading extension)
npm run lint             # Check formatting with Prettier
npm run format           # Auto-fix formatting with Prettier
```

No test suite — manual testing by loading `public/` as an unpacked extension.

## Architecture

The extension has four components that communicate via a message-passing pipeline:

```
Page Context (backend.js) ←→ proxy.js (content script) ←→ background.js ←→ panel/panel.js (DevTools UI)
```

1. **`src/browser_panel/page/backend.js`** — Injected into the inspected page. Hooks Turbo/Stimulus APIs and observes DOM. Sends messages via `window.postMessage`.
2. **`src/browser_panel/proxy.js`** — Content script bridge. Translates `window.postMessage` ↔ Chrome extension ports.
3. **`src/background.js`** — Central router. Injects proxy into the target tab when the panel opens, pipes messages bidirectionally, manages tab lifecycle.
4. **`src/browser_panel/panel/`** — Svelte 5 DevTools UI (three tabs: Turbo, Stimulus, Logs).

### State Management

`src/browser_panel/State.svelte.js` holds all reactive global state using Svelte 5 runes (`$state`). Incoming backend messages (handled in `messaging.js`) update this state, which automatically re-renders components.

### Backend Observers

Each feature has a dedicated observer class in `src/browser_panel/page/`:
- `turbo_frame_observer.js` — tracks `<turbo-frame>` elements
- `stimulus_observer.js` — tracks Stimulus controllers
- `turbo_cable_observer.js` — tracks ActionCable subscriptions
- `turbo_attribute_elements_observer.js` — monitors `data-turbo-*` attributes

All implement `matchElement()`, `elementMatched()`, `elementUnmatched()`.

### Message Types

All message type constants live in `src/lib/constants.js`. Two directions:
- `BACKEND_TO_PANEL_MESSAGES`: `SET_TURBO_FRAMES`, `SET_STIMULUS_DATA`, `TURBO_EVENT_RECEIVED`, etc.
- `PANEL_TO_BACKEND_MESSAGES`: `HIGHLIGHT_ELEMENT`, `REFRESH_TURBO_FRAME`, `UPDATE_DATA_ATTRIBUTE`, etc.

### Build System

`build.js` uses esbuild with `esbuild-svelte`. The browser target is set via CLI arg (`node build.js firefox`). Browser-specific code uses compile-time defines: `__IS_CHROME__`, `__IS_FIREFOX__`, `__IS_SAFARI__`. `manifest.json` is generated from `manifest.template.json` via Mustache templating.

### Path Aliases

```
$src/        → src/
$uikit/      → src/uikit/
$components/ → src/components/
$utils/      → src/utils/
$lib/        → src/lib/
```

### Svelte 5 Runes

This project uses Svelte 5 rune syntax exclusively — no legacy Svelte 4 patterns:
- `$state()` for reactive variables
- `$props()` for component props
- `$derived()` for computed values
- `$effect()` for side effects

### UI Libraries

- **Web Awesome** (`@awesome.me/webawesome`) — primary UI component library (e.g. `<wa-button>`)
- **svelte-splitpanes** — resizable panels
- **highlight.js** — syntax highlighting in logs

### Legacy Code

`src/popup.js` and `src/content.js` are legacy popup-based features being phased out. All new development goes in `src/browser_panel/`.
