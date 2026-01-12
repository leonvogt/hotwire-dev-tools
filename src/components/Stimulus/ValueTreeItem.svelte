<script>
  import ValueEditor from "./ValueEditor.svelte"
  import NestedValue from "./NestedValue.svelte"
  import CopyButton from "$components/CopyButton.svelte"
  import { updateDataAttribute } from "../../browser_panel/messaging"
  import { capitalizeFirstChar, selectorByUUID } from "$utils/utils.js"

  let { valueObject, selected, dataAttribute } = $props()

  let editingStates = $state({})

  const isComplex = (val) => typeof val === "object" && val !== null
  const isArray = (val) => Array.isArray(val)

  // Deep set value in nested object/array using path array
  const setNestedValue = (obj, path, value) => {
    if (path.length === 0) return value

    const newObj = JSON.parse(JSON.stringify(obj))
    let current = newObj

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }

    // Try to parse as number, boolean, or keep as string
    let parsedValue = value
    if (value === "true") parsedValue = true
    else if (value === "false") parsedValue = false
    else if (value === "null") parsedValue = null
    else if (!isNaN(value) && value !== "") parsedValue = Number(value)

    current[path[path.length - 1]] = parsedValue

    return newObj
  }

  const serializeValue = (value, type) => {
    // For Array and Object types, Stimulus expects JSON
    if (type === "array" || type === "object") {
      return JSON.stringify(value)
    }

    // For other types, convert to string
    return String(value)
  }

  const handleSave = (path, newValue) => {
    let updatedValue

    if (isComplex(valueObject.value)) {
      updatedValue = setNestedValue(valueObject.value, path, newValue)
    } else {
      // For primitive values at root level
      if (valueObject.type === "Number") {
        updatedValue = Number(newValue)
      } else if (valueObject.type === "Boolean") {
        updatedValue = newValue === "true" || newValue === true
      } else {
        updatedValue = newValue
      }
    }

    const serializedValue = serializeValue(updatedValue, valueObject.type)

    updateDataAttribute(selectorByUUID(selected.uuid), dataAttribute, serializedValue)

    editingStates[path.join(".")] = false
  }

  const handleEdit = (path) => {
    editingStates[path.join(".")] = true
  }

  const handleCancel = (path) => {
    editingStates[path.join(".")] = false
  }
</script>

<div class="d-flex gap-2 mb-2 stimulus-value-tree-item">
  <wa-tree class="w-100">
    <wa-tree-item class="w-100" expanded>
      {#if isComplex(valueObject.value)}
        {valueObject.name}
        {#if isArray(valueObject.value)}
          <span class="text-muted ms-1">Array ({valueObject.value.length})</span>
        {/if}
        <NestedValue data={valueObject.value} {editingStates} onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} />
      {:else}
        <div class="stimulus-value-editor-wrapper">
          <span class="code-key">{valueObject.name}:</span>
          <ValueEditor
            value={String(valueObject.value)}
            valueType={valueObject.type}
            isEditing={editingStates["root"] || false}
            onEdit={() => handleEdit(["root"])}
            onSave={(newVal) => handleSave(["root"], newVal)}
            onCancel={() => handleCancel(["root"])}
          />
        </div>
      {/if}
      {#if valueObject.value === valueObject.defaultValue}
        <wa-badge variant="neutral" appearance="outlined" size="small">DEFAULT</wa-badge>
      {/if}
      <wa-button id={`rich-tooltip-${valueObject.key}`} variant="neutral" appearance="plain" size="small" class="small-icon-button info-button">
        <wa-icon name="info" label="Info"></wa-icon>
      </wa-button>
    </wa-tree-item>
  </wa-tree>

  <wa-tooltip for={`rich-tooltip-${valueObject.key}`} trigger="click" style="--max-width: 100%;">
    <div>
      <div class="flex-center">Type: {valueObject.type}</div>
      <div class="flex-center">Default: {valueObject.defaultValue}</div>
      <div class="d-flex justify-content-between align-items-center">
        <span>{dataAttribute}</span>
        <CopyButton value={dataAttribute} />
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <span>{`this.${valueObject.name}`}</span>
        <CopyButton value={`this.${valueObject.name}`} />
      </div>
      <div class="d-flex justify-content-between align-items-center">
        <span>{`this.has${capitalizeFirstChar(valueObject.name)}`}</span>
        <CopyButton value={`this.has${capitalizeFirstChar(valueObject.name)}`} />
      </div>
    </div>
  </wa-tooltip>
</div>

<style>
  wa-tree {
    margin-right: 2rem;
  }

  wa-badge {
    height: 1rem;
    padding: 0.7em 0.4em;
    font-size: 0.7rem;
  }

  wa-button.info-button {
    margin-bottom: 0.15rem;
    margin-left: auto;
  }
</style>
