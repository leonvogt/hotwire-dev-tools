<script>
  import StripedHtmlTag from "$src/components/StripedHtmlTag.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import { addHighlightOverlay, hideHighlightOverlay } from "$src/browser_panel/messaging"
  import { selectorByUUID } from "$utils/utils.js"

  let { action } = $props()
</script>

<div class="entry-row" role="button" tabindex="0" onmouseenter={() => addHighlightOverlay(selectorByUUID(action.element.uuid))} onmouseleave={() => hideHighlightOverlay()}>
  <div class="d-flex justify-content-between align-items-center py-2">
    <div class="d-flex flex-column">
      <div class="d-flex align-items-center gap-2">
        <strong>
          {#if action.keyFilter}
            {`${action.eventName}.${action.keyFilter}`}
          {:else}
            {action.eventName}
          {/if}
        </strong>
        <wa-icon name="arrow-right"></wa-icon>
        <span class="code-keyword me-2">{action.methodName}()</span>
      </div>
      <div class="mt-1">
        <StripedHtmlTag element={action.element} />
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
      <InspectButton class="btn-hoverable" uuid={action.element.uuid}></InspectButton>
    </div>
  </div>
</div>
