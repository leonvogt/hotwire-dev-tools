<script>
  import IconButton from "$shoelace/IconButton.svelte"
  import { panelPostMessage } from "$src/browser_panel/messaging.js"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants.js"
  let props = $props()
  let mergedClass = $derived(`fs-400 ${props.class ?? ""}`.trim())

  const scrollAndHighlight = () => {
    let message = {
      action: PANEL_TO_BACKEND_MESSAGES.SCROLL_AND_HIGHLIGHT,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    }
    if (props.selector) {
      message.selector = props.selector
    } else if (props.elementPath) {
      message.elementPath = props.elementPath
    }
    panelPostMessage(message)
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
