# Twitch Mute Shouts

A browser extension that hides the unread badge on Twitch's **Shouts** button in the site header.

Twitch recently added a "Shouts" feature that lets streamers send community-wide messages. The button shows a near-constant red unread badge, which many viewers find distracting. This extension removes that badge while leaving the Shouts feature fully functional.

## What it does

Injects a single CSS rule on `*.twitch.tv` pages:

```css
div[class*=Layout-sc]:has(> div > div > div > button[aria-label=Shouts]) div[class*=badge] {
  display: none;
}
```

No JavaScript, no network requests, no tracking — just CSS.

## Browser support

| Browser | Manifest | Min version |
|---------|----------|-------------|
| Chrome / Chromium | MV3 | 88+ |
| Firefox | MV3 | 109+ |
| Edge | MV3 | 88+ |

## Installing from source

### Chrome / Edge

1. Clone or download this repository.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this repository folder.

### Firefox

1. Clone or download this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `manifest.json` from this folder.

> **Note:** Temporary add-ons in Firefox are removed when the browser closes. For a permanent install, use a [signed build](#building-for-distribution) or [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/).

## Building for distribution

Requires Node.js 16+.

```bash
# Produce zip files in dist/
npm run build
```

This creates:

- `dist/twitch-mute-shouts-chrome.zip` — ready to upload to the [Chrome Web Store](https://chrome.google.com/webstore/devconsole)
- `dist/twitch-mute-shouts-firefox.zip` — ready to upload to [Firefox Add-ons (AMO)](https://addons.mozilla.org/developers/)

## Project structure

```
twitch-mute-shouts/
├── manifest.json          # MV3 extension manifest (Chrome, Firefox, Edge)
├── content.css            # The CSS injected into Twitch pages
├── shush.png              # Extension icon
├── scripts/
│   └── package-extension.js  # Builds distributable zip files
└── package.json
```

## CI / Releases

Two GitHub Actions workflows are included:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** | Every push & pull request | Runs `npm run build` and uploads the zips as artifacts |
| **Release** | Push a `v*` tag | Builds the zips and publishes them as a GitHub Release |

To cut a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Contributing

Pull requests welcome. Please keep changes focused — this extension is intentionally minimal.

## License

[MIT](LICENSE)

## Author

CSS lazily written by [Dirtybriefs](https://twitch.tv/dirtybriefs) with copilot doing the bundling. Human reviewed for 
accuracy and security.