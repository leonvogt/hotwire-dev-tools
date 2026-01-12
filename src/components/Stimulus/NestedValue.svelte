<script>
  import NestedValue from "./NestedValue.svelte"
  import ValueEditor from "./ValueEditor.svelte"

  let { data, path = [], editingStates, onEdit, onSave, onCancel } = $props()

  const isObject = (val) => typeof val === "object" && val !== null && !Array.isArray(val)
  const isArray = (val) => Array.isArray(val)
  const isPrimitive = (val) => !isObject(val) && !isArray(val)
</script>

{#if isObject(data)}
  {#each Object.entries(data) as [key, value]}
    <wa-tree-item class="w-100">
      {#if isPrimitive(value)}
        <div class="stimulus-value-editor-wrapper">
          <span>{key}:</span>
          <ValueEditor
            {value}
            isEditing={editingStates[[...path, key].join(".")] || false}
            onEdit={() => onEdit([...path, key])}
            onSave={(newVal) => onSave([...path, key], newVal)}
            onCancel={() => onCancel([...path, key])}
          />
        </div>
      {:else}
        <span>{key}:</span>
        {#if isArray(value)}
          <span class="text-muted ms-1">{value.length}</span>
        {/if}
        <NestedValue data={value} path={[...path, key]} {editingStates} {onEdit} {onSave} {onCancel} />
      {/if}
    </wa-tree-item>
  {/each}
{:else if isArray(data)}
  {#each data as item, i}
    <wa-tree-item class="w-100">
      {#if isPrimitive(item)}
        <div class="stimulus-value-editor-wrapper">
          <span>{i}:</span>
          <ValueEditor
            value={item}
            isEditing={editingStates[[...path, i].join(".")] || false}
            onEdit={() => onEdit([...path, i])}
            onSave={(newVal) => onSave([...path, i], newVal)}
            onCancel={() => onCancel([...path, i])}
          />
        </div>
      {:else}
        <span>{i}:</span>
        {#if isArray(item)}
          <span class="text-muted ms-1">Array [{item.length}]</span>
        {/if}
        <NestedValue data={item} path={[...path, i]} {editingStates} {onEdit} {onSave} {onCancel} />
      {/if}
    </wa-tree-item>
  {/each}
{/if}
