<script>
  import StripedHtmlTag from "$src/components/StripedHtmlTag.svelte"
  import InspectButton from "$components/InspectButton.svelte"

  let { outlet } = $props()
</script>

<wa-tree>
  <wa-tree-item>
    <span class="code-key">{outlet.key}</span>
    {#if outlet.elements.length === 0}
      <span class="text-muted">(no outlets)</span>
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
