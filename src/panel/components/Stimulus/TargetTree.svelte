<script>
  import InspectButton from "$components/InspectButton.svelte"
  import StripedHtmlTag from "$components/StripedHtmlTag.svelte"
  import { addHighlightOverlayByUUID, hideHighlightOverlay } from "$panel/messaging"

  let { target } = $props()
</script>

<div class="entry-row">
  <div class="d-flex align-items-center">
    <strong>{target.key}</strong>
    {#if target.elements.length === 0}
      <small class="text-muted ms-2" id={`target-empty-${target.key}`}>(0)</small>
      <wa-tooltip for={`target-empty-${target.key}`}>No matching target elements found on the page</wa-tooltip>
    {/if}
  </div>
</div>
{#each target.elements as element}
  <div class="entry-row detail-sub-row" role="button" tabindex="0" onmouseenter={() => addHighlightOverlayByUUID(element.uuid)} onmouseleave={() => hideHighlightOverlay()}>
    <div class="d-flex justify-content-between align-items-center">
      <StripedHtmlTag {element} />
      <InspectButton class="btn-hoverable" uuid={element.uuid}></InspectButton>
    </div>
  </div>
{/each}
