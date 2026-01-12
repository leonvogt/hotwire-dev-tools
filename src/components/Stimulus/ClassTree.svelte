<script>
  import CopyButton from "$components/CopyButton.svelte"

  let { klass } = $props()
</script>

<wa-tree class="stimulus-classes-tree">
  <wa-tree-item expanded>
    <span>{klass.key}</span>
    {#if klass.classes.length === 0}
      <small class="text-muted ms-2">(0)</small>
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
