<script>
  import CopyButton from "$components/CopyButton.svelte"
  import HTMLRenderer from "$src/browser_panel/HTMLRenderer.svelte"
  import ScrollIntoViewButton from "$components/ScrollIntoViewButton.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import { capitalizeFirstChar, selectorByUUID } from "$utils/utils.js"

  let { target, selected } = $props()
</script>

<div class="d-flex gap-2 mb-2">
  <wa-tree>
    <wa-tree-item>
      <span class="code-key">{target.key}</span>
      {#if target.elements.length === 0}
        <span class="text-muted">(no targets)</span>
      {:else}
        {#each target.elements as element}
          <wa-tree-item>
            <div>
              <HTMLRenderer htmlString={element.serializedTag} />
              <ScrollIntoViewButton selector={selectorByUUID(element.uuid)}></ScrollIntoViewButton>
              <InspectButton selector={selectorByUUID(element.uuid)}></InspectButton>
            </div>
          </wa-tree-item>
        {/each}
      {/if}
      <wa-button id={`rich-tooltip-${target.key}`} variant="neutral" appearance="plain" size="small" class="small-icon-button">
        <wa-icon name="info" label="Info"></wa-icon>
      </wa-button>
    </wa-tree-item>
  </wa-tree>

  <wa-tooltip for={`rich-tooltip-${target.key}`} trigger="click" style="--max-width: 100%;">
    <div>
      <div class="d-flex justify-content-between align-items-center">
        <span>{`${selected.controller.targetsAttribute}=${target.key}`}</span>
        <CopyButton value={`data-${selected.identifier}-${target.key}`} />
      </div>
    </div>
  </wa-tooltip>
</div>
