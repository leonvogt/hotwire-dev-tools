#!/usr/bin/env node
const { spawn } = require("child_process")
const args = process.argv.slice(2)
const browserArg = args.find(arg => !arg.startsWith("--"))
const browser = browserArg || "chrome"
const isWatch = args.includes("--watch")
const nodeEnv = isWatch ? "development" : "production"

const viteArgs = ["vite", "build"]
if (isWatch) viteArgs.push("--watch")

const env = { ...process.env, BROWSER: browser, NODE_ENV: nodeEnv }

const vite = spawn("npx", viteArgs, { stdio: "inherit", env })
vite.on("exit", (code) => process.exit(code))
