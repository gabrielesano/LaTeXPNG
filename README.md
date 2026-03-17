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
- **History** — remembers your last 5 equations (saved on download or copy, not while typing)
- **Bookmarks** — star any equation to keep it permanently
- **Draft persistence** — your current formula is automatically saved; close and reopen the popup without losing work
- **Bracket auto-closing** — typing `(`, `[`, `{` or their `\`-prefixed variants inserts the matching closer automatically; wraps selected text if any
- **Environment completion** — typing `\begin{align}` + Enter inserts `\end{align}` automatically (works with align, equation, matrix, cases, and more)
- **Command autocomplete** — type `\` followed by letters to get a dropdown of matching LaTeX commands; navigate with arrows, select with Tab or Enter
- **Open in tab** — click the expand button to open the editor in a full browser tab for more space
- **Offline** — MathJax is bundled locally, no internet required
## Installation
1. Download or clone this repository
2. Open `chrome://extensions/` in Chrome (or Brave, or any Chromium browser)
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the extension folder
5. The extension icon will appear in your toolbar — click it to start
## Usage
Click the extension icon to open the popup. 
Type or paste any LaTeX math expression in the text area — the preview updates in real time.
Start typing `\` to see autocomplete suggestions for LaTeX commands.
Use the **Settings** panel to change text color, resolution, and padding. 
Click **Download PNG** to save or **Copy Image** to copy to clipboard.
Equations are saved to **Recent** history when you download or copy them. Click the ☆ star icon to bookmark an equation for permanent access.
## Build
To package the extension for distribution:
```bash
bash build.sh
```
This creates `arc.zip` containing all necessary extension files.
## Third-party licenses
This extension bundles [MathJax](https://www.mathjax.org/), 
licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
