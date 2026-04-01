<script>
  import ValueEditor from "./ValueEditor.svelte"
  import NestedValue from "./NestedValue.svelte"
  import CopyButton from "$components/CopyButton.svelte"
  import IconButton from "$uikit/IconButton.svelte"
  import { updateDataAttribute } from "$panel/messaging"
  import { capitalizeFirstChar, selectorByUUID } from "$utils/utils.js"

  let { valueObject, selected, dataAttribute } = $props()

  let editingStates = $state({})
  let expanded = $state(true)

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
      if (valueObject.type.toLowerCase() === "number") {
        updatedValue = Number(newValue)
      } else if (valueObject.type.toLowerCase() === "boolean") {
        updatedValue = newValue === "true" || newValue === true
      } else {
        updatedValue = newValue
      }
    }

    const serializedValue = serializeValue(updatedValue, valueObject.type.toLowerCase())

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

{#if isComplex(valueObject.value)}
  <div class="entry-row">
    <div class="d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <IconButton class="collapse-icon {expanded ? '' : 'rotated'}" name="chevron-down" onclick={() => (expanded = !expanded)}></IconButton>
        <strong>{valueObject.name}</strong>
        {#if isArray(valueObject.value)}
          <span class="text-muted ms-1">Array ({valueObject.value.length})</span>
        {/if}
      </div>
      <div class="d-flex align-items-center">
        {#if valueObject.value === valueObject.defaultValue}
          <wa-badge id={`rich-tooltip-${valueObject.key}-default-value`} variant="neutral" appearance="outlined" size="small">DEFAULT</wa-badge>
        {/if}
        <wa-button id={`rich-tooltip-${valueObject.key}`} variant="neutral" appearance="plain" size="small" class="small-icon-button info-button">
          <wa-icon name="info" label="Info"></wa-icon>
        </wa-button>
      </div>
    </div>
  </div>
  {#if expanded}
    <NestedValue data={valueObject.value} {editingStates} onEdit={handleEdit} onSave={handleSave} onCancel={handleCancel} />
  {/if}
{:else}
  <div class="entry-row">
    <div class="d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2 stimulus-value-editor-wrapper">
        <strong>{valueObject.name}:</strong>
        <ValueEditor
          value={valueObject.type.toLowerCase() === "boolean" ? valueObject.value : String(valueObject.value)}
          valueType={valueObject.type.toLowerCase()}
          isEditing={editingStates["root"] || false}
          onEdit={() => handleEdit(["root"])}
          onSave={(newVal) => handleSave(["root"], newVal)}
          onCancel={() => handleCancel(["root"])}
        />
      </div>
      <div class="d-flex align-items-center">
        {#if valueObject.value === valueObject.defaultValue}
          <wa-badge id={`rich-tooltip-${valueObject.key}-default-value`} variant="neutral" appearance="outlined" size="small">DEFAULT</wa-badge>
        {/if}
        <wa-button id={`rich-tooltip-${valueObject.key}`} variant="neutral" appearance="plain" size="small" class="small-icon-button info-button">
          <wa-icon name="info" label="Info"></wa-icon>
        </wa-button>
      </div>
    </div>
  </div>
{/if}

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
      <span>{`this.has${capitalizeFirstChar(valueObject.name)}`}</span>
      <CopyButton value={`this.has${capitalizeFirstChar(valueObject.name)}`} />
    </div>
  </div>
</wa-tooltip>

<wa-tooltip for={`rich-tooltip-${valueObject.key}-default-value`} style="--max-width: 100%;">
  <div>
    <div class="flex-center">Default: {valueObject.defaultValue}</div>
  </div>
</wa-tooltip>

<style>
  wa-badge {
    height: 1rem;
    padding: 0.7em 0.4em;
    font-size: 0.7rem;
  }

  wa-button.info-button {
    margin-bottom: 0.15rem;
  }
</style>
