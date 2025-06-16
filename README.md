<div align="center">

# Hotwire Dev Tools

**Hotwire Dev Tools is a browser extension designed to help developers inspect their Turbo and Stimulus applications.**

<img alt="screenshot" src="https://github.com/user-attachments/assets/6bee3a30-3545-48ea-b80f-054d0ef25bf2" width="800px" height="auto">

[![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=for-the-badge&logo=Firefox-Browser&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/hotwire-dev-tools/)
[![Google Chrome](https://img.shields.io/badge/Google%20Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white)](https://chromewebstore.google.com/detail/hotwire-dev-tools/phdobjkbablgffmmgnjbmfbbofnbkajc)
[![Safari](https://img.shields.io/badge/Safari-000000?style=for-the-badge&logo=Safari&logoColor=white)](https://apps.apple.com/ch/app/hotwire-dev-tools/id6503706225)
</div>

## Features
**Turbo**:

- Highlight Turbo Frames
- Monitor incoming Turbo Streams
- Display Turbo context information (Turbo Drive enabled, morphing enabled, ...)
- Log all Turbo related events
- Log warning when a Turbo Frame ID is not unique
- Log warning when an element has `data-turbo-permanent` but no ID or a non-unique ID
- Highlight Turbo Frame changes

**Stimulus**:

- Highlight Stimulus controllers
- List all Stimulus controllers on the page
- Log warning when a `data-controller` doesn't match any registered controller
- Log warning when a Stimulus target is not nested within the corresponding controller

## Installation

The extension can be installed at:

- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/hotwire-dev-tools/)
- [Chrome Web Store](https://chromewebstore.google.com/detail/hotwire-dev-tools/phdobjkbablgffmmgnjbmfbbofnbkajc)
- [App Store for Safari](https://apps.apple.com/ch/app/hotwire-dev-tools/id6503706225)

## Usage

Once installed, click the extension icon (or press Alt+Shift+S) to open the DevTools options.  
From there, you can enable/disable the features you want to use.  

> [!NOTE]
> On Firefox you may need to select "Always allow on example.com" to enable the extension on your site


## Development

- Fork the project locally
- `npm install`
- `npm run dev` - to build the extension and watch for changes
- `npm run build` - to bundle the extension into static files for production
- `npm run format` - to format changes with Prettier

> [!NOTE]  
> By default, the extension will be built for Chrome. To build for Firefox or Safari just add `firefox` or `safari` as an argument to the build command: `npm run build firefox` or `npm run build safari`.

### Test on Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable Developer mode
3. Click on `Load unpacked` and select the `public` folder (make sure to build the extension first)

### Test on Firefox

The easiest way is to make use of the [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) tool:

```bash
npm install --global web-ext

cd public
web-ext run
```

That will open a new Firefox instance with the extension installed and hot reloading enabled.

### Test on Safari

First [configure Safari to run unsigned extensions](https://developer.apple.com/documentation/safariservices/safari_web_extensions/running_your_safari_web_extension#3744467):

1. Choose Safari > Settings
2. Select the Advanced tab
3. Check the "Show features for web developers" box
4. Select the Developer tab.
5. Check the Allow unsigned extensions box.

This may depend on the version of macOS and Safari you are using.  
So if you can't find the settings, you may need to search for the specific version you are using.

Then you can load the extension by following these steps:

1. Open Xcode
2. Choose "Open Existing Project"
3. Select the [xcode/HotwireDevTools.xcodeproj](./xcode/HotwireDevTools.xcodeproj) workspace (blue icon)
4. Build the project (you may need to select a team in the project settings -> Signing & Capabilities)
5. Open Safari > Settings > Extensions and enable the Hotwire Dev Tools extension

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/leonvogt/hotwire-dev-tools.

### Coding Standards

This project uses Prettier to format the code and ensure a consistent style.

Please run `npm run format` prior to submitting pull requests.

---

This Dev Tool were inspired by [turbo-devtool](https://github.com/lcampanari/turbo-devtools) and [turbo_boost-devtools](https://github.com/hopsoft/turbo_boost-devtools) 🙌
