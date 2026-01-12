<script>
  import StripedHtmlTag from "$src/components/StripedHtmlTag.svelte"
  import InspectButton from "$components/InspectButton.svelte"

  let { outlet } = $props()
</script>

<wa-tree class="stimulus-outlet-tree">
  <wa-tree-item expanded>
    <span>{outlet.key}</span>
    {#if outlet.elements.length === 0}
      <small class="text-muted ms-2">(0)</small>
    {:else}
      {#each outlet.elements as element}
        <wa-tree-item class="w-100">
          <div class="entry-row w-100 d-flex justify-content-between">
            <StripedHtmlTag {element} />
            <InspectButton class="btn-hoverable" uuid={element.uuid}></InspectButton>
          </div>
        </wa-tree-item>
      {/each}
    {/if}
  </wa-tree-item>
</wa-tree>
