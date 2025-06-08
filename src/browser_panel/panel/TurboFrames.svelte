<script>
  import { getTurboFrames } from '../State.svelte.js';
  import { inspectElement } from '../../utils/utils.js'
  import { panelPostMessage } from "../messaging"
  import { PANEL_TO_BACKEND_MESSAGES } from "../../lib/constants"
  import { HOTWIRE_DEV_TOOLS_PANEL_SOURCE } from "../ports"
  import * as Icons from '../../utils/icons.js';

  const addHighlightOverlay = (selector) => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.HOVER_COMPONENT,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
      selector: selector,
    })
  };

  const hideHighlightOverlay = () => {
    panelPostMessage({
      action: PANEL_TO_BACKEND_MESSAGES.HIDE_HOVER,
      source: HOTWIRE_DEV_TOOLS_PANEL_SOURCE,
    })
  };
</script>

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>Source</th>
      <th>Loading</th>
      <th>Attributes</th>
    </tr>
  </thead>
  <tbody>
    {#each getTurboFrames() as frame}
      {@const selector = `#${frame.id}`}
      <tr onmouseenter={() => addHighlightOverlay(selector)}
          onmouseleave={() => hideHighlightOverlay()}>
        <td>
          <span>{frame.id}</span>
          <button onclick={() => inspectElement(selector)}>
            {@html Icons.inspectElement}
          </button>
        </td>
        <td>{frame.src}</td>
        <td>{frame.loading}</td>
        <td>{frame.attributes}</td>
      </tr>
    {/each}
  </tbody>
</table>
