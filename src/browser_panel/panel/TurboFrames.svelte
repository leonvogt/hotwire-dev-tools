<script>
  import { getTurboFrames } from '../State.svelte.js';
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
      <tr>
        <td>{frame.id}</td>
        <td>{frame.src}</td>
        <td>{frame.loading}</td>
        <td>{frame.attributes}</td>
      </tr>
    {/each}
  </tbody>
</table>
