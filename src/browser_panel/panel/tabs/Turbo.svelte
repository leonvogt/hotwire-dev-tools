<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"

  import { getTurboFrames } from "../../State.svelte.js"
  import { inspectElement } from "../../../utils/utils.js"
  import { panelPostMessage } from "../../messaging.js"
  import { PANEL_TO_BACKEND_MESSAGES } from "../../../lib/constants.js"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE } from "../../ports.js"
  import { orientation, breakpoint, horizontalPanes } from "../../theme.svelte.js"
  import * as Icons from "../../../utils/icons.js"

  let turboFrames = $state([])
  let selectedFrameId = $state(null)

  $effect(() => {
    turboFrames = getTurboFrames()

    // Set initial selection if none exists and frames are available
    if (!selectedFrameId && turboFrames.length > 0) {
      selectedFrameId = turboFrames[0].id
    }
  })

  const currentFrame = $derived(turboFrames.find((frame) => frame.id === selectedFrameId) || turboFrames[0] || null)

  const addHighlightOverlay = (selector) => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.HOVER_COMPONENT,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
      selector: selector,
    })
  }

  const hideHighlightOverlay = () => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.HIDE_HOVER,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    })
  }

  const refreshTurboFrames = () => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.GET_TURBO_FRAMES,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    })
  }

  const refreshTurboFrame = (turboFrameId) => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.REFRESH_TURBO_FRAME,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
      id: turboFrameId,
    })
  }

  const handleKeyDown = (event) => {
    if (!turboFrames.length) return

    const currentIndex = turboFrames.findIndex((frame) => frame.id === selectedFrameId)
    let newIndex = currentIndex

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        newIndex = currentIndex < turboFrames.length - 1 ? currentIndex + 1 : 0
        break
      case "ArrowUp":
        event.preventDefault()
        newIndex = currentIndex > 0 ? currentIndex - 1 : turboFrames.length - 1
        break
      case "Home":
        event.preventDefault()
        newIndex = 0
        break
      case "End":
        event.preventDefault()
        newIndex = turboFrames.length - 1
        break
      default:
        return
    }

    selectedFrameId = turboFrames[newIndex].id

    setTimeout(() => {
      const selectedRow = document.querySelector(".turbo-frames-list-panel tr.selected")
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 10)
  }

  const ignoredAttributes = ["id", "loading", "src", "complete", "aria-busy", "busy"]
</script>

<Splitpanes class="turbo-frames-list-panel" horizontal={$horizontalPanes}>
  <Pane size={35}>
    <div class="d-flex justify-content-center">
      <h2>Streams</h2>
    </div>
    <div class="no-entry-hint">
      <span>No Turbo Streams seen yet</span>
      <span>We'll keep looking</span>
    </div>
  </Pane>
  <Pane size={35}>
    <div class="d-flex justify-content-center align-items-center position-relative">
      <h2>Frames</h2>
      <button class="position-absolute end-0" onclick={refreshTurboFrames} title="Refresh Turbo Frames List">
        {@html Icons.refresh}
      </button>
    </div>

    {#if turboFrames.length > 0}
      <div class="scrollable-list">
        {#each turboFrames as frame}
          {@const selector = `#${frame.id}`}
          <div
            class="p-1 d-flex justify-content-between align-items-center cursor-pointer entry-row"
            class:selected={currentFrame?.id === frame.id}
            role="button"
            tabindex="0"
            onclick={() => (selectedFrameId = frame.id)}
            onkeyup={() => (selectedFrameId = frame.id)}
            onmouseenter={() => addHighlightOverlay(selector)}
            onmouseleave={() => hideHighlightOverlay()}
          >
            <div>{selector}</div>
            <button class="btn-icon" onclick={() => inspectElement(selector)}>
              {@html Icons.inspectElement}
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-entry-hint">
        <span>No Turbo Frames found on this page</span>
        <span>We'll keep looking</span>
      </div>
    {/if}
  </Pane>

  <Pane size={30} class="turbo-frames-detail-panel">
    {#if currentFrame}
      <div class="d-flex justify-content-center align-items-center position-relative">
        <h2>#{currentFrame.id}</h2>
        {#if currentFrame.src}
          <div class="position-absolute end-0">
            <button class="" onclick={() => refreshTurboFrame(selectedFrameId)} title="Refresh Turbo Frames List">
              {@html Icons.refresh}
            </button>
          </div>
        {/if}
      </div>
      <div>
        <p><strong>Source:</strong> {currentFrame.src}</p>
        <p><strong>Loading:</strong> {currentFrame.loading}</p>
        <h4>Attributes:</h4>
        <ul>
          {#each Object.entries(currentFrame.attributes).filter(([key]) => !ignoredAttributes.includes(key)) as [key, value]}
            <li><strong>{key}:</strong> {value}</li>
          {/each}
        </ul>
      </div>
    {:else}
      <div class="no-entry-hint">
        <span>No Turbo Frame selected</span>
        <span>Select a frame to see its details</span>
      </div>
    {/if}
  </Pane>
</Splitpanes>

<style>
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #007bff;
    text-decoration: underline;
  }

  button:hover {
    color: #0056b3;
  }
</style>
