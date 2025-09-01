<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"
  import { slide } from "svelte/transition"

  import CopyButton from "$components/CopyButton.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import ScrollIntoViewButton from "$components/ScrollIntoViewButton.svelte"
  import IconButton from "$shoelace/IconButton.svelte"
  import HTMLRenderer from "$src/browser_panel/HTMLRenderer.svelte"
  import { getStimulusData } from "../../State.svelte.js"
  import { debounce, handleKeyboardNavigation } from "$utils/utils.js"
  import { panelPostMessage, addHighlightOverlay, addHighlightOverlayByPath, hideHighlightOverlay } from "../../messaging.js"
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
  const ignoredAttributes = ["id", "data-hotwire-dev-tools-uuid", "style"]

  const devTool = getDevtoolInstance()
  let options = $state(devTool.options)
  let stimulusControllers = $state([])
  let uniqueStimulusIdentifiers = $derived(flattenIdentifiers(stimulusControllers))

  $effect(() => {
    stimulusControllers = getStimulusData()
  })

  const flattenIdentifiers = (tree) => {
    const ids = new Set()
    const traverse = (nodes) => {
      for (const { identifier, children } of nodes) {
        ids.add(identifier)
        if (children) traverse(children)
      }
    }
    traverse(tree)
    return [...ids].sort()
  }
</script>

<Splitpanes horizontal={$horizontalPanes} dblClickSplitter={false}>
  <Pane class="stimulus-identifiers-list-pane full-pane" size={options.stimulusIdentifiersPaneDimensions?.streams || 35} minSize={20}>
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex flex-column h-100">
          <h2>Controllers</h2>
          <div class="scrollable-list">
            {#if stimulusControllers.length > 0}
              {#each uniqueStimulusIdentifiers as identifier, index (identifier)}
                <div class="entry-row p-1 cursor-pointer" animate:flip>
                  <div class="d-flex justify-content-between align-items-center">
                    <div>{identifier}</div>
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
  <Pane class="stimulus-controller-list-pane full-pane" size={options.stimulusControllerPaneDimensions?.streams || 35} minSize={20}></Pane>
</Splitpanes>
