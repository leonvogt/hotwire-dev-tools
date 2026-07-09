<script>
  import { getActiveWarnings, getSilencedWarnings, silenceWarning, unsilenceWarning } from "../State.svelte.js"
  import { addHighlightOverlayByPath, hideHighlightOverlay } from "../messaging.js"

  import IconButton from "$uikit/IconButton.svelte"
  import InspectButton from "$components/InspectButton.svelte"
  import StripedHtmlTag from "$components/StripedHtmlTag.svelte"

  let activeWarnings = $derived(getActiveWarnings())
  let silencedWarnings = $derived(getSilencedWarnings())

  const highlight = (warning) => {
    if (warning.element?.elementPath) addHighlightOverlayByPath(warning.element.elementPath)
  }
</script>

{#snippet warningCard(warning, silenced)}
  <div class="warning-card" class:silenced role="listitem" onmouseenter={() => highlight(warning)} onmouseleave={() => hideHighlightOverlay()}>
    <wa-icon class="warning-icon" name={silenced ? "bell-slash" : "triangle-exclamation"}></wa-icon>

    <div class="warning-body">
      <div class="warning-title">{warning.title}</div>
      <div class="warning-message">{warning.message}</div>
      {#if warning.element?.tagName || warning.docsUrl}
        <div class="warning-meta">
          {#if warning.element?.tagName}
            <span class="warning-element"><StripedHtmlTag element={warning.element} /></span>
          {/if}
          {#if warning.docsUrl}
            <a class="warning-docs" href={warning.docsUrl} target="_blank" rel="noopener noreferrer">
              Learn more <wa-icon name="arrow-up-right-from-square"></wa-icon>
            </a>
          {/if}
        </div>
      {/if}
    </div>

    <div class="warning-actions">
      {#if warning.element?.elementPath}
        <InspectButton class="warning-action" elementPath={warning.element.elementPath} />
      {/if}
      {#if silenced}
        <IconButton class="warning-action" name="bell" label="Unmute warning" onclick={() => unsilenceWarning(warning.id)}></IconButton>
      {:else}
        <IconButton class="warning-action" name="bell-slash" label="Mute warning on this site" onclick={() => silenceWarning(warning.id)}></IconButton>
      {/if}
    </div>
  </div>
{/snippet}

<div class="pane-container">
  {#if activeWarnings.length === 0 && silencedWarnings.length === 0}
    <div class="no-entry-hint">
      <wa-icon class="empty-icon" name="circle-check"></wa-icon>
      <span>No warnings</span>
      <span>Your Hotwire setup looks healthy</span>
    </div>
  {:else}
    <div class="pane-scrollable-list warnings-list" role="list">
      {#if activeWarnings.length === 0}
        <div class="warnings-clear">
          <wa-icon name="circle-check"></wa-icon>
          <span>No active warnings</span>
        </div>
      {/if}

      {#each activeWarnings as warning (warning.id)}
        {@render warningCard(warning, false)}
      {/each}

      {#if silencedWarnings.length > 0}
        <div class="warnings-divider">
          <wa-icon name="bell-slash"></wa-icon>
          <span>Silenced on this site</span>
          <span class="warnings-divider-count">{silencedWarnings.length}</span>
        </div>
        {#each silencedWarnings as warning (warning.id)}
          {@render warningCard(warning, true)}
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .warnings-list {
    background-color: var(--wa-color-surface-lowered);
    padding: 0.4rem 0.5rem;
  }

  .warning-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    column-gap: 0.6rem;
    padding: 0.6rem 0.7rem;
    margin-bottom: 0.4rem;
    background-color: var(--wa-color-surface-default);
    border: 1px solid var(--wa-color-surface-border);
    border-left: 3px solid var(--wa-color-yellow-70);
    border-radius: 0.5rem;
    transition:
      border-color 0.12s ease,
      box-shadow 0.12s ease;
  }
  .warning-card:last-child {
    margin-bottom: 0;
  }
  .warning-card:hover {
    border-color: var(--wa-color-surface-border);
    border-left-color: var(--wa-color-yellow-60);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  .warning-icon {
    color: var(--wa-color-yellow-60);
    font-size: 1rem;
    margin-top: 0.1rem;
  }

  .warning-body {
    min-width: 0;
  }
  .warning-title {
    font-size: var(--fs-300);
    font-weight: 600;
    line-height: 1.35;
  }
  .warning-message {
    margin-top: 0.15rem;
    font-size: var(--fs-200);
    line-height: 1.5;
    color: var(--wa-color-text-quiet);
  }

  .warning-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.45rem;
  }
  .warning-element {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* Match the colored element syntax used across the other tabs, scaled to the card */
  .warning-element :global(.tag-name),
  .warning-element :global(.tag-id),
  .warning-element :global(.tag-class),
  .warning-element :global(.tag-attribute-name),
  .warning-element :global(.tag-attribute-value) {
    font-size: var(--fs-200);
  }
  .warning-docs {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: var(--fs-200);
    text-decoration: none;
    color: var(--wa-color-brand-fill-loud);
    white-space: nowrap;
  }
  .warning-docs:hover {
    text-decoration: underline;
  }
  .warning-docs wa-icon {
    font-size: var(--fs-100);
  }

  .warning-actions {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    flex-shrink: 0;
  }
  .warning-actions :global(.warning-action) {
    opacity: 0.35;
    transition: opacity 0.12s ease;
  }
  .warning-card:hover .warning-actions :global(.warning-action),
  .warning-actions :global(.warning-action:focus-visible) {
    opacity: 1;
  }

  /* Silenced warnings */
  .warning-card.silenced {
    border-left-color: var(--wa-color-surface-border);
    background-color: transparent;
    opacity: 0.7;
  }
  .warning-card.silenced:hover {
    opacity: 1;
  }
  .warning-card.silenced .warning-icon {
    color: var(--wa-color-text-quiet);
  }
  .warning-card.silenced .warning-title {
    font-weight: 500;
  }

  .warnings-divider {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0.6rem 0.2rem 0.5rem;
    font-size: var(--fs-100);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--wa-color-text-quiet);
  }
  .warnings-divider-count {
    padding: 0 0.35rem;
    line-height: 1.25rem;
    min-width: 1.25rem;
    text-align: center;
    background-color: var(--wa-color-surface-border);
    border-radius: 0.75rem;
  }

  .warnings-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem;
    margin-bottom: 0.4rem;
    font-size: var(--fs-200);
    color: var(--wa-color-success-fill-loud, var(--wa-color-text-quiet));
  }

  .empty-icon {
    font-size: 2rem;
    color: var(--wa-color-success-fill-loud, var(--wa-color-green-60));
    margin-bottom: 0.5rem;
  }
</style>
