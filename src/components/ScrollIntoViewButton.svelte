<script>
  import IconButton from "$uikit/IconButton.svelte"
  import { panelPostMessage } from "$src/browser_panel/messaging.js"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants.js"
  let props = $props()
  let mergedClass = $derived(`fs-400 ${props.class ?? ""}`.trim())
  let id = props.id ?? `scroll-into-view-button-${crypto.randomUUID()}`

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

<wa-tooltip for={id}>Scroll into view</wa-tooltip>
<IconButton
  {...props}
  class={mergedClass}
  {id}
  name="eye"
  onclick={() => {
    scrollAndHighlight()
  }}
></IconButton>
