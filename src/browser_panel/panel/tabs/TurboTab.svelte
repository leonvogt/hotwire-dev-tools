<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"
  import { slide } from "svelte/transition"
  import NumberFlow from "@number-flow/svelte"

  import CopyButton from "$components/CopyButton.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import ScrollIntoViewButton from "$components/ScrollIntoViewButton.svelte"
  import IconButton from "$uikit/IconButton.svelte"
  import HTMLRenderer from "$src/browser_panel/HTMLRenderer.svelte"
  import StripedHtmlTag from "$src/components/StripedHtmlTag.svelte"
  import { getTurboFrames, getTurboCables, getTurboStreams, clearTurboStreams, getTurboPermanentElements, getTurboTemporaryElements, getTurboConfig } from "../../State.svelte.js"
  import { debounce, handleKeyboardNavigation, selectorByUUID } from "$utils/utils.js"
  import { panelPostMessage, addHighlightOverlay, hideHighlightOverlay } from "../../messaging.js"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants.js"
  import { getDevtoolInstance } from "$lib/devtool.js"
  import { horizontalPanes } from "../../theme.svelte.js"
  import * as Icons from "$utils/icons.js"
  import { collapseEntryRows, toggleStickyParent, checkStickyVisibility } from "$src/utils/collapsible.js"

  const SELECTABLE_TYPES = {
    TURBO_FRAME: "turbo-frame",
    TURBO_STREAM: "turbo-stream",
  }
  const turboStreamAnimationDuration = 300
  const ignoredAttributes = ["id", "data-hotwire-dev-tools-id", "style"]

  const devTool = getDevtoolInstance()
  let options = $state(devTool.options)
  let turboFrames = $state([])
  let turboCables = $state([])
  let turboStreams = $state([])
  let turboPermanentElements = $state([])
  let turboTemporaryElements = $state([])
  let turboConfig = $state({})
  let collapsedFrames = $state({})
  let stickyFrames = $state({})

  const connectedTurboCablesCount = $derived(() => {
    return turboCables.filter((cable) => cable.connected).length
  })

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

  $effect(() => {
    turboFrames = getTurboFrames().sort((a, b) => a.id.localeCompare(b.id))
    turboStreams = getTurboStreams()
    turboCables = getTurboCables()
    turboPermanentElements = getTurboPermanentElements()
    turboTemporaryElements = getTurboTemporaryElements()
    turboConfig = getTurboConfig()
  })

  $effect(() => {
    const currentFrames = turboFrames
    const isStreamSelected = selected.type === SELECTABLE_TYPES.TURBO_STREAM
    const selectedFrameMissing = !findFrameByUuid(currentFrames, selected.uuid)
    const shouldSelectFirstFrame = currentFrames.length > 0 && !isStreamSelected && selectedFrameMissing

    if (shouldSelectFirstFrame) {
      selected = {
        type: SELECTABLE_TYPES.TURBO_FRAME,
        uuid: currentFrames[0].uuid,
        frame: currentFrames[0],
        stream: null,
      }
    } else if (selected.type === SELECTABLE_TYPES.TURBO_FRAME) {
      // Update the selected frame if it has changed
      const updatedFrame = findFrameByUuid(currentFrames, selected.uuid)
      if (updatedFrame && updatedFrame !== selected.frame) {
        selected = {
          ...selected,
          frame: updatedFrame,
        }
      }
    }
  })

  // Reset all sticky frames when the list of Turbo Frames changes
  $effect(() => {
    if (!turboFrames.length) return

    setTimeout(() => {
      Object.values(stickyFrames).forEach((frameEl) => frameEl.classList.remove("sticky-parent"))
      stickyFrames = {}

      document.querySelectorAll(".turbo-frame-pane .entry-row").forEach((frameElement) => {
        const frameUuid = frameElement.getAttribute("data-frame-uuid")
        if (!frameUuid) return

        const containerElement = frameElement.nextElementSibling
        if (!containerElement?.classList.contains("children-container")) return

        const isExpanded = !collapsedFrames[frameUuid]
        const hasChildren = containerElement.querySelectorAll(".entry-row").length > 0

        toggleStickyParent(frameUuid, frameElement, isExpanded && hasChildren, stickyFrames)
      })
    }, 100)
  })

  $effect(() => {
    if (isFirstFrameCountRender && turboFrameCount() > 0) {
      setTimeout(() => {
        isFirstFrameCountRender = false
      }, 0)
    }
  })

  const findFrameByUuid = (frames, uuid) => {
    for (const frame of frames) {
      if (frame.uuid === uuid) {
        return frame
      }
      if (frame.children && frame.children.length > 0) {
        const found = findFrameByUuid(frame.children, uuid)
        if (found) return found
      }
    }
    return null
  }

  const setSelectedTurboFrame = (frame) => {
    if (!frame) return

    selected = {
      type: SELECTABLE_TYPES.TURBO_FRAME,
      uuid: frame.uuid,
      frame: frame,
      stream: null,
    }
    document.querySelector(".turbo-detail-pane wa-tab[panel='overview']").removeAttribute("active")
    document.querySelector(".turbo-detail-pane wa-tab[panel='details']").setAttribute("active", "")
  }

  const setSelectedTurboStream = (stream) => {
    if (!stream) return

    selected = {
      type: SELECTABLE_TYPES.TURBO_STREAM,
      uuid: stream.uuid,
      frame: null,
      stream: stream,
    }
    document.querySelector(".turbo-detail-pane wa-tab[panel='overview']").removeAttribute("active")
    document.querySelector(".turbo-detail-pane wa-tab[panel='details']").setAttribute("active", "")
  }

  const addTurboFrameListListeners = (scrollableList) => {
    scrollableList.addEventListener("scroll", () => checkStickyVisibility(scrollableList, stickyFrames, collapsedFrames))
  }

  const scrollIntoView = debounce((element) => {
    element.scrollIntoView({ behavior: "smooth", block: "end" })
  }, turboStreamAnimationDuration)

  const refreshTurboFrame = (turboFrameId) => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.REFRESH_TURBO_FRAME,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
      id: turboFrameId,
    })
  }

  const handleFrameListKeyboardNavigation = (event) => {
    if (!turboFrames.length) return
    event.preventDefault() // Prevents automatic browser scrolling

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
    event.preventDefault() // Prevents automatic browser scrolling

    const currentIndex = turboStreams.findIndex((stream) => stream.uuid === selected.uuid)
    const newIndex = handleKeyboardNavigation(event, turboStreams, currentIndex)

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

<Splitpanes horizontal={$horizontalPanes} on:resized={handlePaneResize} dblClickSplitter={false}>
  <Pane class="turbo-stream-pane full-pane" size={options.turboPaneDimensions?.streams || 35} minSize={20}>
    <div class="pane-container">
      <div class="pane-header flex-center">
        {#if turboStreams.length <= 0}
          <h3 class="pane-header-title">Streams</h3>
        {/if}

        <div class="position-absolute end-0">
          {#if turboStreams.length > 0}
            <IconButton name="trash" onclick={clearTurboStreams}></IconButton>
          {/if}
          {#if turboCables.length > 0}
            <wa-tooltip for="turbo-cable-indication-icon">{`${connectedTurboCablesCount()} / ${turboCables.length} Turbo Stream WebSockets are connected`}</wa-tooltip>
            <wa-icon name="circle" label="websocket-indication" id="turbo-cable-indication-icon" class:connected={connectedTurboCablesCount() == turboCables.length}></wa-icon>
          {/if}
        </div>
      </div>

      {#if turboStreams.length > 0}
        <div class="pane-scrollable-list">
          {#each turboStreams as stream (stream.uuid)}
            <div
              {@attach scrollIntoView}
              class="entry-row p-1 cursor-pointer"
              transition:slide={{ duration: turboStreamAnimationDuration }}
              class:selected={selected.type === SELECTABLE_TYPES.TURBO_STREAM && selected.uuid === stream.uuid}
              role="button"
              tabindex="0"
              onclick={() => setSelectedTurboStream(stream)}
              onkeydown={handleStreamListKeyboardNavigation}
              onmouseenter={() => addHighlightOverlay(stream.targetSelector)}
              onmouseleave={() => hideHighlightOverlay()}
            >
              <div class="text-align-right text-muted">
                <span>{stream.time}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <div>{stream.action}</div>
                <div>{stream.targetSelector}</div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="no-entry-hint">
          <span>No Turbo Streams seen yet</span>
          <span>We'll keep looking</span>
        </div>
      {/if}
    </div>
  </Pane>

  <Pane class="turbo-frame-pane full-pane" size={options.turboPaneDimensions?.frames || 35} minSize={20}>
    {#snippet turboFrameRow(frame, depth = 0)}
      {@const selector = `#${frame.id}`}
      {@const hasChildren = frame.children && frame.children.length > 0}
      {@const isCollapsed = collapsedFrames[frame.uuid] || false}
      {@const isLeafNode = !hasChildren && depth > 0}

      <div
        class="d-flex justify-content-between align-items-center cursor-pointer entry-row"
        class:selected={selected.type === SELECTABLE_TYPES.TURBO_FRAME && selected.frame.id === frame.id}
        class:with-children={hasChildren}
        class:leaf-node={isLeafNode}
        class:ps-0={hasChildren && depth === 0}
        role="button"
        tabindex="0"
        style="--depth: {depth}"
        data-frame-uuid={frame.uuid}
        onclick={() => setSelectedTurboFrame(frame)}
        onkeydown={handleFrameListKeyboardNavigation}
        onmouseenter={() => addHighlightOverlay(selector)}
        onmouseleave={() => hideHighlightOverlay()}
      >
        <div class="d-flex align-items-center">
          {#if hasChildren}
            <IconButton class="collapse-icon {isCollapsed ? 'rotated' : ''}" name="chevron-down" onclick={(event) => collapseEntryRows(frame.uuid, event, collapsedFrames, stickyFrames)}></IconButton>
          {/if}
          <StripedHtmlTag element={frame} />
          {#if !frame.hasUniqueId}
            <wa-tooltip for={`unique-id-warning-icon-${frame.uuid}`}>Warning: Multiple &lt;turbo-frame&gt; elements share the same ID</wa-tooltip>
            <wa-icon name="triangle-exclamation" id={`unique-id-warning-icon-${frame.uuid}`} style="color: var(--wa-color-yellow-70);"></wa-icon>
          {/if}
        </div>
        <div>
          {#if frame.attributes.busy !== undefined}
            <wa-spinner></wa-spinner>
          {/if}
          <InspectButton class="btn-hoverable me-2" {selector}></InspectButton>
        </div>
      </div>

      <!-- Recursively render children -->
      {#if hasChildren}
        <div class="children-container" class:collapsed={isCollapsed}>
          {#each frame.children as child (child.uuid)}
            {@render turboFrameRow(child, depth + 1)}
          {/each}
        </div>
      {/if}
    {/snippet}

    <div class="pane-container">
      <div class="pane-header flex-center">
        {#if turboFrameCount() <= 0}
          <h3 class="pane-header-title">Frames</h3>
        {/if}
        <wa-badge variant="neutral" style="font-size: var(--wa-font-size-xs);" class="position-absolute end-0 me-2" pill>
          <NumberFlow value={turboFrameCount()} animated={!isFirstFrameCountRender} />
        </wa-badge>
      </div>
      {#if turboFrames.length > 0}
        <div class="pane-scrollable-list" {@attach addTurboFrameListListeners}>
          {#each turboFrames as frame (frame.uuid)}
            {@render turboFrameRow(frame)}
          {/each}
        </div>
      {:else}
        <div class="no-entry-hint">
          <span>No Turbo Frames found on this page</span>
          <span>We'll keep looking</span>
        </div>
      {/if}
    </div>
  </Pane>

  <Pane class="turbo-detail-pane full-pane" size={options.turboPaneDimensions?.details || 30} minSize={20}>
    <div class="pane-container">
      <wa-tab-group>
        <wa-tab panel="overview">Overview</wa-tab>
        <wa-tab panel="details">Details</wa-tab>

        <wa-tab-panel name="overview">
          <table class="table table-sm turbo-overview-table">
            <tbody>
              <tr>
                <td>
                  <wa-tooltip for="config-turbo-session">Checks 'window.Turbo.session.drive' to see if Turbo Drive is enabled</wa-tooltip>
                  <div id="config-turbo-session">Turbo Drive</div>
                </td>
                <td>{typeof turboConfig.turboDriveEnabled === "boolean" ? (turboConfig.turboDriveEnabled ? "On" : "Off") : "-"}</td>
              </tr>
              {#if turboConfig.prefetchDisabled}
                <tr>
                  <td>
                    <wa-tooltip for="config-turbo-prefetch">Checks the meta tag 'turbo-prefetch' to see if Link Prefetch is enabled</wa-tooltip>
                    <div id="config-turbo-prefetch">Link Prefetch</div>
                  </td>
                  <td>Off</td>
                </tr>
              {/if}
              <tr>
                <td>
                  <wa-tooltip for="config-turbo-refresh">Defines how Turbo handles page refreshes. Meta Tag: turbo-refresh-method</wa-tooltip>
                  <div id="config-turbo-refresh">Refresh Control</div>
                </td>
                <td>{turboConfig.refreshMethod || "-"}</td>
              </tr>
              <tr>
                <td>
                  <wa-tooltip for="config-turbo-visit-control">Defines if Turbo should perform a full page reload. Meta Tag: turbo-visit-control</wa-tooltip>
                  <div id="config-turbo-visit-control">Visit Control</div>
                </td>
                <td>{turboConfig.visitControl || "-"}</td>
              </tr>
              <tr>
                <td>
                  <wa-tooltip for="config-turbo-cache-control">Defines the turbo caching behavior. Meta Tag: turbo-cache-control</wa-tooltip>
                  <div id="config-turbo-cache-control">Cache Control</div>
                </td>
                <td>{turboConfig.cacheControl || "-"}</td>
              </tr>
            </tbody>
          </table>
          <div class="pane-scrollable-list">
            {#if turboPermanentElements.length > 0}
              <div class="pane-section-heading">Permanent Elements ({turboPermanentElements.length})</div>
              {#each turboPermanentElements as element (element.uuid)}
                <div class="entry-row p-2 border-bottom" onmouseenter={() => addHighlightOverlay(selectorByUUID(element.uuid))} onmouseleave={() => hideHighlightOverlay()} role="button" tabindex="0">
                  <div class="d-flex justify-content-between align-items-center">
                    <StripedHtmlTag {element} />
                    <InspectButton class="btn-hoverable" uuid={element.uuid}></InspectButton>
                  </div>
                </div>
              {/each}
            {/if}

            {#if turboTemporaryElements.length > 0}
              <div class="pane-section-heading">Temporary Elements ({turboTemporaryElements.length})</div>
              {#each turboTemporaryElements as element (element.uuid)}
                <div class="entry-row p-2 border-bottom" onmouseenter={() => addHighlightOverlay(selectorByUUID(element.uuid))} onmouseleave={() => hideHighlightOverlay()} role="button" tabindex="0">
                  <div class="d-flex justify-content-between align-items-center">
                    <StripedHtmlTag {element} />
                    <InspectButton class="btn-hoverable" uuid={element.uuid}></InspectButton>
                  </div>
                </div>
              {/each}
            {/if}

            {#if turboPermanentElements.length === 0 && turboTemporaryElements.length === 0}
              <div class="no-entry-hint">
                <span>No Turbo permanent or temporary elements found</span>
                <span>Elements with data-turbo-permanent or data-turbo-temporary will appear here</span>
              </div>
            {/if}
          </div>
        </wa-tab-panel>
        <wa-tab-panel name="details">
          {#if selected.type === SELECTABLE_TYPES.TURBO_FRAME && selected.uuid}
            <div class="pane-header flex-center">
              <h3 class="pane-header-title">#{selected.frame.id}</h3>
              {#if selected.frame.attributes.src}
                <div class="position-absolute end-0 me-2">
                  <button class="btn-icon action-icon" onclick={() => refreshTurboFrame(selected.frame.id)} aria-label="Refresh Turbo Frames List">
                    {@html Icons.refresh}
                  </button>
                </div>
              {/if}
            </div>

            <div class="pane-scrollable-list">
              {#if selected.frame.referenceElements.length > 0}
                <div class="pane-section-heading">
                  <span>Targeted by</span>
                </div>
                {#each selected.frame.referenceElements as referenceElement}
                  <div class="entry-row p-2 border-bottom" onmouseenter={() => addHighlightOverlay(selectorByUUID(referenceElement.uuid))} onmouseleave={() => hideHighlightOverlay()} role="button" tabindex="0">
                    <div class="d-flex justify-content-between align-items-center">
                      <StripedHtmlTag element={referenceElement} />
                      <InspectButton class="btn-hoverable" uuid={referenceElement.uuid}></InspectButton>
                    </div>
                  </div>
                {/each}
              {/if}

              {#if Object.keys(selected.frame.attributes).filter((key) => !ignoredAttributes.includes(key)).length > 0}
                <div class="pane-section-heading">Attributes</div>
                <table class="table table-sm w-100 turbo-table">
                  <tbody>
                    {#each Object.entries(selected.frame.attributes).filter(([key]) => !ignoredAttributes.includes(key)) as [key, value]}
                      <tr>
                        <td><div class="code-keyword">{key}</div></td>
                        <td>{value}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            </div>
          {:else if selected.type === SELECTABLE_TYPES.TURBO_STREAM && selected.uuid}
            <div class="pane-header flex-center">
              <h3 class="pane-header-title">{selected.stream.action} {selected.stream.targetSelector}</h3>
            </div>
            <div class="pane-scrollable-list">
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
                <pre><code class="language-html"><HTMLRenderer htmlString={selected.stream.turboStreamContent} /></code></pre>
              </div>
            </div>
          {:else}
            <div class="no-entry-hint">
              <span>Nothing to see here</span>
            </div>
          {/if}
        </wa-tab-panel>
      </wa-tab-group>
    </div>
  </Pane>
</Splitpanes>

<style>
  #turbo-cable-indication-icon {
    color: var(--wa-color-danger-fill-loud);
  }
  #turbo-cable-indication-icon.connected {
    color: var(--wa-color-success-fill-loud);
  }

  /* To prevent flickering when reloading async Turbo Frames */
  .turbo-table td:first-child {
    min-width: 7rem;
    white-space: nowrap;
  }

  .turbo-overview-table td:first-child {
    width: 10rem;
    white-space: nowrap;
  }
</style>
