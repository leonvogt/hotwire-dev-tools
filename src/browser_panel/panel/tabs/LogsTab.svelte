<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"

  import { getTurboEvents } from "../../State.svelte.js"
  import { debounce, handleKeyboardNavigation } from "$utils/utils.js"
  import { getDevtoolInstance } from "$lib/devtool.js"
  import { horizontalPanes } from "../../theme.svelte.js"

  const SELECTABLE_TYPES = {
    TURBO_EVENT: "turbo-event",
  }

  const devTool = getDevtoolInstance()
  let options = $state(devTool.options)
  let turboEvents = $state([])

  let selected = $state({
    type: null,
    uuid: null,
    turboEvent: null,
  })

  $effect(() => {
    turboEvents = getTurboEvents()

    const shouldSelectFirstEvent = turboEvents.length > 0 && selected.uuid === null
    if (shouldSelectFirstEvent) {
      selected = {
        type: SELECTABLE_TYPES.TURBO_EVENT,
        uuid: turboEvents[0].uuid,
        turboEvent: turboEvents[0],
      }
    }
  })

  const setSelectedTurboEvent = (turboEvent) => {
    selected = {
      type: SELECTABLE_TYPES.TURBO_EVENT,
      uuid: turboEvent.uuid,
      turboEvent: turboEvent,
    }
  }

  const scrollIntoView = debounce((element) => {
    element.scrollIntoView({ behavior: "smooth", block: "end" })
  }, 10)

  const handleEventListKeyboardNavigation = (event) => {
    if (!turboEvents.length) return

    const currentIndex = turboEvents.findIndex((e) => e.uuid === selected.uuid)
    const newIndex = handleKeyboardNavigation(event, turboEvents, currentIndex)
    setSelectedTurboEvent(turboEvents[newIndex])

    setTimeout(() => {
      const selectedRow = document.querySelector(".turbo-event-pane .entry-row.selected")
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }, 10)
  }

  const handlePaneResize = (event) => {
    const dimensions = event.detail.map((pane) => pane.size)
    devTool.saveOptions({
      logPaneDimensions: {
        events: dimensions[0],
        warnings: dimensions[1],
      },
    })
  }
</script>

<Splitpanes horizontal={$horizontalPanes} on:resized={handlePaneResize} dblClickSplitter={false}>
  <Pane class="turbo-event-pane full-pane" size={options.logPaneDimensions?.events || 50} minSize={20}>
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex flex-column h-100">
          <div class="d-flex justify-content-center">
            <h2>Events</h2>
          </div>
          <div class="scrollable-list">
            {#if turboEvents.length > 0}
              {#each turboEvents as event (event.uuid)}
                <div
                  {@attach scrollIntoView}
                  class="d-flex justify-content-between align-items-center cursor-pointer entry-row py-2"
                  class:selected={selected.type === SELECTABLE_TYPES.TURBO_EVENT && selected.turboEvent.uuid === event.uuid}
                  role="button"
                  tabindex="0"
                  onclick={() => setSelectedTurboEvent(event)}
                  onkeyup={handleEventListKeyboardNavigation}
                >
                  {event.eventName}
                </div>
              {/each}
            {:else}
              <div class="no-entry-hint">
                <span>No Turbo Events spotted yet</span>
                <span>We'll keep looking</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </Pane>

  <Pane class="turbo-detail-pane full-pane" size={options.turboPaneDimensions?.details || 50} minSize={20}>
    <div class="card h-100">
      <div class="card-body">
        {#if selected.type === SELECTABLE_TYPES.TURBO_EVENT && selected.uuid}
          <div class="d-flex flex-column h-100">
            <div class="d-flex justify-content-center">
              <h2 class="pe-4">#{selected.turboEvent.eventName}</h2>
            </div>

            <div class="scrollable-list flow">
              {#if selected.turboEvent.details}
                <div class="pane-section-heading">Details</div>
                <table class="table table-sm w-100 turbo-table">
                  <tbody>
                    {#each Object.entries(selected.turboEvent.details) as [key, value]}
                      <tr>
                        <td><div class="code-keyword">{key}</div></td>
                        <td>
                          {#if typeof value === "object" && value !== null}
                            <pre class="code-value">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          {:else}
                            {value}
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            </div>
          </div>
        {:else}
          <div class="no-entry-hint">
            <span>Nothing selected</span>
            <span>Select a Turbo Event to see its details</span>
            <div>selected.type: {selected.type}</div>
            <div>selected.uuid: {selected.uuid}</div>
            <div>matches condition: {selected.type === SELECTABLE_TYPES.TURBO_EVENT && selected.uuid ? "Yes" : "No"}</div>
            <div>selected.turboEvent: {selected.turboEvent ? "Exists" : "Missing"}</div>
            <div>selected.turboEvent?.details: {selected.turboEvent?.details ? "Exists" : "Missing"}</div>
            <pre>{JSON.stringify(selected, null, 2)}</pre>
          </div>
        {/if}
      </div>
    </div>
  </Pane>
</Splitpanes>
