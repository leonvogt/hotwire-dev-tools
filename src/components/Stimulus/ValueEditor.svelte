<script>
  import IconButton from "$uikit/IconButton.svelte"

  let { value, isEditing, onEdit, onSave, onCancel } = $props()

  let editValue = $state(value)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(editValue)
  }

  const handleCancel = () => {
    editValue = value
    onCancel()
  }

  const handleEdit = () => {
    editValue = value
    onEdit()
  }
</script>

{#if isEditing}
  <form class="d-flex" onsubmit={handleSubmit}>
    <wa-input size="extra-small" value={editValue} oninput={(e) => (editValue = e.target.value)}></wa-input>
    <wa-button class="small-icon-button" variant="neutral" appearance="plain" type="submit">
      <wa-icon name="check"></wa-icon>
    </wa-button>
  </form>
  <IconButton name="xmark" onclick={handleCancel}></IconButton>
{:else}
  {value}
  <IconButton name="pencil" onclick={handleEdit}></IconButton>
{/if}
