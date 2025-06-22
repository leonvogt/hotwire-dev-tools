<script>
  import IconButton from "$shoelace/IconButton.svelte"
  import { panelPostMessage } from "$src/browser_panel/messaging.js"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants.js"
  let props = $props()
  let mergedClass = $derived(`fs-400 ${props.class ?? ""}`.trim())

  const scrollAndHighlight = () => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.SCROLL_AND_HIGHLIGHT,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
      selector: props.selector,
    })
  }
</script>

<sl-tooltip content="Scroll into view">
  <IconButton
    {...props}
    class={mergedClass}
    name="eye-fill"
    onclick={() => {
      scrollAndHighlight()
    }}
  ></IconButton>
</sl-tooltip>
