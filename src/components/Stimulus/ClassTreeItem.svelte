<script>
  import CopyButton from "$components/CopyButton.svelte"

  let { klass } = $props()
</script>

<wa-tree>
  <wa-tree-item expanded>
    <span class="code-key">{klass.key}</span>
    {#if klass.classes.length === 0}
      <span class="text-muted">(0)</span>
    {:else}
      {#each klass.classes as value}
        <wa-tree-item class="w-100">
          <div class="entry-row w-100 d-flex justify-content-between align-items-center">
            <span class="class-value">{value}</span>
            <CopyButton {value} />
          </div>
        </wa-tree-item>
      {/each}
    {/if}
  </wa-tree-item>
</wa-tree>

<style>
  .class-value {
    color: var(--color-tag-class);
  }
</style>
