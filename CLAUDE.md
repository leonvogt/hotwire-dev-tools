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

The codebase is organized by execution context into two main directories:

- **`src/page/`** — Everything running in the page context (content scripts, injected scripts, observers)
- **`src/panel/`** — DevTools panel UI (Svelte 5 components, state, messaging)

The DevTools panel communicates via a message-passing pipeline:

```
Page Context (backend.js) ←→ proxy.js (content script) ←→ background.js ←→ panel/panel.js (DevTools UI)
```

1. **`src/page/backend.js`** — Injected into the inspected page. Hooks Turbo/Stimulus APIs and observes DOM. Sends messages via `window.postMessage`.
2. **`src/page/proxy.js`** — Content script bridge. Translates `window.postMessage` ↔ Chrome extension ports.
3. **`src/background.js`** — Central router. Injects proxy into the target tab when the panel opens, pipes messages bidirectionally, manages tab lifecycle.
4. **`src/panel/`** — Svelte 5 DevTools UI (three tabs: Turbo, Stimulus, Logs).

Additionally, the extension has page-level features that work without opening DevTools:

5. **`src/page/content.js`** — Content script loaded on all pages. Handles on-page Turbo Frame/Stimulus highlighting, console logging of Turbo Streams, and diagnostics warnings.
6. **`src/popup.js`** — Extension popup UI for configuring highlighting, console logging, and event monitoring options.
7. **`src/page/inject_script.js`** — Injected into the page's real window context to access `window.Stimulus` and `window.Turbo`.
8. **`src/page/detail_panel.js`** — In-page detail panel widget (shadow DOM) showing Stimulus/Turbo Frame/Turbo Stream info.

### State Management

`src/panel/State.svelte.js` holds all reactive global state using Svelte 5 runes (`$state`). Incoming backend messages (handled in `messaging.js`) update this state, which automatically re-renders components.

### Backend Observers

Each feature has a dedicated observer class in `src/page/observers/`:

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
$components/ → src/panel/components/
$utils/      → src/utils/
$lib/        → src/lib/
$panel/      → src/panel/
$page/       → src/page/
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

### Page-Level Features

`src/popup.js` and `src/page/content.js` provide features that work without opening DevTools: on-page frame/controller highlighting, console event logging, and diagnostics warnings. These are configured via the extension popup. New debugging features should go in `src/panel/`.
