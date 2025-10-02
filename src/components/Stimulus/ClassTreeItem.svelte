<script>
  import CopyButton from "$components/CopyButton.svelte"

  let { klass, selected } = $props()
</script>

<div class="d-flex gap-2 mb-2">
  <wa-tree>
    <wa-tree-item expanded>
      <span class="code-key">{klass.key}</span>
      {#if klass.classes.length === 0}
        <span class="text-muted">(0)</span>
      {:else}
        {#each klass.classes as value}
          <wa-tree-item>
            <div class="d-flex justify-content-between align-items-center">
              <span>{value}</span>
              <CopyButton {value} />
            </div>
          </wa-tree-item>
        {/each}
      {/if}
      <wa-button id={`rich-tooltip-${klass.key}`} variant="neutral" appearance="plain" size="small" class="small-icon-button">
        <wa-icon name="info" label="Info"></wa-icon>
      </wa-button>
    </wa-tree-item>
  </wa-tree>

  <wa-tooltip for={`rich-tooltip-${klass.key}`} trigger="click" style="--max-width: 100%;">
    <div>
      <div class="d-flex justify-content-between align-items-center">
        <span>{klass.htmlAttribute}</span>
        <CopyButton value={klass.htmlAttribute} />
      </div>
    </div>
  </wa-tooltip>
</div>
