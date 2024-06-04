const esbuild = require("esbuild")
const fs = require("fs-extra")
const path = require("path")
const mustache = require("mustache")

const nodeEnv = process.env.NODE_ENV
const browser = process.argv[3] || "chrome"
const production = nodeEnv === "production"
const outputPath = path.join(__dirname, "public", "manifest.json")
const templatePath = path.join(__dirname, "manifest.template.json")

const browserSpecificSettings = {
  chrome: {
    browser_specific_settings: false,
  },
  firefox: {
    browser_specific_settings: true,
  },
  safari: {
    browser_specific_settings: false,
  },
}

const esbuildConfig = {
  entryPoints: ["./src/content.js", "./src/popup.js", "./src/inject.js"],
  bundle: true,
  minify: production,
  sourcemap: !production,
  target: ["chrome88", "firefox109", "safari15"],
  outdir: "./public/dist",
  define: {
    "process.env.NODE_ENV": `"${nodeEnv}"`,
  },
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
