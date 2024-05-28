# Hotwire Dev Tools

## Development

- Fork the project locally
- `npm install`
- `npm run dev` - to build the extension and watch for changes
- `npm run build` - to bundle the extension into static files for production
- `npm run format` - to format changes with Prettier

### Test on Firefox

The easiest way is to make us of the [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) tool:

```bash
npm install --global web-ext
web-ext run
```

That will open a new Firefox window with the extension installed and hot reloading enabled.
