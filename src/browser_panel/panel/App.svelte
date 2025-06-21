<script>
  import "@shoelace-style/shoelace/dist/themes/light.css"
  import "@shoelace-style/shoelace/dist/shoelace.js"

  import { getDevtoolInstance, setDevtoolInstance } from "../../lib/devtool.js"
  import { handleResize } from "../theme.svelte.js"
  import TurboTab from "./tabs/TurboTab.svelte"

  setDevtoolInstance()
  const devTool = getDevtoolInstance()
  let devToolOptionsLoaded = $state(false)

  const initializeDevToolOptions = async () => {
    await devTool.setOptions()
    devToolOptionsLoaded = true
  }
  initializeDevToolOptions()

  let currentTab = $state("turbo-tab")

  const addEventListeners = () => {
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }

  const updateTab = (event) => {
    const tabId = event.target.dataset.tabId
    if (!tabId || currentTab === tabId) return

    currentTab = tabId
    document.querySelectorAll(".tabcontent").forEach((tab) => {
      tab.classList.remove("active")
    })
    document.getElementById(tabId).classList.add("active")
  }
</script>

{#if devToolOptionsLoaded}
  <main {@attach addEventListeners}>
    <div id="container">
      <div class="tablist">
        <button class="tablinks" class:active={currentTab == "turbo-tab"} onclick={updateTab} data-tab-id="turbo-tab">Turbo</button>
        <button class="tablinks" class:active={currentTab == "stimulus-tab"} onclick={updateTab} data-tab-id="stimulus-tab">Stimulus</button>
        <button class="tablinks" class:active={currentTab == "native-tab"} onclick={updateTab} data-tab-id="native-tab">Native</button>
        <button class="tablinks" class:active={currentTab == "events-tab"} onclick={updateTab} data-tab-id="events-tab">Events</button>
      </div>

      <div id="turbo-tab" class="tabcontent active">
        <TurboTab />
      </div>

      <div id="stimulus-tab" class="tabcontent">
        <h2>Stimulus</h2>
      </div>

      <div id="native-tab" class="tabcontent">
        <h2>Native</h2>
      </div>

      <div id="events-tab" class="tabcontent">
        <h2>Events</h2>
      </div>
    </div>
  </main>
{:else}
  <div class="loading-indicator">
    <span>Loading Hotwire Dev Tools</span>
  </div>
{/if}
