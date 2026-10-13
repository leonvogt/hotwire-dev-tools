<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"

  import { getActiveWarnings, getSilencedWarnings, silenceWarning, unsilenceWarning } from "../State.svelte.js"
  import { addHighlightOverlayByPath, hideHighlightOverlay } from "../messaging.js"
  import { handleKeyboardNavigation } from "$utils/utils.js"
  import { horizontalPanes } from "../theme.svelte.js"
  import { getDevtoolInstance } from "$lib/devtool.js"

  import IconButton from "$uikit/IconButton.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import StripedHtmlTag from "$components/StripedHtmlTag.svelte"

  const devTool = getDevtoolInstance()
  let options = $state(devTool.options)

  let activeWarnings = $derived(getActiveWarnings())
  let silencedWarnings = $derived(getSilencedWarnings())
  let allWarnings = $derived([...activeWarnings, ...silencedWarnings])

  let selectedId = $state(null)
  // Fall back to the first warning when the selected one disappears (e.g. after a page change)
  let selectedWarning = $derived(allWarnings.find((warning) => warning.id === selectedId) || allWarnings[0] || null)
  let selectedIsSilenced = $derived(silencedWarnings.some((warning) => warning.id === selectedWarning?.id))

  const highlight = (warning) => {
    if (warning.element?.elementPath) addHighlightOverlayByPath(warning.element.elementPath)
  }

  const toggleMuted = (warning) => {
    // Pin the selection so it doesn't jump to another warning once this one moves between sections
    selectedId = warning.id
    if (selectedIsSilenced) {
      unsilenceWarning(warning.id)
    } else {
      silenceWarning(warning.id)
    }
  }

  const handleWarningListKeyboardNavigation = (event) => {
    if (!allWarnings.length) return
    event.preventDefault() // Prevents automatic browser scrolling

    const currentIndex = allWarnings.findIndex((warning) => warning.id === selectedWarning?.id)
    const newIndex = handleKeyboardNavigation(event, allWarnings, currentIndex)
    if (newIndex === undefined) return

    selectedId = allWarnings[newIndex].id

    setTimeout(() => {
      const selectedRow = document.querySelector(".warning-list-pane .entry-row.selected")
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 10)
  }

  const handlePaneResize = (event) => {
    const dimensions = event.detail.map((pane) => pane.size)
    devTool.saveOptions({
      warningsPaneDimensions: {
        list: dimensions[0],
        details: dimensions[1],
      },
    })
  }
</script>

{#snippet warningRow(warning, silenced)}
  <div
    class="entry-row cursor-pointer"
    class:selected={selectedWarning?.id === warning.id}
    role="button"
    tabindex="0"
    onclick={() => (selectedId = warning.id)}
    onkeydown={handleWarningListKeyboardNavigation}
    onmouseenter={() => highlight(warning)}
    onmouseleave={() => hideHighlightOverlay()}
  >
    <div class="d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2 overflow-hidden" class:text-muted={silenced}>
        <wa-icon name={silenced ? "bell-slash" : "triangle-exclamation"} class:warning-icon={!silenced}></wa-icon>
        <span class="warning-title">{warning.title}</span>
      </div>
      {#if warning.element?.elementPath}
        <InspectButton class="btn-hoverable me-2" elementPath={warning.element.elementPath} />
      {/if}
    </div>
  </div>
{/snippet}

<Splitpanes horizontal={$horizontalPanes} on:resized={handlePaneResize} dblClickSplitter={false}>
  <Pane class="warning-list-pane full-pane" size={options.warningsPaneDimensions?.list || 50} minSize={20}>
    <div class="pane-container">
      {#if allWarnings.length > 0}
        <div class="pane-scrollable-list">
          {#each activeWarnings as warning (warning.id)}
            {@render warningRow(warning, false)}
          {/each}

          {#if silencedWarnings.length > 0}
            <div class="pane-section-heading">Muted on this site ({silencedWarnings.length})</div>
            {#each silencedWarnings as warning (warning.id)}
              {@render warningRow(warning, true)}
            {/each}
          {/if}
        </div>
        <div class="pane-footer">
          <div class="d-flex justify-content-end align-items-center h-100">
            <wa-badge variant="neutral" class="count-badge me-2" pill>{activeWarnings.length}</wa-badge>
          </div>
        </div>
      {:else}
        <div class="no-entry-hint">
          <span>No warnings found on this page</span>
          <span>We'll keep looking</span>
        </div>
      {/if}
    </div>
  </Pane>

  <Pane class="warning-detail-pane full-pane" size={options.warningsPaneDimensions?.details || 50} minSize={20}>
    <div class="pane-container">
      {#if selectedWarning}
        <div class="pane-scrollable-list">
          <div class="pane-section-heading">Message</div>
          <p class="warning-message">{selectedWarning.message}</p>

          {#if selectedWarning.element?.tagName}
            <div class="pane-section-heading">Element</div>
            <div class="entry-row" role="button" tabindex="0" onmouseenter={() => highlight(selectedWarning)} onmouseleave={() => hideHighlightOverlay()}>
              <div class="d-flex justify-content-between align-items-center">
                <StripedHtmlTag element={selectedWarning.element} />
                {#if selectedWarning.element.elementPath}
                  <InspectButton class="btn-hoverable" elementPath={selectedWarning.element.elementPath} />
                {/if}
              </div>
            </div>
          {/if}

          {#if selectedWarning.docsUrl}
            <div class="pane-section-heading">Docs</div>
            <div class="entry-row">
              <a href={selectedWarning.docsUrl} target="_blank" rel="noopener noreferrer">{selectedWarning.docsUrl}</a>
            </div>
          {/if}
        </div>
        <div class="pane-footer flex-center">
          <div class="position-absolute end-0 me-2">
            <wa-tooltip for="warning-mute-toggle">{selectedIsSilenced ? "Unmute this warning" : "Mute this warning on this site"}</wa-tooltip>
            <IconButton id="warning-mute-toggle" name={selectedIsSilenced ? "bell" : "bell-slash"} onclick={() => toggleMuted(selectedWarning)}></IconButton>
          </div>
        </div>
      {:else}
        <div class="no-entry-hint">
          <span>Nothing selected</span>
          <span>Select a warning to see its details</span>
        </div>
      {/if}
    </div>
  </Pane>
</Splitpanes>

<style>
  .warning-icon {
    color: var(--wa-color-yellow-70);
    flex-shrink: 0;
  }

  .warning-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .warning-message {
    margin: 0;
    padding: 0.5rem;
  }
</style>
