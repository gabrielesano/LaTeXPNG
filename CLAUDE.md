# CLAUDE.md — LaTeX to PNG Chrome Extension

## What this is
Chrome extension (Manifest V3) that converts LaTeX math into high-resolution transparent PNGs.
MathJax is bundled locally (lib/tex-svg-full.js) — the extension works fully offline.

## Architecture
- **popup.html / popup.js / popup.css** — the main UI (opens on extension icon click)
- **background.js** — service worker for background tasks (downloads, etc.)
- **lib/tex-svg-full.js** — bundled MathJax library (~3MB, do NOT edit)
- **manifest.json** — Manifest V3, permissions: storage, downloads
- **images/** — extension icons (16/48/128px)

## Key features
- Live preview with debounced rendering
- Configurable DPI (150/300/600), text color, padding
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
- User settings persisted via chrome.storage.local
- Downloads handled via chrome.downloads API in background.js

## When making changes
- Never modify lib/tex-svg-full.js (vendored dependency)
- Test in Chrome after every change (no automated tests yet)
- Keep it simple — no build tools, no transpilation
