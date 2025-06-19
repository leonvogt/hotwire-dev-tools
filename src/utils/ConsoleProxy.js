export default class ConsoleProxy {
  constructor(origin) {
    this.origin = origin
  }

  addConsoleProxy() {
    if (window?.console === undefined) {
      console.warn("Hotwire Native Dev Tools: Console proxy not initialized, window.console is not defined")
    }

    this.originalConsole = window.console
    window.console = new Proxy(this.originalConsole, {
      get: (target, prop, receiver) => {
        const originalValue = Reflect.get(target, prop, receiver)
        return (...args) => {
          switch (prop) {
            case "log":
              this.log(...args)
              break
            case "info":
              this.info(...args)
              break
            case "warn":
              this.warn(...args)
              break
            case "error":
              this.error(...args)
              break
            case "debug":
              this.debug(...args)
              break
            default:
              this.log(...args)
              break
          }
          return originalValue?.apply(target, args)
        }
      },
    })

    this.addEventListeners()
  }

  addEventListeners() {
    // Capture uncaught errors and unhandled promise rejections
    window.addEventListener("error", (event) => {
      const { message, filename, lineno, colno } = event
      const formattedMessage = `${message} at ${filename}:${lineno}:${colno}`
      this.error(formattedMessage)
    })

    window.addEventListener("unhandledrejection", (event) => {
      this.error(event.reason?.message)
    })
  }

  serializeArgs(args) {
    const message = args
      .map((arg) => {
        if (typeof Element !== "undefined" && arg instanceof Element) {
          const attrs = Array.from(arg.attributes)
            .map((attr) => `${attr.name}="${attr.value}"`)
            .join(" ")

          return `&lt;${arg.tagName.toLowerCase()}${attrs ? " " + attrs : ""}&gt;&lt;/${arg.tagName.toLowerCase()}&gt;`
        }
        if (typeof arg === "object" && arg !== null) {
          try {
            return `<pre>${JSON.stringify(arg, null, 2)}</pre>`
          } catch {
            return `<pre>${arg}</pre>`
          }
        }
        // Escape HTML in string values
        const stringValue = arg.toString()
        return stringValue.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
      })
      .join(" ")

    return message
  }

  log(...args) {
    this.postMessage("log", this.serializeArgs(args))
  }
  info(...args) {
    this.postMessage("info", this.serializeArgs(args))
  }
  warn(...args) {
    this.postMessage("warn", this.serializeArgs(args))
  }
  error(...args) {
    this.postMessage("error", this.serializeArgs(args))
  }
  debug(...args) {
    this.postMessage("debug", this.serializeArgs(args))
  }

  postMessage(level, message) {
    fetch("https://remote_logger.test/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        level: level,
        message: message,
        origin: this.origin,
      }),
    })
  }
}
