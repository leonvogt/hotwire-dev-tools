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
  "content.js": { newName: "hotwire_dev_tools_content.js", moveToDistRoot: true },
  "popup.js": { newName: "hotwire_dev_tools_popup.js" },
  "inject_script.js": { newName: "hotwire_dev_tools_inject_script.js", moveToDistRoot: true },
}

// Dev-only entry points (excluded from production builds)
const devEntryPoints = ["./src/panel/dev.js"]

const baseEntryPoints = ["./src/page/content.js", "./src/popup.js", "./src/background.js", "./src/page/inject_script.js", "./src/panel/panel.js", "./src/panel/register.js", "./src/page/backend.js", "./src/page/proxy.js"]

const esbuildConfig = {
  entryPoints: production ? baseEntryPoints : [...baseEntryPoints, ...devEntryPoints],
  bundle: true,
  minify: production,
  sourcemap: !production && browser !== "safari",
  target: ["chrome88", "firefox109", "safari15"],
  outdir: "./public/dist",
  define: {
    "process.env.NODE_ENV": `"${nodeEnv}"`,
    __IS_CHROME__: JSON.stringify(browser === "chrome"),
    __IS_FIREFOX__: JSON.stringify(browser === "firefox"),
    __IS_SAFARI__: JSON.stringify(browser === "safari"),
  },
  conditions: ["svelte", "browser"],
  metafile: true,
  alias: {
    $src: path.resolve(__dirname, "src"),
    $uikit: path.resolve(__dirname, "src/uikit"),
    $components: path.resolve(__dirname, "src/panel/components"),
    $utils: path.resolve(__dirname, "src/utils"),
    $lib: path.resolve(__dirname, "src/lib"),
    $panel: path.resolve(__dirname, "src/panel"),
    $page: path.resolve(__dirname, "src/page"),
  },
  plugins: [
    sveltePlugin({
      compilerOptions: { css: "injected" },
    }),
    {
      name: "rename-output-files",
      setup(build) {
        build.onEnd(async (result) => {
          if (result.metafile) {
            const outputFiles = Object.keys(result.metafile.outputs)
            for (const outputFile of outputFiles) {
              const originalName = path.basename(outputFile)
              const config = outputFileNames[originalName]

              if (config) {
                const newName = typeof config === "string" ? config : config.newName
                const moveToDistRoot = typeof config === "object" && config.moveToDistRoot
                const targetDir = moveToDistRoot ? "./public/dist" : path.dirname(outputFile)
                const newPath = path.join(targetDir, newName)
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

async function cleanupDevFiles() {
  const devFiles = [
    path.join(__dirname, "public", "dev.html"),
    path.join(__dirname, "public", "dist", "panel", "dev.js"),
    path.join(__dirname, "public", "dist", "panel", "dev.js.map"),
    path.join(__dirname, "public", "dist", "panel", "dev.css"),
    path.join(__dirname, "public", "dist", "panel", "dev.css.map"),
  ]

  for (const file of devFiles) {
    try {
      if (await fs.pathExists(file)) {
        await fs.remove(file)
        console.log(`Removed dev file: ${path.basename(file)}`)
      }
    } catch (err) {
      // Ignore errors if file doesn't exist
    }
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
    await esbuild.build(esbuildConfig)
    if (production) {
      await cleanupDevFiles()
    }
  }
}

buildProject()
