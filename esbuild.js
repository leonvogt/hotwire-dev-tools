const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: [
      "./src/content.js",
      "./src/popup.js",
      "./src/inject.js"
    ],
    bundle: true,
    minify: true,
    sourcemap: process.env.NODE_ENV !== "production",
    target: ["chrome58", "firefox57"],
    outdir: "./public/dist",
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`
    }
  })
  .catch(() => process.exit(1));
