<script>
  import { copyToClipboard } from "../../utils/utils.js"
  import * as Icons from "../../utils/icons.js"

  let { value } = $props()
  let copied = $state(false)

  const handleCopy = () => {
    copyToClipboard(value)
    copied = true
    setTimeout(() => {
      copied = false
    }, 600)
  }
</script>

<button class="btn-icon icon-muted" onclick={handleCopy}>
  {@html copied ? Icons.check : Icons.copy}
</button>
