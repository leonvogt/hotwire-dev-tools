<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"
  import { slide } from "svelte/transition"
  import NumberFlow from "@number-flow/svelte"
  import hljs from "highlight.js/lib/core"
  import xml from "highlight.js/lib/languages/xml"
  hljs.registerLanguage("xml", xml)

  import CopyButton from "$components/CopyButton.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import ScrollIntoViewButton from "$components/ScrollIntoViewButton.svelte"
  import IconButton from "$shoelace/IconButton.svelte"
  import { getTurboFrames, getTurboStreams, clearTurboStreams } from "../../State.svelte.js"
  import { debounce, handleKeyboardNavigation } from "$utils/utils.js"
  import { panelPostMessage } from "../../messaging.js"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants.js"
  import { getDevtoolInstance } from "$lib/devtool.js"
  import { horizontalPanes } from "../../theme.svelte.js"
  import * as Icons from "$utils/icons.js"

  const SELECTABLE_TYPES = {
    TURBO_FRAME: "turbo-frame",
    TURBO_STREAM: "turbo-stream",
  }
  const turboStreamAnimationDuration = 300
  const ignoredAttributes = ["id", "loading", "src", "complete", "aria-busy", "busy"]

  const devTool = getDevtoolInstance()
  let options = $state(devTool.options)
  let turboFrames = $state([])
  let turboStreams = $state([])
  const turboFrameCount = $derived(() => {
    const countFrames = (frames) => {
      return frames.reduce((count, frame) => {
        return count + 1 + (frame.children ? countFrames(frame.children) : 0)
      }, 0)
    }
    return countFrames(turboFrames)
  })
  let isFirstFrameCountRender = $state(true)

  let selected = $state({
    type: null,
    uuid: null,
    frame: null,
    stream: null,
  })

  const setSelectedTurboFrame = (frame) => {
    selected = {
      type: SELECTABLE_TYPES.TURBO_FRAME,
      uuid: frame.uuid,
      frame: frame,
      stream: null,
    }
  }

  const setSelectedTurboStream = (stream) => {
    selected = {
      type: SELECTABLE_TYPES.TURBO_STREAM,
      uuid: stream.uuid,
      frame: null,
      stream: stream,
    }
  }

  // Set the first Turbo Frame as selected if none is selected
  $effect(() => {
    turboFrames = getTurboFrames().sort((a, b) => a.id.localeCompare(b.id))
    turboStreams = getTurboStreams()

    if (!selected.uuid && turboFrames.length > 0) {
      selected = {
        type: SELECTABLE_TYPES.TURBO_FRAME,
        uuid: turboFrames[0].uuid,
        frame: turboFrames[0],
        stream: null,
      }
    }
  })

  $effect(() => {
    if (isFirstFrameCountRender && turboFrameCount() > 0) {
      setTimeout(() => {
        isFirstFrameCountRender = false
      }, 0)
    }
  })

  const scrollIntoView = debounce((element) => {
    element.scrollIntoView({ behavior: "smooth", block: "end" })
  }, turboStreamAnimationDuration)

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

  const refreshTurboFrame = (turboFrameId) => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.REFRESH_TURBO_FRAME,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
      id: turboFrameId,
    })
  }

  const handleFrameListKeyboardNavigation = (event) => {
    if (!turboFrames.length) return

    const currentIndex = turboFrames.findIndex((frame) => frame.uuid === selected.uuid)
    const newIndex = handleKeyboardNavigation(event, turboFrames, currentIndex)
    setSelectedTurboFrame(turboFrames[newIndex])

    setTimeout(() => {
      const selectedRow = document.querySelector(".turbo-frame-pane .entry-row.selected")
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 10)
  }

  const handleStreamListKeyboardNavigation = (event) => {
    if (!turboStreams.length) return

    const currentIndex = turboStreams.findIndex((stream) => stream.uuid === selected.uuid)
    const newIndex = handleKeyboardNavigation(event, turboStreams, currentIndex)
    console.log({ currentIndex, newIndex, turboStreams })

    setSelectedTurboStream(turboStreams[newIndex])

    setTimeout(() => {
      const selectedRow = document.querySelector(".turbo-stream-pane .entry-row.selected")
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 10)
  }

  const handlePaneResize = (event) => {
    const dimensions = event.detail.map((pane) => pane.size)
    devTool.saveOptions({
      turboPaneDimensions: {
        streams: dimensions[0],
        frames: dimensions[1],
        details: dimensions[2],
      },
    })
  }
</script>

<Splitpanes horizontal={$horizontalPanes} on:resized={handlePaneResize}>
  <Pane class="turbo-stream-pane full-pane" size={options.turboPaneDimensions?.streams || 35}>
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex flex-column h-100">
          <div class="d-flex justify-content-center align-items-center position-relative">
            <h2>Streams</h2>
            {#if turboStreams.length > 0}
              <IconButton class="position-absolute end-0" name="trash2" onclick={clearTurboStreams}></IconButton>
            {/if}
          </div>
          <div class="scrollable-list">
            {#if turboStreams.length > 0}
              {#each turboStreams as stream}
                <div
                  {@attach scrollIntoView}
                  class="entry-row p-1 cursor-pointer"
                  transition:slide={{ duration: turboStreamAnimationDuration }}
                  class:selected={selected.type === SELECTABLE_TYPES.TURBO_STREAM && selected.uuid === stream.uuid}
                  role="button"
                  tabindex="0"
                  onclick={() => setSelectedTurboStream(stream)}
                  onkeyup={handleStreamListKeyboardNavigation}
                  onmouseenter={() => addHighlightOverlay(stream.targetSelector)}
                  onmouseleave={() => hideHighlightOverlay()}
                >
                  <div class="text-align-right text-muted">
                    <span class="timestamp">{stream.time}</span>
                  </div>
                  <div class="d-flex justify-content-between align-items-center">
                    <div>{stream.action}</div>
                    <div>{stream.targetSelector}</div>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="no-entry-hint">
                <span>No Turbo Streams seen yet</span>
                <span>We'll keep looking</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </Pane>

  <Pane class="turbo-frame-pane full-pane" size={options.turboPaneDimensions?.frames || 35}>
    {#snippet turboFrameRow(frame, depth = 0)}
      {@const selector = `#${frame.id}`}
      <div
        class="d-flex justify-content-between align-items-center cursor-pointer entry-row"
        class:selected={selected.type === SELECTABLE_TYPES.TURBO_FRAME && selected.frame.id === frame.id}
        role="button"
        tabindex="0"
        style="--depth: {depth}"
        onclick={() => setSelectedTurboFrame(frame)}
        onkeyup={handleFrameListKeyboardNavigation}
        onmouseenter={() => addHighlightOverlay(selector)}
        onmouseleave={() => hideHighlightOverlay()}
      >
        <div>{selector}</div>
        <InspectButton class="btn-hoverable me-2" {selector}></InspectButton>
      </div>

      <!-- Recursively render children -->
      {#if frame.children && frame.children.length}
        {#each frame.children as child}
          {@render turboFrameRow(child, depth + 1)}
        {/each}
      {/if}
    {/snippet}

    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex flex-column h-100">
          <div class="d-flex justify-content-center align-items-center position-relative">
            <h2>Frames</h2>
            <sl-badge class="count-badge count-badge--small position-absolute end-0" variant="neutral" pill>
              <NumberFlow value={turboFrameCount()} animated={!isFirstFrameCountRender} />
            </sl-badge>
          </div>
          <div class="scrollable-list">
            {#if turboFrames.length > 0}
              {#each turboFrames as frame}
                {@render turboFrameRow(frame)}
              {/each}
            {:else}
              <div class="no-entry-hint">
                <span>No Turbo Frames found on this page</span>
                <span>We'll keep looking</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </Pane>

  <Pane class="turbo-detail-pane full-pane" size={options.turboPaneDimensions?.details || 30}>
    <div class="card h-100">
      <div class="card-body">
        {#if selected.type === SELECTABLE_TYPES.TURBO_FRAME && selected.uuid}
          <div class="d-flex flex-column h-100">
            <div class="d-flex justify-content-center align-items-center position-relative">
              <h2 class="pe-4">#{selected.frame.id}</h2>
              {#if selected.frame.src}
                <div class="position-absolute end-0">
                  <button class="btn-icon icon-dark" onclick={() => refreshTurboFrame(selected.frame.id)} title="Refresh Turbo Frames List">
                    {@html Icons.refresh}
                  </button>
                </div>
              {/if}
            </div>

            <div class="scrollable-list flow">
              <div class="pane-section-heading">Attributes</div>
              <table class="table table-sm w-100">
                <tbody>
                  <tr>
                    <td>Source</td>
                    <td>{selected.frame.src || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Loading</td>
                    <td>{selected.frame.loading || "N/A"}</td>
                  </tr>
                  {#each Object.entries(selected.frame.attributes).filter(([key]) => !ignoredAttributes.includes(key)) as [key, value]}
                    <tr>
                      <td>{key}</td>
                      <td>{value}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>

              <div class="pane-section-heading d-flex justify-content-between align-items-center py-0">
                <span>HTML</span>
                <div>
                  <ScrollIntoViewButton selector={`#${selected.frame.id}`}></ScrollIntoViewButton>
                  <InspectButton selector={`#${selected.frame.id}`}></InspectButton>
                </div>
              </div>
              <div class="html-preview">
                <pre><code class="language-html">{@html hljs.highlight(selected.frame.html, { language: "html" }).value}</code></pre>
              </div>
            </div>
          </div>
        {:else if selected.type === SELECTABLE_TYPES.TURBO_STREAM && selected.uuid}
          <div class="d-flex flex-column h-100">
            <div class="d-flex justify-content-center">
              <h2>{selected.stream.action} {selected.stream.targetSelector}</h2>
            </div>
            <div class="scrollable-list flow">
              <div class="pane-section-heading">Attributes</div>
              <table class="table table-sm w-100">
                <tbody>
                  <tr>
                    <td>Action</td>
                    <td>{selected.stream.action}</td>
                  </tr>
                  <tr>
                    <td>Target</td>
                    <td>
                      <div class="d-flex justify-content-between align-items-center">
                        <span>{selected.stream.targetSelector}</span>
                        <div>
                          <ScrollIntoViewButton selector={selected.stream.targetSelector}></ScrollIntoViewButton>
                          <InspectButton selector={selected.stream.targetSelector}></InspectButton>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="pane-section-heading d-flex justify-content-between align-items-center py-0">
                <span>HTML</span>
                <CopyButton value={selected.stream.turboStreamContent} />
              </div>
              <div class="html-preview">
                <pre><code class="language-html">{@html hljs.highlight(selected.stream.turboStreamContent, { language: "html" }).value}</code></pre>
              </div>
            </div>
          </div>
        {:else}
          <div class="no-entry-hint">
            <span>Nothing selected</span>
            <span>Select a Turbo Frame or Turbo Stream to see its details</span>
          </div>
        {/if}
      </div>
    </div>
  </Pane>
</Splitpanes>
