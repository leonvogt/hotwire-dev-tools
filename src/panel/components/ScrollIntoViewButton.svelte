<script>
  import IconButton from "$uikit/IconButton.svelte"
  import { panelPostMessage } from "$panel/messaging.js"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE, PANEL_TO_BACKEND_MESSAGES } from "$lib/constants.js"
  import { selectorByUUID } from "$utils/utils.js"

  let { selector, elementPath, uuid, class: className, id, ...restProps } = $props()

  let mergedClass = $derived(`fs-400 ${className ?? ""}`.trim())
  const fallbackId = `scroll-into-view-button-${crypto.randomUUID()}`
  let buttonId = $derived(id ?? fallbackId)
  let mergedSelector = $derived(uuid ? selectorByUUID(uuid) : selector)

  const scrollAndHighlight = () => {
    let message = {
      action: PANEL_TO_BACKEND_MESSAGES.SCROLL_AND_HIGHLIGHT,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    }
    if (mergedSelector) {
      message.selector = mergedSelector
    } else if (elementPath) {
      message.elementPath = elementPath
    }
    panelPostMessage(message)
  }
</script>

<wa-tooltip for={buttonId}>Scroll into view</wa-tooltip>
<IconButton
  {...restProps}
  class={mergedClass}
  id={buttonId}
  name="eye"
  onclick={() => {
    scrollAndHighlight()
  }}
></IconButton>
