<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"
  import { slide } from "svelte/transition"

  import CopyButton from "$components/CopyButton.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import ScrollIntoViewButton from "$components/ScrollIntoViewButton.svelte"
  import IconButton from "$shoelace/IconButton.svelte"
  import HTMLRenderer from "$src/browser_panel/HTMLRenderer.svelte"
  import { getStimulusData } from "../../State.svelte.js"
  import { flattenNodes } from "$utils/utils.js"
  import { panelPostMessage, addHighlightOverlay, addHighlightOverlayByPath, hideHighlightOverlay } from "../../messaging.js"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants.js"
  import { getDevtoolInstance } from "$lib/devtool.js"
  import { horizontalPanes } from "../../theme.svelte.js"
  import * as Icons from "$utils/icons.js"
  import { collapseEntryRows, toggleStickyParent, checkStickyVisibility } from "$src/utils/collapsible.js"

  const devTool = getDevtoolInstance()
  let options = $state(devTool.options)
  let selected = $state({
    identifier: null,
    uuid: null,
  })
  let stimulusControllers = $state([])
  let flattenStimulusControllers = $derived(flattenNodes(stimulusControllers))
  let uniqueIdentifiers = $derived([...new Set(flattenStimulusControllers.map((n) => n.identifier).filter(Boolean))].sort())
  let counts = $derived(
    flattenStimulusControllers.reduce((acc, n) => {
      if (n.identifier) acc[n.identifier] = (acc[n.identifier] || 0) + 1
      return acc
    }, {}),
  )

  $effect(() => {
    stimulusControllers = getStimulusData()
  })

  const getStimulusInstances = (identifier) => {
    return flattenStimulusControllers.filter((n) => n.identifier === identifier)
  }

  const setSelectedIdentifier = (identifier) => {
    selected = {
      identifier: identifier,
    }
  }

  const handleEventListKeyboardNavigation = (event) => {}
</script>

<Splitpanes horizontal={$horizontalPanes} dblClickSplitter={false}>
  <Pane class="stimulus-identifiers-list-pane full-pane" size={options.stimulusIdentifiersPaneDimensions?.streams || 35} minSize={20}>
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex flex-column h-100">
          <h2>Controllers</h2>
          <div class="scrollable-list">
            {#if stimulusControllers.length > 0}
              {#each uniqueIdentifiers as identifier, index (identifier)}
                <div class="entry-row p-1 cursor-pointer" animate:flip>
                  <div
                    class="d-flex justify-content-between align-items-center"
                    class:selected={selected.identifier === identifier}
                    role="button"
                    tabindex="0"
                    onclick={() => setSelectedIdentifier(identifier)}
                    onkeyup={handleEventListKeyboardNavigation}
                  >
                    <div>{identifier}</div>
                    <div>{counts[identifier]}</div>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="no-entry-hint">
                <span>No Stimulus Controllers seen yet</span>
                <span>We'll keep looking</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </Pane>
  <Pane class="stimulus-controller-list-pane full-pane" size={options.stimulusControllerPaneDimensions?.details || 35} minSize={20}>
    <div class="card h-100">
      <div class="card-body">
        {#if selected.identifier}
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h2>Details for {selected.identifier}</h2>
          </div>
          {#each getStimulusInstances(selected.identifier) as instance (instance.uuid)}
            <div class="entry-row entry-row--table-layout p-1 cursor-pointer" class:selected={selected.uuid === instance.uuid}>
              <div class="turbo-event-entry-wrapper">
                <div class="turbo-event-first-column">
                  <strong>{instance.identifier}</strong>
                </div>

                <div class="turbo-event-second-column">
                  <div class="me-3 overflow-x-auto scrollbar-none"><HTMLRenderer htmlString={instance.serializedTag} /></div>
                </div>
              </div>
            </div>
          {/each}
        {:else}
          <div class="no-entry-hint">
            <span>Nothing selected</span>
            <span>Select a Turbo Event to see its details</span>
          </div>
        {/if}
      </div>
    </div>
  </Pane>
</Splitpanes>

<style>
  .turbo-event-entry-wrapper {
    display: table-row;
  }
  .turbo-event-first-column {
    display: table-cell;
    width: 60%;
    vertical-align: top;
    padding-right: 8px;
  }
  .turbo-event-second-column {
    display: table-cell;
    width: 40%;
    vertical-align: top;
    text-align: right;
  }

  .turbo-events-table {
    table-layout: fixed;
  }
</style>
