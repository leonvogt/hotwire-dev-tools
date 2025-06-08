<script>
  import TurboFrames from './TurboFrames.svelte'
</script>

<main>
  <div id="container">
    <div class="tablist">
      <button class="tablinks active" data-tab-id="turbo-frame-tab">Turbo Frames</button>
      <button class="tablinks" data-tab-id="turbo-stream-tab">Turbo Streams</button>
      <button class="tablinks" data-tab-id="stimulus-tab">Stimulus</button>
    </div>

    <div id="turbo-frame-tab" class="tabcontent active">
      <div class="d-flex justify-content-between">
        <h2>Turbo Frames</h2>
        <button class="refresh-turbo-frames button-as-link">
          <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
            <!-- Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
            <path
              opacity="1"
              fill="#1E3050"
              d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160H352c-17.7 0-32 14.3-32 32s14.3 32 32 32H463.5c0 0 0 0 0 0h.4c17.7 0 32-14.3 32-32V80c0-17.7-14.3-32-32-32s-32 14.3-32 32v35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1V432c0 17.7 14.3 32 32 32s32-14.3 32-32V396.9l17.6 17.5 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352H160c17.7 0 32-14.3 32-32s-14.3-32-32-32H48.4c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"
            />
          </svg>
        </button>
      </div>
      <div class="turbo-frame-content">
        <div class="lists">
          <div id="turbo-frame-list"></div>
          <template id="turbo-frame-template">
            <div class="turbo-frame">
              <div class="turbo-frame-id"></div>
            </div>
          </template>
        </div>

        <div class="details">
          <div id="turbo-frame-details"></div>
          <template id="turbo-frame-details-template">
            <div class="turbo-frame">
              <div class="turbo-frame-id"></div>
              <div class="turbo-frame-src"></div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div id="turbo-stream-tab" class="tabcontent">
      <h2>Turbo Streams</h2>
      <div class="lists">
        <div id="turbo-stream-list"></div>
        <template id="turbo-stream-template">
          <div class="turbo-stream">
            <div class="d-flex">
              <strong>Action: </strong>
              <div class="turbo-stream-action"></div>
            </div>
            <div class="d-flex">
              <strong>Target: </strong>
              <div class="turbo-stream-target"></div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div id="stimulus-tab" class="tabcontent">
      <div class="d-flex justify-content-between">
        <h2>Stimulus</h2>
        <button class="refresh-stimulus button-as-link">
          <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
            <!-- Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
            <path
              opacity="1"
              fill="#1E3050"
              d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160H352c-17.7 0-32 14.3-32 32s14.3 32 32 32H463.5c0 0 0 0 0 0h.4c17.7 0 32-14.3 32-32V80c0-17.7-14.3-32-32-32s-32 14.3-32 32v35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1V432c0 17.7 14.3 32 32 32s32-14.3 32-32V396.9l17.6 17.5 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.7c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352H160c17.7 0 32-14.3 32-32s-14.3-32-32-32H48.4c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"
            />
          </svg>
        </button>
      </div>
      <div class="stimulus-content">
        <div class="lists">
          <div id="stimulus-list"></div>
          <template id="stimulus-template">
            <div class="stimulus">
              <div class="stimulus-id"></div>
            </div>
          </template>
        </div>

        <div class="details">
          <div id="stimulus-details"></div>
          <template id="stimulus-details-template">
            <div class="stimulus">
              <div class="stimulus-id"></div>
              <div class="stimulus-src"></div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>


  <div class="card">
    <TurboFrames />
  </div>
</main>
