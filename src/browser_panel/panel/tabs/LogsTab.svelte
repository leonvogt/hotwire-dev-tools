<script>
  import { Pane, Splitpanes } from "svelte-splitpanes"

  import { TURBO_EVENTS, TURBO_EVENTS_GROUPED } from "$lib/constants.js"
  import { addHighlightOverlayByPath, hideHighlightOverlay } from "../../messaging.js"
  import { getTurboEvents, clearTurboEvents } from "../../State.svelte.js"
  import { debounce, handleKeyboardNavigation } from "$utils/utils.js"
  import { horizontalPanes } from "../../theme.svelte.js"
  import { getDevtoolInstance } from "$lib/devtool.js"

  import IconButton from "$uikit/IconButton.svelte"
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
  let turboEventsFilter = $state([...TURBO_EVENTS])

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
    event.preventDefault() // Prevents automatic browser scrolling

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
      turboEventsFilter = TURBO_EVENTS
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
    const events = TURBO_EVENTS_GROUPED[groupName]
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

  const preventDropdownClose = (dropdown) => {
    dropdown?.addEventListener("wa-select", (event) => {
      event.preventDefault()
    })
  }
</script>

<Splitpanes horizontal={$horizontalPanes} on:resized={handlePaneResize} dblClickSplitter={false}>
  <Pane class="turbo-event-pane full-pane" size={options.logPaneDimensions?.events || 50} minSize={20}>
    <div class="pane-container">
      <div class="pane-header flex-center">
        <h3 class="pane-header-title">Events</h3>
        <div class="position-absolute end-0">
          <wa-dropdown class="mb-2" use:preventDropdownClose>
            <wa-button slot="trigger" class="small-icon-button" variant="neutral" appearance="plain">
              <wa-icon name="filter" label="filter"></wa-icon>
            </wa-button>
            {#each Object.entries(TURBO_EVENTS_GROUPED) as [groupName, events]}
              <wa-dropdown-item role="button" tabindex="0" onkeyup={() => handleFilterGroupToggle(groupName)} onclick={() => handleFilterGroupToggle(groupName)}>
                <strong>{groupName}</strong>
              </wa-dropdown-item>

              {#each events as event}
                <wa-dropdown-item
                  class="turbo-event-menu-item"
                  type="checkbox"
                  role="button"
                  tabindex="0"
                  onkeyup={(e) => handleFilterToggle(e)}
                  onclick={(e) => handleFilterToggle(e)}
                  value={event}
                  checked={turboEventsFilter.includes(event)}>{event}</wa-dropdown-item
                >
              {/each}
            {/each}
          </wa-dropdown>
          {#if turboEvents.length > 0}
            <IconButton name="trash2" onclick={clearTurboEvents}></IconButton>
          {/if}
        </div>
      </div>

      {#if turboEvents.length > 0}
        <div class="scrollable-list overflow-x-hidden">
          {#each turboEvents as event (event.uuid)}
            <div
              {@attach scrollIntoView}
              class="entry-row entry-row--table-layout p-1 cursor-pointer turbo-event-entry-row"
              class:selected={selected.type === SELECTABLE_TYPES.TURBO_EVENT && selected.turboEvent.uuid === event.uuid}
              class:d-none={!turboEventsFilter.includes(event.eventName)}
              role="button"
              tabindex="0"
              onclick={() => setSelectedTurboEvent(event)}
              onkeydown={handleEventListKeyboardNavigation}
              onmouseenter={() => addHighlightOverlayByPath(event.targetElementPath)}
              onmouseleave={() => hideHighlightOverlay()}
            >
              <div class="d-table-row">
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
        </div>
      {:else}
        <div class="no-entry-hint">
          <span>No Turbo Events spotted yet</span>
          <span>We'll keep looking</span>
        </div>
      {/if}
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

    <div class="pane-container">
      {#if selected.type === SELECTABLE_TYPES.TURBO_EVENT && selected.uuid}
        <div class="pane-header flex-center">
          <h3 class="pane-header-title">
            <span>Event</span>
            <div class="code-keyword">{selected.turboEvent.eventName}</div>
          </h3>
        </div>

        <div class="scrollable-list">
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

              {#if selected.turboEvent.targetElementPath}
                <tr>
                  <td>Target</td>
                  <td>
                    <div class="d-flex justify-content-between align-items-center">
                      <span><HTMLRenderer htmlString={selected.turboEvent.serializedTargetTag} /></span>
                      <div>
                        <ScrollIntoViewButton elementPath={selected.turboEvent.targetElementPath}></ScrollIntoViewButton>
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
      {:else}
        <div class="pane-header"></div>
        <div class="no-entry-hint">
          <span>Nothing selected</span>
          <span>Select a Turbo Event to see its details</span>
        </div>
      {/if}
    </div>
  </Pane>
</Splitpanes>

<style>
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
