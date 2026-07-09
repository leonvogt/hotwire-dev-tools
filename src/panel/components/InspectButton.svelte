<script>
  import IconButton from "$uikit/IconButton.svelte"
  import { inspectElement, inspectElementByPath, selectorByUUID } from "$utils/utils.js"

  let { selector, elementPath, uuid, class: className, ...restProps } = $props()

  let mergedClass = $derived(`fs-400 ${className ?? ""}`.trim())
  let mergedSelector = $derived(uuid ? selectorByUUID(uuid) : selector)

  const inspect = () => {
    if (mergedSelector) {
      inspectElement(mergedSelector)
    } else if (elementPath) {
      inspectElementByPath(elementPath)
    }
  }
</script>

<IconButton {...restProps} class={mergedClass} name="inspect" library="custom" onclick={inspect}></IconButton>
