# Hotwire Dev Tools

Hotwire Dev Tools is a browser extension that provides a set of features for visualizing Turbo Frames, Turbo Streams and Stimulus controllers on a page.

Features:

- Highlighting Turbo Frames
- Listing Turbo Frames
- Listing Stimulus controllers and their registration status
- Monitoring incoming Turbo Streams
- Displaying Turbo meta tags

## Installation

The extension can be installed at:

- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/hotwire-dev-tools/)
- [Chrome Web Store](https://chrome.google.com/webstore/detail/hotwire-dev-tools/)
- Safari coming soon (hopefully 🙏)

## Development

- Fork the project locally
- `npm install`
- `npm run dev` - to build the extension and watch for changes
- `npm run build` - to bundle the extension into static files for production
- `npm run format` - to format changes with Prettier

### Test on Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable Developer mode
3. Click on `Load unpacked` and select the `public` folder (make sure to build the extension first)

### Test on Firefox

The easiest way is to make us of the [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) tool:

```bash
npm install --global web-ext
web-ext run
```

That will open a new Firefox window with the extension installed and hot reloading enabled.

---

This Dev Tool were inspired by [turbo-devtool](https://github.com/lcampanari/turbo-devtools) and [turbo_boost-devtools](https://github.com/hopsoft/turbo_boost-devtools) 🙌
