import { fileURLToPath } from "url"
import { dirname, resolve } from "path"
import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import fs from "fs-extra"
import mustache from "mustache"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const nodeEnv = process.env.NODE_ENV || "development"
const browser = process.env.BROWSER || "chrome"
const production = nodeEnv === "production"

const browserSpecificSettings = {
  chrome: {
    use_outline_icons: true,
    needs_browser_specific_settings: false,
    needs_service_worker: true,
  },
  firefox: {
    use_outline_icons: true,
    needs_browser_specific_settings: true,
    needs_service_worker: false,
  },
  safari: {
    use_outline_icons: false,
    needs_browser_specific_settings: false,
    needs_service_worker: false,
  },
}

const outputFileNames = {
  content: "hotwire_dev_tools_content",
  popup: "hotwire_dev_tools_popup",
  inject_script: "hotwire_dev_tools_inject_script",
}

function manifestPlugin() {
  return {
    name: "manifest-generator",
    buildStart() {
      const templatePath = resolve(__dirname, "manifest.template.json")
      const outputPath = resolve(__dirname, "public", "manifest.json")
      let settings = browserSpecificSettings[browser]
      if (!settings) {
        console.warn(`Unknown browser '${browser}', defaulting to 'chrome' settings.`)
        settings = browserSpecificSettings.chrome
      }
      const template = fs.readFileSync(templatePath, "utf8")
      const output = mustache.render(template, settings)
      fs.writeFileSync(outputPath, output)
      console.log(`Generated manifest.json for ${browser}`)
    },
  }
}

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: !production && browser !== "safari",
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content.js"),
        popup: resolve(__dirname, "src/popup.js"),
        background: resolve(__dirname, "src/background.js"),
        inject_script: resolve(__dirname, "src/inject_script.js"),
        panel: resolve(__dirname, "src/browser_panel/panel/panel.js"),
        register: resolve(__dirname, "src/browser_panel/panel/register.js"),
        backend: resolve(__dirname, "src/browser_panel/page/backend.js"),
        proxy: resolve(__dirname, "src/browser_panel/proxy.js"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (outputFileNames[chunk.name]) {
            return `js/${outputFileNames[chunk.name]}.js`
          }
          return "js/[name].js"
        },
        chunkFileNames: "js/[name].js",
        assetFileNames: "assets/[name][extname]"
      },
    },
    target: ["chrome88", "firefox109", "safari15"],
    minify: production,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(nodeEnv),
  },
  plugins: [svelte({ compilerOptions: { css: "injected" } }), manifestPlugin()],
})
