<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"
  import { flip } from "svelte/animate"

  import ValueTreeItem from "$src/components/Stimulus/ValueTreeItem.svelte"
  import TargetTreeItem from "$src/components/Stimulus/TargetTreeItem.svelte"
  import OutletTreeItem from "$src/components/Stimulus/OutletTreeItem.svelte"
  import ClassTreeItem from "$src/components/Stimulus/ClassTreeItem.svelte"
  import ActionTreeItem from "$src/components/Stimulus/ActionTreeItem.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import StripedHtmlTag from "$src/components/StripedHtmlTag.svelte"
  import { getStimulusData, getRegisteredStimulusIdentifiers } from "../../State.svelte.js"
  import { handleKeyboardNavigation, selectorByUUID } from "$utils/utils.js"
  import { addHighlightOverlay, hideHighlightOverlay } from "$src/browser_panel/messaging"
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
  let registeredStimulusIdentifiers = $state([])
  let notUsedStimulusIdentifiers = $derived(registeredStimulusIdentifiers.filter((identifier) => !stimulusControllers.find((n) => n.identifier === identifier)))
  let uniqueIdentifiers = $derived([...new Set(stimulusControllers.map((n) => n.identifier).filter(Boolean))].sort())
  let counts = $derived(
    stimulusControllers.reduce((acc, n) => {
      if (n.identifier) acc[n.identifier] = (acc[n.identifier] || 0) + 1
      return acc
    }, {}),
  )

  $effect(() => {
    stimulusControllers = getStimulusData()
  })

  $effect(() => {
    registeredStimulusIdentifiers = getRegisteredStimulusIdentifiers()
  })

  $effect(() => {
    const currentData = stimulusControllers

    const instance = currentData.find((n) => n.uuid === selected.uuid && n.identifier === selected.identifier)
    const selectedInstanceMissing = selected.uuid && !instance
    const shouldSelectFirstController = currentData.length > 0 && (!selected.identifier || selectedInstanceMissing)

    if (shouldSelectFirstController) {
      const instance = getStimulusInstances(uniqueIdentifiers[0])[0]
      setSelectedController(instance)
    } else if (selected.uuid && instance && instance !== selected.controller) {
      // Update selected controller reference, to store the latest data
      selected.controller = instance
      selected.identifier = instance.identifier
    }
  })

  const getStimulusInstances = (identifier) => {
    return stimulusControllers.filter((n) => n.identifier === identifier)
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
    if (!instance) return
    selected = {
      uuid: instance.uuid,
      controller: instance,
      identifier: instance.identifier,
    }
  }

  const handleIdentifiersKeyboardNavigation = (event) => {
    if (!uniqueIdentifiers.length) return
    event.preventDefault() // Prevents automatic browser scrolling

    if (event.key === "ArrowRight") {
      document.querySelector(".stimulus-controller-list-pane .entry-row.selected").focus()
      return
    }

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
    event.preventDefault() // Prevents automatic browser scrolling

    if (event.key === "ArrowLeft") {
      document.querySelector(".stimulus-identifiers-list-pane .entry-row.selected").focus()
      return
    }

    const currentIndex = instances.findIndex((instance) => instance.uuid === selected.uuid)
    const newIndex = handleKeyboardNavigation(event, instances, currentIndex)

    setSelectedController(instances[newIndex])

    setTimeout(() => {
      const selectedRow = document.querySelector(".stimulus-controller-list-pane .entry-row.selected")
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 10)
  }

  const isIdentifierRegistered = (identifier) => {
    if (!registeredStimulusIdentifiers.length) return true
    return registeredStimulusIdentifiers.includes(identifier)
  }
</script>

{#if stimulusControllers.length === 0}
  <div class="no-entry-hint mt-4">
    <span>No Stimulus Controllers seen yet</span>
    <span>We'll keep looking</span>
  </div>
{:else}
  <Splitpanes horizontal={$horizontalPanes} dblClickSplitter={false}>
    <Pane class="stimulus-identifiers-list-pane full-pane" size={options.stimulusIdentifiersPaneDimensions?.streams || 35} minSize={20}>
      <div class="pane-container">
        <div class="pane-header flex-center">
          {#if stimulusControllers.length === 0}
            <h3 class="pane-header-title">Controllers</h3>
          {/if}
        </div>
        {#if stimulusControllers.length > 0}
          <div class="pane-scrollable-list">
            {#each uniqueIdentifiers as identifier, index (identifier)}
              <div
                class="entry-row p-1 cursor-pointer"
                animate:flip={{ delay: 0, duration: 200 }}
                role="button"
                tabindex="0"
                onclick={() => setSelectedIdentifier(identifier)}
                onkeydown={handleIdentifiersKeyboardNavigation}
                onmouseenter={() => addHighlightOverlay(`[data-controller~="${identifier}"]`)}
                onmouseleave={() => hideHighlightOverlay()}
                class:selected={selected.identifier === identifier}
              >
                <div class="d-flex justify-content-between align-items-center">
                  <div id={`identifier-${index}`} class:error-text-underline={!isIdentifierRegistered(identifier)}>
                    {identifier}
                  </div>
                  {#if !isIdentifierRegistered(identifier)}
                    <wa-tooltip for={`identifier-${index}`} style="--max-width: 200px;">
                      <div>This controller does not appear to be registered in window.Stimulus.</div>
                    </wa-tooltip>
                  {/if}
                  <div>{counts[identifier]}</div>
                </div>
              </div>
            {/each}

            {#if notUsedStimulusIdentifiers.length > 0}
              {#each notUsedStimulusIdentifiers as identifier (identifier)}
                <div class="entry-row p-1" animate:flip={{ delay: 0, duration: 200 }}>
                  <div class="d-flex justify-content-between align-items-center text-muted">
                    {identifier}
                    <div>0</div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {:else}
          <div class="no-entry-hint">
            <span>No Stimulus Controllers seen yet</span>
            <span>We'll keep looking</span>
          </div>
        {/if}
      </div>
    </Pane>

    <Pane class="stimulus-controller-list-pane full-pane" size={options.stimulusControllerPaneDimensions?.details || 35} minSize={20}>
      <div class="pane-container">
        <div class="pane-header flex-center"></div>
        {#if selected.identifier}
          <div class="pane-scrollable-list">
            {#each getStimulusInstances(selected.identifier) as instance (instance.uuid)}
              <div
                class="entry-row entry-row--table-layout p-1 cursor-pointer"
                class:selected={selected.uuid === instance.uuid}
                animate:flip={{ delay: 0, duration: 200 }}
                role="button"
                tabindex="0"
                onclick={() => setSelectedController(instance)}
                onkeydown={handleInstancesKeyboardNavigation}
                onmouseenter={() => addHighlightOverlay(selectorByUUID(instance.uuid))}
                onmouseleave={() => hideHighlightOverlay()}
              >
                <div class="d-table-row">
                  <div class="stimulus-instance-first-column">
                    <StripedHtmlTag element={instance} />
                  </div>

                  <div class="stimulus-instance-second-column">
                    <div class="me-3 overflow-x-auto scrollbar-none">
                      <InspectButton class="btn-hoverable me-2" uuid={instance.uuid}></InspectButton>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="no-entry-hint">
            <span>Nothing selected</span>
            <span>Select a Stimulus Controller to see its details</span>
          </div>
        {/if}
      </div>
    </Pane>

    <Pane class="stimulus-detail-pane full-pane" size={options.stimulusDetailsPaneDimensions?.details || 30} minSize={20}>
      <div class="pane-container">
        <div class="pane-header flex-center"></div>
        {#if selected.controller}
          <div class="pane-scrollable-list">
            {#if selected.controller.values.length > 0}
              <div class="pane-section-heading">Values</div>
              {#each Object.entries(selected.controller.values) as [_key, valueObject] (selected.uuid + selected.identifier + valueObject.key)}
                {@const dataAttribute = `data-${selected.identifier}-${valueObject.key}`}
                <ValueTreeItem {valueObject} {selected} {dataAttribute} />
              {/each}
            {/if}
            {#if selected.controller.targets.length > 0}
              <div class="pane-section-heading">Targets</div>
              {#each selected.controller.targets.sort((a, b) => a.elements?.length < b.elements?.length) as target (selected.uuid + selected.identifier + target.name)}
                <TargetTreeItem {target} {selected} />
              {/each}
            {/if}
            {#if selected.controller.outlets.length > 0}
              <div class="pane-section-heading">Outlets</div>
              {#each selected.controller.outlets.sort((a, b) => a.elements?.length < b.elements?.length) as outlet (selected.uuid + selected.identifier + outlet.name)}
                <OutletTreeItem {outlet} {selected} />
              {/each}
            {/if}
            {#if selected.controller.classes.length > 0}
              <div class="pane-section-heading">Classes</div>
              {#each selected.controller.classes.sort((a, b) => a.classes?.length < b.classes?.length) as klass (selected.uuid + selected.identifier + klass.name)}
                <ClassTreeItem {klass} {selected} />
              {/each}
            {/if}
            {#if selected.controller.actions.length > 0}
              <div class="pane-section-heading">Actions</div>
              {#each selected.controller.actions as action (selected.uuid + selected.identifier + action.descriptor)}
                <ActionTreeItem {action} {selected} />
              {/each}
            {/if}
            {#if selected.controller.values.length === 0 && selected.controller.targets.length === 0 && selected.controller.outlets.length === 0 && selected.controller.classes.length === 0 && selected.controller.actions.length === 0}
              <div class="no-entry-hint">
                <span>No details available</span>
                <span>This controller has no values, targets, outlets, classes or actions</span>
              </div>
            {/if}
          </div>
        {:else}
          <div class="no-entry-hint">
            <span>Nothing selected</span>
            <span>Select a Stimulus Controller to see its details</span>
          </div>
        {/if}
      </div>
    </Pane>
  </Splitpanes>
{/if}

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
