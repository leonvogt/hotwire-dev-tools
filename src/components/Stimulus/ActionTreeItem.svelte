<script>
  import CopyButton from "$components/CopyButton.svelte"

  let { action, selected } = $props()
</script>

<div class="entry-row">
  <div class="d-flex justify-content-between align-items-center py-2">
    <div class="d-flex flex-column">
      <div class="d-flex align-items-center">
        <span class="code-keyword me-2">{action.methodName}()</span>
        <span class="badge bg-secondary me-2">{action.eventName}</span>
        {#if action.keyFilter}
          <span class="badge bg-info me-2">{action.keyFilter}</span>
        {/if}
      </div>
      <div class="mt-1">
        <span class="text-muted small">on {action.element.tagName}</span>
        {#if action.element.id}
          <span class="text-muted small">#{action.element.id}</span>
        {/if}
        {#if action.element.classes.length > 0}
          <span class="text-muted small">.{action.element.classes.join(".")}</span>
        {/if}
      </div>
      {#if action.hasParams}
        <div class="mt-1">
          <span class="text-muted small">Params:</span>
          {#each Object.entries(action.params) as [key, value]}
            <span class="badge bg-warning me-1">{key}="{value}"</span>
          {/each}
        </div>
      {/if}
    </div>
    <div>
      <CopyButton value={action.descriptor} />
    </div>
  </div>
</div>
