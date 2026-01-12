<script>
  import IconButton from "$uikit/IconButton.svelte"
  const VALUE_TYPES = ["string", "number", "boolean", "null", "undefined"]

  let { value, valueType, isEditing, onEdit, onSave, onCancel } = $props()

  let editValue = $state(value)
  let inputElement = $state(null)
  let measureElement = $state(null)

  const type = VALUE_TYPES.includes(valueType) ? valueType : "string"

  $effect(() => {
    if (isEditing && inputElement && measureElement) {
      updateWidth()
    }
  })

  $effect(() => {
    if (editValue !== undefined && isEditing) {
      updateWidth()
    }
  })

  function updateWidth() {
    if (!inputElement || !measureElement) return

    const value = editValue?.toString() || inputElement.placeholder || "W"
    measureElement.textContent = value
    const width = measureElement.offsetWidth

    const wrapper = inputElement.closest(".input-wrapper")
    const maxWidth = wrapper?.parentElement?.offsetWidth || Infinity

    const finalWidth = Math.min(width, maxWidth - 40) // -40px for buttons
    inputElement.style.width = `${finalWidth}px`

    if (wrapper) {
      wrapper.style.width = `${finalWidth}px`
    }
  }

  const handleSubmit = (e) => {
    if (e && e.type === "keydown" && e.key !== "Enter") return
    e.preventDefault()
    e.stopPropagation()

    onSave(editValue)
  }

  const handleCancel = (e) => {
    if (e && e.type === "keydown" && e.key !== "Enter") return
    e.preventDefault()
    e.stopPropagation()

    editValue = value
    onCancel()
  }

  const handleEdit = () => {
    editValue = value
    onEdit()
  }

  const handleInput = (e) => {
    editValue = e.target.value
  }
</script>

{#if isEditing}
  <form class="d-flex gap-2 w-100" onsubmit={handleSubmit}>
    <div class="input-wrapper">
      <input bind:this={inputElement} class="auto-width-input" value={editValue} type={type === "null" || type === "undefined" ? "text" : type} oninput={handleInput} />
      <span bind:this={measureElement} class="size-measure"></span>
    </div>
    <wa-button class="small-icon-button" variant="neutral" appearance="plain" type="submit" onkeydown={handleSubmit} role="button" tabindex="0">
      <wa-icon name="check"></wa-icon>
    </wa-button>
    <IconButton name="xmark" onclick={handleCancel} onkeydown={handleCancel} role="button" tabindex="0"></IconButton>
  </form>
{:else if type === "boolean"}
  <wa-switch checked={value} onchange={(e) => onSave(e.target.checked)}></wa-switch>
{:else}
  {value}
  <IconButton name="pencil" onclick={handleEdit} size="small"></IconButton>
{/if}

<style>
  .input-wrapper {
    position: relative;
    display: inline-flex;
    padding-top: 2px;
    min-width: 2.5rem;
  }

  .auto-width-input {
    font-family: inherit;
    font-size: 13px;
    padding: 4px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    outline: none;
    background: #ffffff;
    color: #1f2937;
    min-width: 2.5rem;
    max-width: 100%;
    width: auto;
    transition: all 0.15s ease;
    line-height: 1.4;
    height: 1.2rem;
  }

  .auto-width-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .auto-width-input:hover:not(:focus) {
    border-color: #9ca3af;
  }

  .auto-width-input::placeholder {
    color: #9ca3af;
  }

  .auto-width-input[type="number"]::-webkit-inner-spin-button,
  .auto-width-input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .auto-width-input[type="number"] {
    -moz-appearance: textfield;
  }

  .size-measure {
    position: absolute;
    visibility: hidden;
    height: auto;
    width: auto;
    white-space: pre;
    pointer-events: none;
    font-family: inherit;
    font-size: 13px;
    padding: 4px 8px;
    border: 1px solid transparent;
    line-height: 1.4;
    left: 0;
    top: 0;
  }
</style>
