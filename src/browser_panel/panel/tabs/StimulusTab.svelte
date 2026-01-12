<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"
  import { flip } from "svelte/animate"

  import ValueTree from "$src/components/Stimulus/ValueTree.svelte"
  import TargetTree from "$src/components/Stimulus/TargetTree.svelte"
  import OutletTree from "$src/components/Stimulus/OutletTree.svelte"
  import ClassTree from "$src/components/Stimulus/ClassTree.svelte"
  import ActionTree from "$src/components/Stimulus/ActionTree.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import StripedHtmlTag from "$src/components/StripedHtmlTag.svelte"
  import { getStimulusData, getRegisteredStimulusIdentifiers } from "../../State.svelte.js"
  import { handleKeyboardNavigation, selectorByUUID } from "$utils/utils.js"
  import { addHighlightOverlay, hideHighlightOverlay } from "$src/browser_panel/messaging"
  import { getDevtoolInstance } from "$lib/devtool.js"
  import { horizontalPanes } from "../../theme.svelte.js"
  import CopyButton from "$src/components/CopyButton.svelte"

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
    if (newIndex === undefined) return

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
    if (newIndex === undefined) return

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
        {#if stimulusControllers.length > 0}
          <div class="pane-scrollable-list">
            {#each uniqueIdentifiers as identifier, index (identifier)}
              <div
                class="entry-row cursor-pointer"
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
                <div class="entry-row disabled" animate:flip={{ delay: 0, duration: 200 }}>
                  <div class="d-flex justify-content-between align-items-center">
                    {identifier}
                    <div>0</div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
          <div class="pane-footer d-flex justify-content-end align-items-center">
            <wa-tooltip for="stimulus-count-infos" style="--max-width: 20rem;">
              <div>
                <strong class="stimulus-count-info">{uniqueIdentifiers.length}</strong> Stimulus Controllers in use
              </div>
              <div>
                <strong class="stimulus-count-info">{registeredStimulusIdentifiers.length}</strong> Total Stimulus Controllers
              </div>
              <div>
                <strong class="stimulus-count-info">{counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0}</strong> Total Stimulus Controller instances
              </div>
            </wa-tooltip>
            <div id="stimulus-count-infos" class="footer-text">{uniqueIdentifiers.length} / {registeredStimulusIdentifiers.length}</div>
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
        {#if selected.identifier}
          <div class="pane-scrollable-list">
            {#each getStimulusInstances(selected.identifier) as instance (instance.uuid)}
              <div
                class="entry-row entry-row--table-layout cursor-pointer"
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
                    <div class="overflow-x-auto scrollbar-none">
                      <InspectButton class="btn-hoverable me-2" uuid={instance.uuid}></InspectButton>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
          <div class="pane-footer flex-center">
            <div class="pane-footer-title">
              {selected.identifier}
            </div>
            <CopyButton class="ms-2" value={selected.identifier} />
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
        {#if selected.controller}
          <div class="pane-scrollable-list">
            {#if selected.controller.values.length > 0}
              <div class="pane-section-heading">Values</div>
              {#each Object.entries(selected.controller.values) as [_key, valueObject] (selected.uuid + selected.identifier + valueObject.key)}
                {@const dataAttribute = `data-${selected.identifier}-${valueObject.key}`}
                <ValueTree {valueObject} {selected} {dataAttribute} />
              {/each}
            {/if}
            {#if selected.controller.targets.length > 0}
              <div class="pane-section-heading">Targets</div>
              {#each selected.controller.targets.sort((a, b) => a.elements?.length < b.elements?.length) as target (selected.uuid + selected.identifier + target.name)}
                <TargetTree {target} {selected} />
              {/each}
            {/if}
            {#if selected.controller.outlets.length > 0}
              <div class="pane-section-heading">Outlets</div>
              {#each selected.controller.outlets.sort((a, b) => a.elements?.length < b.elements?.length) as outlet (selected.uuid + selected.identifier + outlet.name)}
                <OutletTree {outlet} {selected} />
              {/each}
            {/if}
            {#if selected.controller.classes.length > 0}
              <div class="pane-section-heading">Classes</div>
              {#each selected.controller.classes.sort((a, b) => a.classes?.length < b.classes?.length) as klass (selected.uuid + selected.identifier + klass.name)}
                <ClassTree {klass} {selected} />
              {/each}
            {/if}
            {#if selected.controller.actions.length > 0}
              <div class="pane-section-heading">Actions</div>
              {#each selected.controller.actions as action (selected.uuid + selected.identifier + action.descriptor)}
                <ActionTree {action} {selected} />
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
  .stimulus-count-info {
    display: inline-block;
    width: 3ch;
    font-family: monospace;
    text-align: right;
  }
</style>
