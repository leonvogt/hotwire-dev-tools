const puppeteer = require("puppeteer")

const EXTENSION_PATH = "public"
const EXTENSION_ID = "inlciieamljcbmlpbgfijcplhmhcjpml"
const TEST_URL = `file://${__dirname}/index.html`

let browser

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
  })
})

afterEach(async () => {
  await browser.close()
  browser = undefined
})

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

test("popup renders correctly", async () => {
  const page = await browser.newPage()
  await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`)
})

// test("turbo frame are being highlighted", async () => {
//   const page = await browser.newPage()
//   page.on("console", (msg) => console.log("PAGE LOG:", msg.text()))

//   await page.goto(`${TEST_URL}?hotwire-dev-tools-tests=true&highlight-turbo-frames=true`)
//   const turboFrame1 = await page.$("#index")

//   // Print the content of the turbo frame
//   let content = await page.evaluate((el) => el.textContent, turboFrame1)
//   console.log("content", content)

//   // take a screenshot
//   await page.screenshot({ path: "screenshot3.png" })

//   // add debug point
//   await delay(10000)
// })
