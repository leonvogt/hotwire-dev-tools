<script>
  import StripedHtmlTag from "$src/components/StripedHtmlTag.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import { addHighlightOverlay, hideHighlightOverlay } from "$src/browser_panel/messaging"
  import { selectorByUUID } from "$utils/utils.js"

  let { outlet } = $props()
</script>

<div class="entry-row">
  <div class="d-flex align-items-center">
    <strong>{outlet.key}</strong>
    {#if outlet.elements.length === 0}
      <small class="text-muted ms-2" id={`outlet-empty-${outlet.key}`}>(0)</small>
      <wa-tooltip for={`outlet-empty-${outlet.key}`}>No matching outlet elements found on the page</wa-tooltip>
    {/if}
  </div>
</div>
{#each outlet.elements as element}
  <div class="entry-row detail-sub-row" role="button" tabindex="0" onmouseenter={() => addHighlightOverlay(selectorByUUID(element.uuid))} onmouseleave={() => hideHighlightOverlay()}>
    <div class="d-flex justify-content-between align-items-center">
      <StripedHtmlTag {element} />
      <InspectButton class="btn-hoverable" uuid={element.uuid}></InspectButton>
    </div>
  </div>
{/each}
