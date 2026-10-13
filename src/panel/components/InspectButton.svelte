<script>
  import IconButton from "$uikit/IconButton.svelte"
  import { inspectElement, inspectElementByPath, inspectElementByUUID } from "$utils/utils.js"

  let { selector, elementPath, uuid, class: className, ...restProps } = $props()

  let mergedClass = $derived(`fs-400 ${className ?? ""}`.trim())

  const inspect = () => {
    if (uuid) {
      inspectElementByUUID(uuid)
    } else if (selector) {
      inspectElement(selector)
    } else if (elementPath) {
      inspectElementByPath(elementPath)
    }
  }
</script>

<IconButton {...restProps} class={mergedClass} name="inspect" library="custom" onclick={inspect}></IconButton>
