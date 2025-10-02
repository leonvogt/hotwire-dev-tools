<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"
  import { flip } from "svelte/animate"

  import ValueTreeItem from "$src/components/Stimulus/ValueTreeItem.svelte"
  import TargetTreeItem from "$src/components/Stimulus/TargetTreeItem.svelte"
  import OutletTreeItem from "$src/components/Stimulus/OutletTreeItem.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import HTMLRenderer from "$src/browser_panel/HTMLRenderer.svelte"
  import ScrollIntoViewButton from "$components/ScrollIntoViewButton.svelte"
  import { getStimulusData } from "../../State.svelte.js"
  import { flattenNodes, handleKeyboardNavigation, selectorByUUID } from "$utils/utils.js"
  import { addHighlightOverlay, hideHighlightOverlay } from "../../messaging.js"
  import { getDevtoolInstance } from "$lib/devtool.js"
  import { horizontalPanes } from "../../theme.svelte.js"

  const devTool = getDevtoolInstance()
  let options = $state(devTool.options)
  let selected = $state({
    identifier: null,
    uuid: null,
    controller: null,
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

    const instance = flattenStimulusControllers.find((n) => n.uuid === selected.uuid)
    const selectedInstanceMissing = selected.uuid && !instance
    const shouldSelectFirstController = stimulusControllers.length > 0 && (!selected.identifier || selectedInstanceMissing)
    if (shouldSelectFirstController) {
      const instance = getStimulusInstances(uniqueIdentifiers[0])[0]
      setSelectedController(instance)
    } else if (selected.uuid && instance) {
      // Update selected controller reference, to store the latest data
      selected.controller = instance
    }
  })

  const getStimulusInstances = (identifier) => {
    return flattenStimulusControllers.filter((n) => n.identifier === identifier)
  }

  const setSelectedIdentifier = (identifier) => {
    const instances = getStimulusInstances(identifier)
    if (instances.length) {
      setSelectedController(instances[0])
    } else {
      selected = {
        identifier: identifier,
        uuid: null,
        controller: null,
      }
    }
  }

  const setSelectedController = (instance) => {
    selected = {
      uuid: instance.uuid,
      controller: instance,
      identifier: instance.identifier,
    }
  }

  const handleIdentifiersKeyboardNavigation = (event) => {
    if (!uniqueIdentifiers.length) return

    const currentIndex = uniqueIdentifiers.findIndex((identifier) => identifier === selected.identifier)
    const newIndex = handleKeyboardNavigation(event, uniqueIdentifiers, currentIndex)
    setSelectedIdentifier(uniqueIdentifiers[newIndex])

    setTimeout(() => {
      const selectedRow = document.querySelector(".stimulus-identifiers-list-pane .entry-row.selected")
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 10)
  }

  const handleInstancesKeyboardNavigation = (event) => {
    const instances = getStimulusInstances(selected.identifier)
    if (!instances.length) return

    const currentIndex = instances.findIndex((instance) => instance.uuid === selected.uuid)
    const newIndex = handleKeyboardNavigation(event, instances, currentIndex)
    console.log(instances[newIndex])

    setSelectedController(instances[newIndex])

    setTimeout(() => {
      const selectedRow = document.querySelector(".stimulus-controller-list-pane .entry-row.selected")
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 10)
  }
</script>

<Splitpanes horizontal={$horizontalPanes} dblClickSplitter={false}>
  <Pane class="stimulus-identifiers-list-pane full-pane" size={options.stimulusIdentifiersPaneDimensions?.streams || 35} minSize={20}>
    <div class="h-100">
      <div class="d-flex flex-column h-100">
        {#if stimulusControllers.length === 0}
          <h2>Controllers</h2>
        {/if}
        <div class="scrollable-list">
          {#if stimulusControllers.length > 0}
            {#each uniqueIdentifiers as identifier, index (identifier)}
              <div
                class="entry-row p-1 cursor-pointer"
                animate:flip={{ delay: 0, duration: 200 }}
                role="button"
                tabindex="0"
                onclick={() => setSelectedIdentifier(identifier)}
                onkeyup={handleIdentifiersKeyboardNavigation}
                onmouseenter={() => addHighlightOverlay(`[data-controller~="${identifier}"]`)}
                onmouseleave={() => hideHighlightOverlay()}
                class:selected={selected.identifier === identifier}
              >
                <div class="d-flex justify-content-between align-items-center">
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
  </Pane>

  <Pane class="stimulus-controller-list-pane full-pane" size={options.stimulusControllerPaneDimensions?.details || 35} minSize={20}>
    <div class="h-100">
      <div class="scrollable-list">
        {#if selected.identifier}
          {#each getStimulusInstances(selected.identifier) as instance (instance.uuid)}
            <div
              class="entry-row entry-row--table-layout p-1 cursor-pointer"
              class:selected={selected.uuid === instance.uuid}
              animate:flip={{ delay: 0, duration: 200 }}
              role="button"
              tabindex="0"
              onclick={() => setSelectedController(instance)}
              onkeyup={handleInstancesKeyboardNavigation}
              onmouseenter={() => addHighlightOverlay(selectorByUUID(instance.uuid))}
              onmouseleave={() => hideHighlightOverlay()}
            >
              <div class="d-table-row">
                <div class="stimulus-instance-first-column">
                  <strong>{instance.identifier}</strong>
                </div>

                <div class="stimulus-instance-second-column">
                  <div class="me-3 overflow-x-auto scrollbar-none">
                    <InspectButton class="btn-hoverable me-2" selector={selectorByUUID(instance.uuid)}></InspectButton>
                    <HTMLRenderer htmlString={instance.serializedTag} />
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {:else}
          <div class="no-entry-hint">
            <span>Nothing selected</span>
            <span>Select a Stimulus Controller to see its details</span>
          </div>
        {/if}
      </div>
    </div>
  </Pane>

  <Pane class="stimulus-detail-pane full-pane" size={options.stimulusDetailsPaneDimensions?.details || 30} minSize={20}>
    <div class="card h-100">
      <div class="card-body">
        {#if selected.controller}
          <div class="d-flex flex-column h-100">
            <div class="scrollable-list">
              <div class="pane-section-heading">Values</div>
              {#each Object.entries(selected.controller.values) as [_key, valueObject] (selected.uuid + valueObject.key)}
                {@const dataAttribute = `data-${selected.identifier}-${valueObject.key}`}
                <ValueTreeItem {valueObject} {selected} {dataAttribute} />
              {/each}
              <div class="pane-section-heading">Targets</div>
              {#each selected.controller.targets.sort((a, b) => a.elements?.length < b.elements?.length) as target (selected.uuid + target.name)}
                <TargetTreeItem {target} {selected} />
              {/each}
              <div class="pane-section-heading">Outlets</div>
              {#each selected.controller.outlets.sort((a, b) => a.elements?.length < b.elements?.length) as outlet (selected.uuid + outlet.name)}
                <OutletTreeItem {outlet} {selected} />
              {/each}
            </div>
          </div>
        {:else}
          <div class="no-entry-hint">
            <span>Nothing selected</span>
            <span>Select a Stimulus Controller to see its details</span>
          </div>
        {/if}
      </div>
    </div></Pane
  >
</Splitpanes>

<style>
  .stimulus-instance-first-column {
    display: table-cell;
    width: 60%;
    vertical-align: top;
    padding-right: 8px;
  }
  .stimulus-instance-second-column {
    display: table-cell;
    width: 40%;
    vertical-align: top;
    text-align: right;
  }
</style>
