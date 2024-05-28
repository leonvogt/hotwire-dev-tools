const esbuild = require("esbuild")

const config = {
  entryPoints: ["./src/content.js", "./src/popup.js", "./src/inject.js"],
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
  target: ["chrome58", "firefox57"],
  outdir: "./public/dist",
  define: {
    "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
  },
}

const buildAndWatch = async () => {
  const context = await esbuild.context({ ...config, logLevel: "info" })
  context.watch()
}

if (process.argv.includes("--watch")) {
  buildAndWatch()
} else {
  esbuild.build(config)
}
