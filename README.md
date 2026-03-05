# LaTeX to PNG — Chrome Extension

A lightweight Chrome extension that converts LaTeX math into high-resolution transparent PNGs directly from your browser. 
Supports all major math symbols and packages (including Dirac braket notation), customizable text color and DPI, 
and keeps a history of recent equations with bookmarks for your favorites.

## Features

- **Live preview** — renders as you type with debounced updates
- **High-resolution output** — configurable DPI (150 / 300 / 600) for crisp PNGs at any size
- **Transparent background** — paste equations directly into slides or documents
- **Customizable text color** — black, white, blue, red, or any custom color via color picker
- **Adjustable padding** — slider control from 0 to 40px
- **Download & copy** — save as PNG file or copy to clipboard with one click
- **History** — automatically remembers your last 5 valid equations
- **Bookmarks** — star any equation to keep it permanently
- **Offline** — MathJax is bundled locally, no internet required

## Installation

1. Download or clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the extension folder
5. The extension icon will appear in your toolbar — click it to start

## Usage

Click the extension icon to open the popup. 
Type or paste any LaTeX math expression in the text area — the preview updates in real time. 
Use the **Settings** panel to change text color, resolution, and padding. 
Click **Download PNG** to save or **Copy Image** to copy to clipboard.

Equations are automatically saved to **Recent** history. Click the ☆ star icon to bookmark an equation for permanent access.

## Third-party licenses

This extension bundles [MathJax](https://www.mathjax.org/), 
licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
