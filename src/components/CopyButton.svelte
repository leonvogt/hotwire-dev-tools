<script>
  import { copyToClipboard } from "../utils/utils.js"

  let { value } = $props()
  let copied = $state(false)
  let tooltip

  const handleCopy = () => {
    tooltip.show()
    copyToClipboard(value)
    copied = true
    setTimeout(() => {
      copied = false
      tooltip.hide()
    }, 800)
  }
</script>

<button class="btn-copy" onclick={handleCopy} aria-label="Copy to clipboard">
  <sl-tooltip content="Copied" trigger="manual" bind:this={tooltip}>
    <sl-icon class="copy-icon" class:copied name={copied ? "check2" : "copy"}></sl-icon>
  </sl-tooltip>
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
  }

  .copy-icon {
    transition:
      transform 0.2s ease,
      color 0.2s ease;
  }

  .copy-icon.copied {
    transform: scale(1.25);
    color: var(--sl-color-success-500);
  }

  .copy-icon {
    color: var(--sl-color-neutral-1000);
  }
</style>
