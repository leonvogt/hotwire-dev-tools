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

  const ignoredAttributes = ['id', 'loading', 'src', 'complete', 'aria-busy', 'busy']
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
          <div class="d-flex align-items-center justify-content-between">
            <span>{frame.id}</span>
            <button class="btn-icon" onclick={() => inspectElement(selector)}>
              {@html Icons.inspectElement}
            </button>
          </div>
        </td>
        <td>{frame.src}</td>
        <td>{frame.loading}</td>
        <td>
          <ul>
            {#each Object.entries(frame.attributes).filter(([key]) => !ignoredAttributes.includes(key)) as [key, value]}
              <li><strong>{key}:</strong> {value}</li>
            {/each}
          </ul>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  tr:hover {
    background-color: #f1f1f1;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #007bff;
    text-decoration: underline;
  }

  button:hover {
    color: #0056b3;
  }
</style>
