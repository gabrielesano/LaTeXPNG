# CLAUDE.md — LaTeX to PNG Chrome Extension

## What this is
Chrome extension (Manifest V3) that converts LaTeX math into high-resolution transparent PNGs.
MathJax is bundled locally (lib/tex-svg-full.js) — the extension works fully offline.

## Architecture
- **popup.html / popup.js / popup.css** — the main UI (opens on extension icon click)
- **background.js** — service worker that performs the download (`chrome.downloads`) and reports success/error back to the popup
- **mathjax-config.js** — MathJax config (braket on, `noundefined` off); must load before the library
- **theme-init.js** — applies the saved theme in `<head>` before first paint (reads the `localStorage` mirror of the theme)
- **lib/tex-svg-full.js** — bundled MathJax library (~3MB, do NOT edit)
- **manifest.json** — Manifest V3, permissions: storage, downloads
- **images/** — extension icons (16/48/128px)

## Key features
- Live preview with debounced rendering; TeX errors are shown as a message (never baked into the PNG)
- Configurable DPI (150/300/600), text color, padding; the PNG declares its DPI (`pHYs` chunk)
- Download PNG or copy to clipboard
- History (last 5 equations) + bookmarks (persistent)
- Dirac braket notation support

## How to test
1. Open chrome://extensions/ with Developer Mode on
2. Click "Load unpacked" and select this folder
3. Click the extension icon in the toolbar
4. Type a LaTeX expression and verify preview renders

## Conventions
- Single-file popup (HTML + JS + CSS are separate but flat, no build step)
- No bundler, no npm, no framework — vanilla JS
- MathJax renders LaTeX → SVG → Canvas → PNG
- User settings persisted via chrome.storage.local (the theme is also mirrored to `localStorage` for `theme-init.js`)
- Downloads handled via chrome.downloads API in background.js. The PNG is sent as a data URL on purpose: the service worker outlives the popup, which closes when Chrome shows a "Save as" dialog (a popup-owned `blob:` URL would be revoked with it)

## Rendering pipeline (popup.js)
```
input → debounce 500ms → typeset (MathJax, SVG cached per LaTeX) → rasterize (SVG → canvas → PNG) → withDpi (pHYs) → preview
```
- Colour / DPI / padding changes only re-run `rasterize` (colour and DPI are applied immediately, the slider and colour picker are debounced 120ms)
- MathJax renders TeX errors into the SVG instead of rejecting: `typeset()` detects `data-mjx-error` and shows the message
- `renderGeneration` guards against stale async callbacks
- Text edits made by autocompletion go through `replaceRange()` (`execCommand('insertText')`) so Ctrl+Z keeps working
- The initial render waits for `MathJax.startup.promise`
- Theme: `data-theme` on `<html>` is always resolved to `light`/`dark` (system preference resolved in JS, kept in sync with `theme-init.js`)

## When making changes
- Never modify lib/tex-svg-full.js (vendored dependency)
- Test in Chrome after every change (no automated tests yet)
- Keep it simple — no build tools, no transpilation
