<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"
  import { flip } from "svelte/animate"

  import CopyButton from "$components/CopyButton.svelte"
  import TreeItem from "$components/TreeItem.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import IconButton from "$uikit/IconButton.svelte"
  import HTMLRenderer from "$src/browser_panel/HTMLRenderer.svelte"
  import { getStimulusData } from "../../State.svelte.js"
  import { flattenNodes, handleKeyboardNavigation, debounce } from "$utils/utils.js"
  import { updateDataAttribute, addHighlightOverlay, hideHighlightOverlay } from "../../messaging.js"
  import { getDevtoolInstance } from "$lib/devtool.js"
  import { horizontalPanes } from "../../theme.svelte.js"

  let editedValues = $state({})
  let currentlyEditing = $state([])
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

  const getEditedValue = (uuid, key, defaultValue) => {
    if (!editedValues[uuid]) editedValues[uuid] = {}
    if (editedValues[uuid][key] === undefined) editedValues[uuid][key] = defaultValue
    return editedValues[uuid][key]
  }

  const setEditedValue = (uuid, key, value) => {
    if (!editedValues[uuid]) editedValues[uuid] = {}
    editedValues[uuid][key] = value
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
              onmouseenter={() => addHighlightOverlay(`[data-hotwire-dev-tools-uuid="${instance.uuid}"]`)}
              onmouseleave={() => hideHighlightOverlay()}
            >
              <div class="d-table-row">
                <div class="stimulus-instance-first-column">
                  <strong>{instance.identifier}</strong>
                </div>

                <div class="stimulus-instance-second-column">
                  <div class="me-3 overflow-x-auto scrollbar-none">
                    <InspectButton class="btn-hoverable me-2" selector={`[data-hotwire-dev-tools-uuid="${instance.uuid}"]`}></InspectButton>
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
                {@const uniqueKey = `${selected.uuid}-${valueObject.key}`}
                {@const isCurrentlyEditing = currentlyEditing.includes(uniqueKey)}
                <div class="d-flex gap-2 mb-2">
                  {#if typeof valueObject.value === "object" && valueObject.value !== null}
                    <wa-tree>
                      <wa-tree-item expanded>
                        {valueObject.name}
                        {#each Object.entries(valueObject.value) as [label, children]}
                          <TreeItem {label} {children} />
                        {/each}
                      </wa-tree-item>
                    </wa-tree>
                  {:else}
                    <span class="code-key">{valueObject.name}:</span>
                    <div class="d-flex code-value">
                      {#if isCurrentlyEditing}
                        <form
                          class="d-flex"
                          onsubmit={(e) => {
                            e.preventDefault()
                            updateDataAttribute(`[data-hotwire-dev-tools-uuid="${selected.uuid}"]`, dataAttribute, getEditedValue(selected.uuid, valueObject.key))
                            currentlyEditing = currentlyEditing.filter((k) => k !== uniqueKey)
                          }}
                        >
                          <wa-input size="extra-small" value={valueObject.value} oninput={(e) => setEditedValue(selected.uuid, valueObject.key, e.target.value)}></wa-input>
                          <wa-button class="small-icon-button" variant="neutral" appearance="plain" type="submit">
                            <wa-icon name="check"></wa-icon>
                          </wa-button>
                        </form>
                        <IconButton
                          name="xmark"
                          onclick={() => {
                            if (editedValues[selected.uuid]) {
                              delete editedValues[selected.uuid][valueObject.key]
                              if (Object.keys(editedValues[selected.uuid]).length === 0) {
                                delete editedValues[selected.uuid]
                              }
                            }
                            currentlyEditing = currentlyEditing.filter((k) => k !== uniqueKey)
                          }}
                        ></IconButton>
                      {:else}
                        {valueObject.value}
                        <IconButton
                          name="pencil"
                          onclick={() => {
                            currentlyEditing = [...currentlyEditing, uniqueKey]
                          }}
                        ></IconButton>
                      {/if}
                    </div>
                  {/if}
                  <wa-button id={`rich-tooltip-${valueObject.key}`} variant="neutral" appearance="plain" size="small" class="small-icon-button" class:d-none={isCurrentlyEditing}>
                    <wa-icon name="info" label="Info"></wa-icon>
                  </wa-button>
                  <wa-tooltip for={`rich-tooltip-${valueObject.key}`} trigger="click" style="--max-width: 100%;">
                    <div class="">
                      <div class="flex-center">Type: {valueObject.type}</div>
                      <div class="d-flex justify-content-between align-items-center">
                        <span>{dataAttribute}</span>
                        <CopyButton value={dataAttribute} />
                      </div>

                      <div class="d-flex justify-content-between align-items-center">
                        <span>{`this.${valueObject.name}`}</span>
                        <CopyButton value={`this.${valueObject.name}`} />
                      </div>

                      <div class="d-flex justify-content-between align-items-center">
                        <span>{`this.${valueObject.name}s`}</span>
                        <CopyButton value={`this.${valueObject.name}s`} />
                      </div>

                      <div class="d-flex justify-content-between align-items-center">
                        <span>{`this.has${valueObject.name[0].toUpperCase() + valueObject.name.slice(1)}`}</span>
                        <CopyButton value={`this.has${valueObject.name[0].toUpperCase() + valueObject.name.slice(1)}`} />
                      </div>
                    </div>
                  </wa-tooltip>
                </div>
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
