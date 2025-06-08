<script>
  import { getTurboFrames } from '../State.svelte.js';
  import { inspectElement } from '../../utils/utils.js'
  import * as Icons from '../../utils/icons.js';
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
      <tr onclick="{() => inspectElement(`#${frame.id}`)}">
        <td>
          {frame.id}
          {@html Icons.inspectElement}
        </td>
        <td>{frame.src}</td>
        <td>{frame.loading}</td>
        <td>{frame.attributes}</td>
      </tr>
    {/each}
  </tbody>
</table>
