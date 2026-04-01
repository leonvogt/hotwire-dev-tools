<script>
  import NestedValue from "./NestedValue.svelte"
  import ValueEditor from "./ValueEditor.svelte"

  let { data, path = [], depth = 1, editingStates, onEdit, onSave, onCancel } = $props()

  const isObject = (val) => typeof val === "object" && val !== null && !Array.isArray(val)
  const isArray = (val) => Array.isArray(val)
  const isPrimitive = (val) => !isObject(val) && !isArray(val)
</script>

{#if isObject(data)}
  {#each Object.entries(data) as [key, value]}
    <div class="entry-row detail-sub-row" style="--depth: {depth}">
      {#if isPrimitive(value)}
        <div class="d-flex align-items-center gap-2 stimulus-value-editor-wrapper">
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
      {/if}
    </div>
    {#if !isPrimitive(value)}
      <NestedValue data={value} path={[...path, key]} depth={depth + 1} {editingStates} {onEdit} {onSave} {onCancel} />
    {/if}
  {/each}
{:else if isArray(data)}
  {#each data as item, i}
    <div class="entry-row detail-sub-row" style="--depth: {depth}">
      {#if isPrimitive(item)}
        <div class="d-flex align-items-center gap-2 stimulus-value-editor-wrapper">
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
      {/if}
    </div>
    {#if !isPrimitive(item)}
      <NestedValue data={item} path={[...path, i]} depth={depth + 1} {editingStates} {onEdit} {onSave} {onCancel} />
    {/if}
  {/each}
{/if}
