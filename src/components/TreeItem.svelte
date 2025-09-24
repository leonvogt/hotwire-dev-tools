<script>
  const { label, children } = $props()
  const childrenIsObject = children && typeof children === "object"
  const childrenIsPresent = children !== null && children !== undefined
</script>

<wa-tree-item>
  <span>
    {label}
    {#if !childrenIsObject && childrenIsPresent}
      :
    {/if}
  </span>
  {#if childrenIsObject}
    {#each Object.entries(children) as [childLabel, grandChildren]}
      {console.log({ childLabel, grandChildren })}
      <TreeItem label={childLabel} children={grandChildren} />
    {/each}
  {:else if childrenIsPresent}
    <span>{children}</span>
  {/if}
</wa-tree-item>
