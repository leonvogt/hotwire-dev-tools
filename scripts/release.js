const { execFileSync } = require("child_process")
const fs = require("fs-extra")
const path = require("path")

const root = path.resolve(__dirname, "..")
const releaseDir = path.join(root, "release")
const manifestTemplatePath = path.join(root, "manifest.template.json")
const pbxprojPath = path.join(root, "xcode", "HotwireDevTools.xcodeproj", "project.pbxproj")

const version = process.argv[2]
const tag = `v${version}`

function run(command, args, options = {}) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], ...options })
}

function fail(message) {
  console.error(`\n✖ ${message}`)
  process.exit(1)
}

function ensureReleasable() {
  if (!/^\d+\.\d+\.\d+$/.test(version || "")) fail("Usage: npm run release <major.minor.patch>")
  if (run("git", ["status", "--porcelain"]).trim()) fail("Working tree is not clean. Commit or stash your changes first.")
  if (run("git", ["tag", "--list", tag]).trim()) fail(`Tag ${tag} already exists.`)
}

function bumpManifestVersion() {
  const template = fs.readFileSync(manifestTemplatePath, "utf8")
  fs.writeFileSync(manifestTemplatePath, template.replace(/"version": "[^"]+"/, `"version": "${version}"`))
}

function bumpXcodeVersion() {
  const pbxproj = fs.readFileSync(pbxprojPath, "utf8")
  const buildNumbers = [...pbxproj.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((match) => Number(match[1]))
  const buildNumber = Math.max(...buildNumbers) + 1
  const updated = pbxproj.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`).replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${buildNumber};`)
  fs.writeFileSync(pbxprojPath, updated)
  return buildNumber
}

function build(browser) {
  console.log(`\n▸ Building ${browser}`)
  execFileSync("node", ["build.js", "--no-watch", browser], { cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } })
}

function zipPublic(browser) {
  const zipPath = path.join(releaseDir, `${browser}-${version}.zip`)
  fs.removeSync(zipPath)
  run("zip", ["-r", "-X", "-q", zipPath, ".", "-x", "*.DS_Store"], { cwd: path.join(root, "public") })
}

function commitAndTag() {
  run("git", ["add", manifestTemplatePath, pbxprojPath])
  run("git", ["commit", "-q", "-m", tag])
  run("git", ["tag", "-a", tag, "-m", tag])
}

function zipSource() {
  run("git", ["archive", "--format=zip", `--output=${path.join(releaseDir, `source-${version}.zip`)}`, tag])
}

function printNextSteps(buildNumber) {
  console.log(`
✔ Released ${tag} (Xcode build ${buildNumber})

Chrome   release/chrome-${version}.zip
         https://chrome.google.com/webstore/devconsole → Package → Upload new package

Firefox  release/firefox-${version}.zip + release/source-${version}.zip
         https://addons.mozilla.org/en-US/developers/addon/hotwire-dev-tools/ → Upload Version

         Notes to Reviewer:
         - Unzip the file and run \`npm install\` to install the dependencies
         - Run \`npm run build firefox\` to build the extension
         - Install manually or with \`cd public && npx web-ext run\`

Safari   public/ is built for Safari → Xcode: Product → Archive

Push     git push --follow-tags
`)
}

ensureReleasable()
fs.ensureDirSync(releaseDir)
bumpManifestVersion()
const buildNumber = bumpXcodeVersion()

try {
  build("chrome")
  zipPublic("chrome")
  build("firefox")
  zipPublic("firefox")
} catch {
  fail("Build failed, nothing committed. Revert the version bump with: git checkout -- manifest.template.json xcode")
}

commitAndTag()
zipSource()
build("safari")
printNextSteps(buildNumber)
