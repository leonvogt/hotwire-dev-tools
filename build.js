const esbuild = require("esbuild")
const fs = require("fs-extra")
const path = require("path")
const mustache = require("mustache")
const sveltePlugin = require("esbuild-svelte")

const nodeEnv = process.env.NODE_ENV
const browser = process.argv[3] || "chrome"
const production = nodeEnv === "production"
const outputPath = path.join(__dirname, "public", "manifest.json")
const templatePath = path.join(__dirname, "manifest.template.json")

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
  "content.js": "hotwire_dev_tools_content.js",
  "popup.js": "hotwire_dev_tools_popup.js",
  "inject_script.js": "hotwire_dev_tools_inject_script.js",
}

const esbuildConfig = {
  entryPoints: [
    "./src/content.js",
    "./src/popup.js",
    "./src/background.js",
    "./src/inject_script.js",
    "./src/browser_panel/panel/panel.js",
    "./src/browser_panel/panel/register.js",
    "./src/browser_panel/page/backend.js",
    "./src/browser_panel/proxy.js",
  ],
  bundle: true,
  minify: production,
  sourcemap: !production && browser !== "safari",
  target: ["chrome88", "firefox109", "safari15"],
  outdir: "./public/dist",
  define: {
    "process.env.NODE_ENV": `"${nodeEnv}"`,
  },
  conditions: ["svelte", "browser"],
  metafile: true,
  plugins: [
    sveltePlugin({ compilerOptions: { css: "injected" } }),
    {
      name: "rename-output-files",
      setup(build) {
        build.onEnd(async (result) => {
          if (result.metafile) {
            const outputFiles = Object.keys(result.metafile.outputs)
            for (const outputFile of outputFiles) {
              const originalName = path.basename(outputFile)
              const newName = outputFileNames[originalName]

              if (newName) {
                const newPath = path.join(path.dirname(outputFile), newName)
                await fs.rename(outputFile, newPath)
                console.log(`Renamed ${originalName} to ${newName}`)
              }
            }
          }
        })
      },
    },
  ],
}

async function generateManifest() {
  try {
    const template = await fs.readFile(templatePath, "utf8")
    const output = mustache.render(template, browserSpecificSettings[browser])
    await fs.writeFile(outputPath, output)
    console.log(`Generated manifest.json for ${browser}`)
  } catch (err) {
    console.error("Error generating manifest file:", err)
  }
}

const buildAndWatch = async () => {
  const context = await esbuild.context({ ...esbuildConfig, logLevel: "info" })
  context.watch()
}

async function buildProject() {
  await generateManifest()

  if (process.argv.includes("--watch")) {
    buildAndWatch()
  } else {
    esbuild.build(esbuildConfig)
  }
}

buildProject()
