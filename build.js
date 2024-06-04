const esbuild = require("esbuild")
const fs = require("fs-extra")
const path = require("path")
const mustache = require("mustache")

const watchMode = process.argv.includes("--watch")
const browser = process.argv[3] || "chrome"
const nodeEnv = process.env.NODE_ENV
const production = nodeEnv === "production"
const templatePath = path.join(__dirname, "manifest.template.json")
const outputPath = path.join(__dirname, "public", "manifest.json")

const browserSpecificSettings = {
  chrome: {
    browser_specific_settings: false,
  },
  firefox: {
    browser_specific_settings: true,
  },
}

const esbuildConfig = {
  entryPoints: ["./src/content.js", "./src/popup.js", "./src/inject.js"],
  bundle: true,
  minify: production,
  sourcemap: !production,
  target: ["chrome58", "firefox109"],
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
