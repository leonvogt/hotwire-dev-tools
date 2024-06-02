# Hotwire Dev Tools

Hotwire Dev Tools is a browser extension with the goal of helping developers inspect their Turbo and Stimulus applications.

**Turbo features**:

- Highlight Turbo Frames
- Monitor incoming Turbo Streams
- Display Turbo meta information like is Turbo Drive or morphing enabled?
- Display warning when a Turbo Frame ID is not unique
- List all Turbo Frames on the page

**Stimulus features**:

- Highlight Stimulus controllers
- List all Stimulus controllers on the page
- Display warning when a `data-controller` doesn't match any registered controller

## Installation

The extension can be installed at:

- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/hotwire-dev-tools/)
- [Chrome Web Store](https://chrome.google.com/webstore/detail/hotwire-dev-tools/)
- Safari coming soon (hopefully 🙏)

## Usage

Once installed, click on the extension icon to open the Dev Tools options.  
From there you can enable/disable the features you want to use.  
_Note: On Firefox you may need to select "Always allow on site.com" to enable the extension on your site._

## Development

- Fork the project locally
- `npm install`
- `npm run dev` - to build the extension and watch for changes
- `npm run build` - to bundle the extension into static files for production
- `npm run format` - to format changes with Prettier

> [!NOTE]  
> By default, the extension will be built for Chrome. To build for Firefox just add `firefox` as an argument to the build command: `npm run build firefox` or `npm run dev firefox`.

### Test on Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable Developer mode
3. Click on `Load unpacked` and select the `public` folder (make sure to build the extension first)

### Test on Firefox

The easiest way is to make us of the [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) tool:

```bash
npm install --global web-ext

cd public
web-ext run
```

That will open a new Firefox instance with the extension installed and hot reloading enabled.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/leonvogt/hotwire-dev-tools.

### Coding Standards

This project uses Prettier to format the code and ensure a consistent style.

Please run `npm run format` prior to submitting pull requests.

---

This Dev Tool were inspired by [turbo-devtool](https://github.com/lcampanari/turbo-devtools) and [turbo_boost-devtools](https://github.com/hopsoft/turbo_boost-devtools) 🙌
