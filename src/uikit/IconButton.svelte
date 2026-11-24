<script>
  let { onclick, ...iconProps } = $props()
</script>

<wa-button class="small-icon-button" variant="neutral" appearance="plain" {onclick}>
  <wa-icon {...iconProps}></wa-icon>
</wa-button>
