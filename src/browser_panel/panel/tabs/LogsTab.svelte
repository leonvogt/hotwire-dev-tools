<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"

  import { getTurboEvents, clearTurboEvents } from "../../State.svelte.js"
  import { debounce, handleKeyboardNavigation } from "$utils/utils.js"
  import { getDevtoolInstance } from "$lib/devtool.js"
  import { horizontalPanes } from "../../theme.svelte.js"
  import { MONITORING_EVENTS, MONITORING_EVENT_GROUPS } from "$lib/constants.js"

  import IconButton from "$shoelace/IconButton.svelte"
  import CopyButton from "$components/CopyButton.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import ScrollIntoViewButton from "$components/ScrollIntoViewButton.svelte"
  import HTMLRenderer from "$src/browser_panel/HTMLRenderer.svelte"

  const SELECTABLE_TYPES = {
    TURBO_EVENT: "turbo-event",
  }
  const EVENT_TIMESTAMP_KEYS = ["requestEnd", "requestStart", "visitEnd", "visitStart"]

  const devTool = getDevtoolInstance()
  let options = $state(devTool.options)
  let turboEventsFilter = $state([...MONITORING_EVENTS])

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

  const handleFilterToggle = (event) => {
    const { value } = event.target
    if (value === "all") {
      turboEventsFilter = MONITORING_EVENTS
    } else {
      const isActive = turboEventsFilter.includes(value)
      if (isActive) {
        turboEventsFilter = turboEventsFilter.filter((e) => e !== value)
      } else {
        turboEventsFilter.push(value)
      }
    }
  }

  const handleFilterGroupToggle = (groupName) => {
    const events = MONITORING_EVENT_GROUPS[groupName]
    const isActive = events.every((e) => turboEventsFilter.includes(e))

    if (isActive) {
      turboEventsFilter = turboEventsFilter.filter((e) => !events.includes(e))
    } else {
      turboEventsFilter = [...new Set([...turboEventsFilter, ...events])]
    }
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
          <div class="d-flex justify-content-center align-items-center position-relative">
            <h2>Events</h2>
            <div class="position-absolute end-0">
              <sl-dropdown stayOpenOnSelect={true} class="mb-2">
                <sl-button slot="trigger" caret>
                  <sl-icon name="funnel"></sl-icon>
                </sl-button>
                <sl-menu>
                  {#each Object.entries(MONITORING_EVENT_GROUPS) as [groupName, events]}
                    <sl-menu-item role="button" tabindex="0" onkeyup={() => handleFilterGroupToggle(groupName)} onclick={() => handleFilterGroupToggle(groupName)}>
                      <strong>{groupName}</strong>
                    </sl-menu-item>

                    {#each events as event}
                      <sl-menu-item
                        class="turbo-event-menu-item"
                        type="checkbox"
                        role="button"
                        tabindex="0"
                        onkeyup={(e) => handleFilterToggle(e)}
                        onclick={(e) => handleFilterToggle(e)}
                        value={event}
                        checked={turboEventsFilter.includes(event)}>{event}</sl-menu-item
                      >
                    {/each}
                  {/each}
                </sl-menu>
              </sl-dropdown>
              {#if turboEvents.length > 0}
                <IconButton name="trash2" onclick={clearTurboEvents}></IconButton>
              {/if}
            </div>
          </div>

          <div class="scrollable-list overflow-x-hidden">
            {#if turboEvents.length > 0}
              {#each turboEvents as event (event.uuid)}
                <div
                  {@attach scrollIntoView}
                  class="entry-row entry-row--table-layout p-1 cursor-pointer turbo-event-entry-row"
                  class:selected={selected.type === SELECTABLE_TYPES.TURBO_EVENT && selected.turboEvent.uuid === event.uuid}
                  class:d-none={!turboEventsFilter.includes(event.eventName)}
                  role="button"
                  tabindex="0"
                  onclick={() => setSelectedTurboEvent(event)}
                  onkeyup={handleEventListKeyboardNavigation}
                >
                  <div class="turbo-event-entry-wrapper">
                    <div class="turbo-event-first-column">
                      <strong>{event.eventName}</strong>
                    </div>

                    <div class="turbo-event-second-column">
                      <div class="me-3">{event.time}</div>
                      <div class="me-3 overflow-x-auto scrollbar-none"><HTMLRenderer htmlString={event.serializedTargetTag} /></div>
                    </div>
                  </div>
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
    {#snippet valueViewer(value, key = null)}
      {#if typeof value === "object" && value !== null}
        {#if Array.isArray(value)}
          {#each value as item, i}
            <p class="m-0">
              <strong>{i}</strong>: {@render valueViewer(item)}
            </p>
          {/each}
        {:else}
          {#each Object.entries(value) as [k, v]}
            <p class="m-0">
              <strong>{k}</strong>: {@render valueViewer(v, k)}
            </p>
          {/each}
        {/if}
      {:else if EVENT_TIMESTAMP_KEYS.includes(key)}
        <span>{new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
      {:else}
        <span>{String(value)}</span>
      {/if}
    {/snippet}

    <div class="card h-100">
      <div class="card-body">
        {#if selected.type === SELECTABLE_TYPES.TURBO_EVENT && selected.uuid}
          <div class="d-flex flex-column h-100">
            <div class="d-flex justify-content-center">
              <h2 class="pe-4 d-flex align-items-center gap-2">
                <span>Event</span>
                <div class="code-keyword">{selected.turboEvent.eventName}</div>
              </h2>
            </div>

            <div class="scrollable-list flow">
              {#if selected.turboEvent.eventName === "turbo:before-stream-render"}
                <div class="d-flex justify-content-end">
                  <CopyButton value={selected.turboEvent.turboStreamContent} />
                </div>
                <div class="html-preview">
                  <pre><code class="language-html"><HTMLRenderer htmlString={selected.turboEvent.turboStreamContent} /></code></pre>
                </div>
              {/if}

              <table class="table table-sm w-100 turbo-events-table">
                <tbody>
                  {#if selected.turboEvent.action}
                    <tr>
                      <td><div class="code-keyword">action</div></td>
                      <td>{selected.turboEvent.action}</td>
                    </tr>
                  {/if}

                  {#if selected.turboEvent.targetSelector}
                    <tr>
                      <td>Target</td>
                      <td>
                        <div class="d-flex justify-content-between align-items-center">
                          <span>{selected.turboEvent.targetSelector}</span>
                          <div>
                            <ScrollIntoViewButton selector={selected.turboEvent.targetSelector}></ScrollIntoViewButton>
                            <InspectButton selector={selected.turboEvent.targetSelector}></InspectButton>
                          </div>
                        </div>
                      </td>
                    </tr>
                  {:else}
                    <tr>
                      <td>Target</td>
                      <td><HTMLRenderer htmlString={selected.turboEvent.serializedTargetTag} /></td>
                    </tr>
                  {/if}

                  {#if selected.turboEvent.details}
                    {#each Object.entries(selected.turboEvent.details) as [key, value]}
                      <tr>
                        <td><div class="code-keyword">{key}</div></td>
                        <td>{@render valueViewer(value)}</td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
          </div>
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

  .turbo-cable-icon {
    padding: var(--sl-spacing-3x-small);
  }
</style>
