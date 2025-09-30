<script>
  import ValueEditor from "./ValueEditor.svelte"
  import CopyButton from "$components/CopyButton.svelte"
  import { updateDataAttribute } from "../../browser_panel/messaging"

  let { valueObject, selected, dataAttribute } = $props()

  let editingStates = $state({})

  const isObject = typeof valueObject.value === "object" && valueObject.value !== null

  const handleSave = (key, newValue) => {
    if (isObject) {
      const updatedObject = { ...valueObject.value, [key]: newValue }
      updateDataAttribute(`[data-hotwire-dev-tools-uuid="${selected.uuid}"]`, dataAttribute, JSON.stringify(updatedObject))
    } else {
      updateDataAttribute(`[data-hotwire-dev-tools-uuid="${selected.uuid}"]`, dataAttribute, newValue)
    }
    editingStates[key || "main"] = false
  }

  const handleEdit = (key) => {
    editingStates[key || "main"] = true
  }

  const handleCancel = (key) => {
    editingStates[key || "main"] = false
  }
</script>

<div class="d-flex gap-2 mb-2">
  <wa-tree>
    <wa-tree-item expanded>
      {#if isObject}
        {valueObject.name}
        {#each Object.entries(valueObject.value) as [key, value]}
          <wa-tree-item>
            <div class="d-flex code-value">
              <span class="code-key">{key}:</span>
              <ValueEditor {value} isEditing={editingStates[key] || false} onEdit={() => handleEdit(key)} onSave={(newVal) => handleSave(key, newVal)} onCancel={() => handleCancel(key)} />
            </div>
          </wa-tree-item>
        {/each}
      {:else}
        <span class="code-key">{valueObject.name}:</span>
        <div class="d-flex code-value">
          <ValueEditor value={valueObject.value} isEditing={editingStates["main"] || false} onEdit={() => handleEdit(null)} onSave={(newVal) => handleSave(null, newVal)} onCancel={() => handleCancel(null)} />
        </div>
      {/if}
    </wa-tree-item>
  </wa-tree>

  <wa-button id={`rich-tooltip-${valueObject.key}`} variant="neutral" appearance="plain" size="small" class="small-icon-button" class:d-none={Object.values(editingStates).some(Boolean)}>
    <wa-icon name="info" label="Info"></wa-icon>
  </wa-button>

  <wa-tooltip for={`rich-tooltip-${valueObject.key}`} trigger="click" style="--max-width: 100%;">
    <div>
      <div class="flex-center">Type: {valueObject.type}</div>
      <div class="d-flex justify-content-between align-items-center">
        <span>{dataAttribute}</span>
        <CopyButton value={dataAttribute} />
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <span>{`this.${valueObject.name}`}</span>
        <CopyButton value={`this.${valueObject.name}`} />
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <span>{`this.${valueObject.name}s`}</span>
        <CopyButton value={`this.${valueObject.name}s`} />
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <span>{`this.has${valueObject.name[0].toUpperCase() + valueObject.name.slice(1)}`}</span>
        <CopyButton value={`this.has${valueObject.name[0].toUpperCase() + valueObject.name.slice(1)}`} />
      </div>
    </div>
  </wa-tooltip>
</div>
