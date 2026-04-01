<script>
  import CopyButton from "$components/CopyButton.svelte"

  let { klass } = $props()
</script>

<div class="entry-row">
  <div class="d-flex align-items-center">
    <strong>{klass.key}</strong>
    {#if klass.classes.length === 0}
      <small class="text-muted ms-2" id={`class-empty-${klass.key}`}>(0)</small>
      <wa-tooltip for={`class-empty-${klass.key}`}>No matching classes found</wa-tooltip>
    {/if}
  </div>
</div>
{#each klass.classes as value}
  <div class="entry-row detail-sub-row">
    <div class="d-flex justify-content-between align-items-center">
      <span class="class-value">{value}</span>
      <CopyButton {value} />
    </div>
  </div>
{/each}

<style>
  .class-value {
    color: var(--color-tag-class);
  }
</style>
