<script>
  let { element, additionalAttributes = {} } = $props()
</script>

<span class="html-tag">
  <span class="tag-name">{element.tagName.toLowerCase()}</span>
  {#if element.attributes.id}
    <span class="tag-id">#{element.attributes.id}</span>
  {:else if element.attributes.class}
    {#each element.attributes.class.split(" ") as className}
      <span class="tag-class">.{className}</span>
    {/each}
  {/if}
  {#each Object.entries(additionalAttributes) as [key, value]}
    <span class="tag-attribute">
      <span class="tag-attribute-name">{key}=</span>
      <span class="tag-attribute-value">"{value}"</span>
    </span>
  {/each}
</span>

<style>
  /* Remove whitespace */
  .html-tag,
  .tag-attribute {
    font-size: 0;
  }
  .tag-name,
  .tag-id,
  .tag-class,
  .tag-attribute-name,
  .tag-attribute-value {
    font-size: initial;
  }

  .tag-name {
    color: #80a3e6;
  }
  .tag-id,
  .tag-class,
  .tag-attribute-value {
    color: #ef9364;
  }

  .tag-attribute {
    margin-left: 0.5em;
  }
  .tag-attribute-name {
    color: #d44fba;
  }
</style>
