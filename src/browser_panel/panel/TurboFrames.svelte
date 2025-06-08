<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"

  import { getTurboFrames } from "../State.svelte.js"
  import { inspectElement } from "../../utils/utils.js"
  import { panelPostMessage } from "../messaging"
  import { PANEL_TO_BACKEND_MESSAGES } from "../../lib/constants"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE } from "../ports"
  import * as Icons from "../../utils/icons.js"

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

<Splitpanes class="turbo-frames-list-panel">
  <Pane size={80}>
    <div class="scrollable-list">
      <table tabindex="0" onkeydown={handleKeyDown} role="grid" aria-label="Turbo Frames List">
        <thead>
          <tr>
            <th>ID</th>
            <th>Source</th>
            <th>Loading</th>
            <th>Attributes</th>
          </tr>
        </thead>
        <tbody>
          {#each turboFrames as frame}
            {@const selector = `#${frame.id}`}
            <tr
              class="cursor-pointer"
              class:selected={currentFrame?.id === frame.id}
              onclick={() => (selectedFrameId = frame.id)}
              onmouseenter={() => addHighlightOverlay(selector)}
              onmouseleave={() => hideHighlightOverlay()}
            >
              <td>
                <div class="d-flex align-items-center justify-content-between">
                  <span>{frame.id}</span>
                  <button class="btn-icon" onclick={() => inspectElement(selector)}>
                    {@html Icons.inspectElement}
                  </button>
                </div>
              </td>
              <td>{frame.src}</td>
              <td>{frame.loading}</td>
              <td>
                <ul>
                  {#each Object.entries(frame.attributes).filter(([key]) => !ignoredAttributes.includes(key)) as [key, value]}
                    <li><strong>{key}:</strong> {value}</li>
                  {/each}
                </ul>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Pane>

  <Pane class="turbo-frames-detail-panel">
    {#if currentFrame}
      <div>
        <h3>Details for Frame: {currentFrame.id}</h3>
        <p><strong>Source:</strong> {currentFrame.src}</p>
        <p><strong>Loading:</strong> {currentFrame.loading}</p>
        <h4>Attributes:</h4>
        <ul>
          {#each Object.entries(currentFrame.attributes).filter(([key]) => !ignoredAttributes.includes(key)) as [key, value]}
            <li><strong>{key}:</strong> {value}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </Pane>
</Splitpanes>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  tr:hover {
    background-color: #f1f1f1;
  }

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
