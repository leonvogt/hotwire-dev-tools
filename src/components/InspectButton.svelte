<script>
  import IconButton from "$shoelace/IconButton.svelte"
  import { inspectElement } from "$utils/utils.js"

  let props = $props()
  let mergedClass = $derived(`fs-100 ${props.class ?? ""}`.trim())
</script>

<IconButton {...props} class={mergedClass} name="inspect" library="custom" onclick={() => inspectElement(props.selector)}></IconButton>
