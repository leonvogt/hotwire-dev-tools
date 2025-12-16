<script>
  import "$uikit/webawesome.svelte.js"
  import { getDevtoolInstance, setDevtoolInstance } from "$lib/devtool.js"
  import { orientation, handleResize } from "../theme.svelte.js"
  import { connection } from "../State.svelte.js"
  import { refreshAllState } from "../messaging.js"
  import StimulusTab from "./tabs/StimulusTab.svelte"
  import TurboTab from "./tabs/TurboTab.svelte"
  import LogsTab from "./tabs/LogsTab.svelte"

  setDevtoolInstance()
  const devTool = getDevtoolInstance()
  let devToolOptionsLoaded = $state(false)
  let currentTab = $state("turbo-tab")
  let currentTheme = $state("light")

  const initializeDevToolOptions = async () => {
    await devTool.setOptions()
    currentTab = devTool.options.currentTab || "turbo-tab"
    currentTheme = devTool.options.currentTheme || "light"
    setTheme(currentTheme)
    devToolOptionsLoaded = true
  }
  initializeDevToolOptions()

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
    devTool.saveOptions({ currentTab })

    // Request fresh state from backend when switching tabs
    if (connection.connectedToBackend && !connection.isPermanentlyDisconnected) {
      refreshAllState()
    }
  }

  const setTheme = (theme) => {
    currentTheme = theme
    document.documentElement.classList.toggle("wa-dark", currentTheme === "dark")
    devTool.saveOptions({ currentTheme })
  }
</script>

{#if connection.isPermanentlyDisconnected}
  <wa-callout variant="danger" class="m-5">
    <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
    <strong>Connection Timeout</strong><br />
    Unable to connect to the current page. Try closing and reopening the inspection panel to resolve the issue.
    <div class="mt-4">
      If this issue persists, consider reporting it on GitHub:
      <br />
      <a href="https://github.com/leonvogt/hotwire-dev-tools/issues/new" target="_blank" rel="noopener noreferrer">https://github.com/leonvogt/hotwire-dev-tools/issues/new</a>
    </div>
  </wa-callout>
{:else if devToolOptionsLoaded}
  <main class={$orientation} {@attach addEventListeners}>
    <div id="container">
      <nav class="navbar wa-brand">
        <button class:active={currentTab == "turbo-tab"} onclick={updateTab} data-tab-id="turbo-tab">Turbo</button>
        <button class:active={currentTab == "stimulus-tab"} onclick={updateTab} data-tab-id="stimulus-tab">Stimulus</button>
        <button class:active={currentTab == "native-tab"} onclick={updateTab} data-tab-id="native-tab">Native</button>
        <button class:active={currentTab == "logs-tab"} onclick={updateTab} data-tab-id="logs-tab">Log</button>

        <button class="theme-toggle-btn" aria-label="Toggle Color Scheme" onclick={() => setTheme(currentTheme === "light" ? "dark" : "light")}>
          {#if currentTheme === "light"}
            <wa-icon name="moon" variant="regular"></wa-icon>
          {:else}
            <wa-icon name="sun" variant="regular"></wa-icon>
          {/if}
        </button>
      </nav>

      <div id="turbo-tab" class="tab-content" class:active={currentTab == "turbo-tab"}>
        <TurboTab />
      </div>

      <div id="stimulus-tab" class="tab-content" class:active={currentTab == "stimulus-tab"}>
        <StimulusTab />
      </div>

      <div id="native-tab" class="tab-content" class:active={currentTab == "native-tab"}>
        <h2>Native</h2>
      </div>

      <div id="logs-tab" class="tab-content" class:active={currentTab == "logs-tab"}>
        <LogsTab />
      </div>
    </div>
  </main>
{:else}
  <div class="h-100vh d-flex justify-content-center align-items-center flex-column gap-5">
    <div class="show-in-200ms">
      <div class="mb-2">Setting up Hotwire DevTool...</div>
      <p><wa-skeleton effect="sheen"></wa-skeleton></p>
    </div>
    <div class="show-in-1000ms text-align-center">
      <div class="mb-2">Hmm... this is taking a bit longer than expected.</div>
      <div>Check the browser console for any errors.</div>
      {#if __IS_CHROME__}
        <div>Right-click anywhere on this panel → Inspect → Console</div>
      {/if}

      {#if __IS_FIREFOX__}
        <div>If there isn't something showing up, you can also try to inspect the extension itself by:</div>
        <br />
        <div>
          Open the "Debug Add-ons" page in Firefox: <u>about:debugging#/runtime/this-firefox</u>
        </div>
        <div>Then clicking on the "Inspect" button next to the Hotwire DevTool. There you should see the console output.</div>
      {/if}

      {#if __IS_SAFARI__}
        <div class="text-muted">
          On Safari, you might need to enable the inspection option first by:
          <br />
          Safari Web Inspector Setting (Gear Icon on the top right) → Experimental → Allow Inspecting Web Inspector
        </div>
      {/if}

      <div class="mt-4">
        Found something weird? Please open an issue on GitHub:
        <br />
        <a href="https://github.com/leonvogt/hotwire-dev-tools/issues/new" target="_blank" rel="noopener noreferrer">https://github.com/leonvogt/hotwire-dev-tools/issues/new</a>
      </div>
    </div>
  </div>
{/if}
