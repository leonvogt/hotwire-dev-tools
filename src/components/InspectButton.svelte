<script>
  import SlIconButton from "$shoelace/SLIconButton.svelte"
  import { inspectElement } from "$utils/utils.js"

  let props = $props()
  let mergedClass = $derived(`fs-100 ${props.class ?? ""}`.trim())
</script>

<SlIconButton {...props} class={mergedClass} name="inspect" library="custom" onclick={() => inspectElement(props.selector)}></SlIconButton>
