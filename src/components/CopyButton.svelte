<script>
  import { copyToClipboard } from "$utils/utils.js"

  let props = $props()
  let copied = $state(false)
  let id = props.id ?? `copy-button-${crypto.randomUUID()}`
  let value = props.value ?? ""
  let tooltip

  const handleCopy = () => {
    tooltip.open = true
    copyToClipboard(value)
    copied = true
    setTimeout(() => {
      copied = false
      tooltip.open = false
    }, 800)
  }
</script>

<button class="btn-copy" onclick={handleCopy} aria-label="Copy to clipboard">
  <wa-tooltip for={id} trigger="manual" bind:this={tooltip}>Copied</wa-tooltip>
  <wa-icon {id} class="copy-icon" class:copied name={copied ? "check" : "copy"} label="copy-icon"></wa-icon>
</button>

<style>
  .btn-copy {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    border-radius: 0.25rem;
    font-size: inherit;
    color: inherit;
    padding: 0.5rem;
    cursor: pointer;
    transition: 50ms color;
    padding: 0;
    height: 100%;
  }

  .copy-icon {
    transition:
      transform 0.2s ease,
      color 0.2s ease;
  }

  .copy-icon.copied {
    transform: scale(1.25);
    color: var(--wa-color-success-fill-loud);
  }

  .copy-icon {
    color: var(--wa-color-neutral-20);
  }
</style>
