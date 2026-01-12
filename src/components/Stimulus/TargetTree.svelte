<script>
  import InspectButton from "$components/InspectButton.svelte"
  import StripedHtmlTag from "$src/components/StripedHtmlTag.svelte"
  import { addHighlightOverlay, hideHighlightOverlay } from "$src/browser_panel/messaging"
  import { selectorByUUID } from "$utils/utils.js"

  let { target } = $props()
</script>

<wa-tree class="w-100 stimulus-target-tree">
  <wa-tree-item expanded>
    <span>{target.key}</span>
    {#if target.elements.length === 0}
      <small class="text-muted ms-2">(0)</small>
    {:else}
      {#each target.elements as element}
        <wa-tree-item class="w-100" role="button" tabindex="0" onmouseenter={() => addHighlightOverlay(selectorByUUID(element.uuid))} onmouseleave={() => hideHighlightOverlay()}>
          <div class="entry-row w-100 d-flex justify-content-between">
            <StripedHtmlTag {element} />
            <InspectButton class="btn-hoverable" uuid={element.uuid}></InspectButton>
          </div>
        </wa-tree-item>
      {/each}
    {/if}
  </wa-tree-item>
</wa-tree>
