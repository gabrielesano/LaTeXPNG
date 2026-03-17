document.addEventListener('DOMContentLoaded', function () {
    // ===================== Element References =====================
    const latexInput = document.getElementById('latexInput');
    const resultContainer = document.getElementById('resultContainer');
    const actionButtons = document.getElementById('actionButtons');
    const resultImg = document.getElementById('resultImg');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');
    const bookmarkCurrentBtn = document.getElementById('bookmarkCurrentBtn');
    const loadingMsg = document.getElementById('loadingMsg');
    const errorMsg = document.getElementById('errorMsg');

    // Settings
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const customColorInput = document.getElementById('customColor');
    const dpiSelect = document.getElementById('dpiSelect');
    const paddingRange = document.getElementById('paddingRange');
    const paddingValue = document.getElementById('paddingValue');

    // Library
    const librarySection = document.getElementById('librarySection');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const historyList = document.getElementById('historyList');
    const bookmarksList = document.getElementById('bookmarksList');
    const historyEmpty = document.getElementById('historyEmpty');
    const bookmarksEmpty = document.getElementById('bookmarksEmpty');

    // ===================== State =====================
    let debounceTimer;
    let currentBlob = null;      // PNG blob for download/copy
    let previewBlobUrl = null;    // blob URL for the <img> preview
    let pendingSvgBlobUrl = null; // track SVG blob URL for leak prevention
    let currentLatex = '';

    // Defaults
    let settings = {
        textColor: '#000000',
        scaleFactor: 6.25,
        padding: 20
    };
    let history = [];   // [{ latex, timestamp }]  max 5
    let bookmarks = []; // [{ latex, timestamp }]

    // ===================== Storage helpers =====================
    // Guard against running outside the extension context (e.g. opening popup.html directly).
    const storage = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage.local : null;

    function loadAll(callback) {
        if (!storage) { callback(); return; }
        storage.get(['settings', 'history', 'bookmarks'], (data) => {
            if (data.settings) settings = { ...settings, ...data.settings };
            if (data.history) history = data.history;
            if (data.bookmarks) bookmarks = data.bookmarks;
            callback();
        });
    }

    function saveSettings() {
        if (storage) storage.set({ settings });
    }
    function saveHistory() {
        if (storage) storage.set({ history });
    }
    function saveBookmarks() {
        if (storage) storage.set({ bookmarks });
    }

    // ===================== Settings UI =====================
    function applySettingsToUI() {
        // Color swatches
        colorSwatches.forEach((sw) => {
            sw.classList.toggle('active', sw.dataset.color === settings.textColor);
        });
        customColorInput.value = settings.textColor;

        // DPI
        dpiSelect.value = String(settings.scaleFactor);

        // Padding
        paddingRange.value = settings.padding;
        paddingValue.textContent = settings.padding;
    }

    function setColor(color) {
        settings.textColor = color;
        colorSwatches.forEach((sw) => {
            sw.classList.toggle('active', sw.dataset.color === color);
        });
        customColorInput.value = color;
        saveSettings();
        renderLatex();
    }

    colorSwatches.forEach((sw) => {
        sw.addEventListener('click', () => setColor(sw.dataset.color));
    });
    customColorInput.addEventListener('input', () => setColor(customColorInput.value));

    dpiSelect.addEventListener('change', () => {
        settings.scaleFactor = parseFloat(dpiSelect.value);
        saveSettings();
        renderLatex();
    });

    paddingRange.addEventListener('input', () => {
        settings.padding = parseInt(paddingRange.value, 10);
        paddingValue.textContent = settings.padding;
        saveSettings();
        renderLatex();
    });

    // ===================== Tabs =====================
    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            tabBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach((tc) => tc.classList.remove('active'));
            document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
        });
    });

    // ===================== Helpers =====================

    function isBookmarked(latex) {
        return bookmarks.some((b) => b.latex === latex);
    }

    function updateBookmarkCurrentBtn() {
        const active = currentLatex && isBookmarked(currentLatex);
        bookmarkCurrentBtn.textContent = active ? '★' : '☆';
        bookmarkCurrentBtn.classList.toggle('active', active);
    }

    // ===================== History & Bookmarks logic =====================
    function addToHistory(latex) {
        // Remove duplicate if present
        history = history.filter((h) => h.latex !== latex);
        // Prepend
        history.unshift({ latex, timestamp: Date.now() });
        // Keep max 5
        if (history.length > 5) history = history.slice(0, 5);
        saveHistory();
        renderHistoryList();
    }

    function toggleBookmark(latex) {
        if (isBookmarked(latex)) {
            bookmarks = bookmarks.filter((b) => b.latex !== latex);
        } else {
            bookmarks.unshift({ latex, timestamp: Date.now() });
            if (bookmarks.length > 50) bookmarks = bookmarks.slice(0, 50);
        }
        saveBookmarks();
        renderBookmarksList();
        renderHistoryList(); // update star states
        updateBookmarkCurrentBtn();
    }

    function loadEquation(latex) {
        latexInput.value = latex;
        latexInput.focus();
        renderLatex();
    }

    // ===================== Render lists =====================
    function renderHistoryList() {
        historyList.innerHTML = '';
        historyEmpty.classList.toggle('hidden', history.length > 0);

        history.forEach((item) => {
            const li = document.createElement('li');

            const span = document.createElement('span');
            span.className = 'eq-latex';
            span.textContent = item.latex;
            span.title = item.latex;
            span.addEventListener('click', () => loadEquation(item.latex));

            const star = document.createElement('button');
            star.className = 'eq-star' + (isBookmarked(item.latex) ? ' bookmarked' : '');
            star.textContent = isBookmarked(item.latex) ? '★' : '☆';
            star.title = isBookmarked(item.latex) ? 'Remove bookmark' : 'Bookmark';
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleBookmark(item.latex);
            });

            li.appendChild(span);
            li.appendChild(star);
            historyList.appendChild(li);
        });

        showLibrarySectionIfNeeded();
    }

    function renderBookmarksList() {
        bookmarksList.innerHTML = '';
        bookmarksEmpty.classList.toggle('hidden', bookmarks.length > 0);

        bookmarks.forEach((item) => {
            const li = document.createElement('li');

            const span = document.createElement('span');
            span.className = 'eq-latex';
            span.textContent = item.latex;
            span.title = item.latex;
            span.addEventListener('click', () => loadEquation(item.latex));

            const del = document.createElement('button');
            del.className = 'eq-delete';
            del.textContent = '✕';
            del.title = 'Remove bookmark';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleBookmark(item.latex);
            });

            li.appendChild(span);
            li.appendChild(del);
            bookmarksList.appendChild(li);
        });

        showLibrarySectionIfNeeded();
    }

    function showLibrarySectionIfNeeded() {
        const hasContent = history.length > 0 || bookmarks.length > 0;
        librarySection.classList.toggle('hidden', !hasContent);
    }

    // ===================== Core Rendering =====================
    function cleanup() {
        if (pendingSvgBlobUrl) {
            URL.revokeObjectURL(pendingSvgBlobUrl);
            pendingSvgBlobUrl = null;
        }
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            previewBlobUrl = null;
        }
        currentBlob = null;
    }

    const renderLatex = () => {
        const latexCode = latexInput.value.trim();
        currentLatex = latexCode;

        cleanup();

        if (!latexCode) {
            resultContainer.classList.add('hidden');
            actionButtons.classList.add('hidden');
            errorMsg.classList.add('hidden');
            loadingMsg.classList.add('hidden');
            updateBookmarkCurrentBtn();
            return;
        }

        // Show loading
        resultContainer.classList.remove('hidden');
        loadingMsg.classList.remove('hidden');
        errorMsg.classList.add('hidden');
        resultImg.classList.add('hidden');
        actionButtons.classList.add('hidden');

        MathJax.tex2svgPromise(latexCode, { display: true })
            .then((node) => {
                const svgElement = node.querySelector('svg');
                svgElement.style.backgroundColor = 'transparent';

                // Apply text color
                svgElement.setAttribute('color', settings.textColor);
                svgElement.style.color = settings.textColor;

                const svgMarkup = svgElement.outerHTML;
                const image = new Image();
                const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                pendingSvgBlobUrl = svgUrl;

                image.onload = () => {
                    const sf = settings.scaleFactor;
                    const pad = settings.padding;
                    const canvas = document.createElement('canvas');
                    canvas.width = (image.width + pad * 2) * sf;
                    canvas.height = (image.height + pad * 2) * sf;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(image, pad * sf, pad * sf, image.width * sf, image.height * sf);

                    // Use toBlob — never creates a huge data URL string
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            showError('Failed to generate PNG.');
                            return;
                        }

                        currentBlob = blob;
                        previewBlobUrl = URL.createObjectURL(blob);
                        resultImg.src = previewBlobUrl;

                        loadingMsg.classList.add('hidden');
                        resultImg.classList.remove('hidden');
                        resultContainer.classList.remove('hidden');
                        actionButtons.classList.remove('hidden');

                        URL.revokeObjectURL(svgUrl);
                        pendingSvgBlobUrl = null;

                        updateBookmarkCurrentBtn();
                    }, 'image/png');
                };

                image.onerror = () => {
                    URL.revokeObjectURL(svgUrl);
                    pendingSvgBlobUrl = null;
                    showError('Failed to render SVG to image.');
                };

                image.src = svgUrl;
            })
            .catch((err) => {
                console.error('MathJax Rendering Error:', err);
                showError('Invalid LaTeX — check your syntax.');
            });
    };

    function showError(msg) {
        loadingMsg.classList.add('hidden');
        resultImg.classList.add('hidden');
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
        resultContainer.classList.remove('hidden');
        actionButtons.classList.add('hidden');
        currentBlob = null;
    }

    // ===================== Auto-completion =====================

    const BRACKET_PAIRS = { '(': ')', '[': ']', '{': '}' };
    const BACKSLASH_PAIRS = { '(': '\\)', '[': '\\]', '{': '\\}' };
    const ENVIRONMENTS = new Set([
        'align', 'align*', 'equation', 'equation*',
        'matrix', 'pmatrix', 'bmatrix', 'vmatrix',
        'cases', 'gathered', 'split',
    ]);

    function handleBracketCompletion(e) {
        if (!(e.key in BRACKET_PAIRS)) return;

        const start = latexInput.selectionStart;
        const end = latexInput.selectionEnd;
        const val = latexInput.value;
        const prevChar = start > 0 ? val[start - 1] : '';
        const closer = prevChar === '\\' ? BACKSLASH_PAIRS[e.key] : BRACKET_PAIRS[e.key];

        e.preventDefault();

        if (start !== end) {
            const selected = val.slice(start, end);
            latexInput.value = val.slice(0, start) + e.key + selected + closer + val.slice(end);
            latexInput.selectionStart = start + 1;
            latexInput.selectionEnd = end + 1;
        } else {
            latexInput.value = val.slice(0, start) + e.key + closer + val.slice(start);
            latexInput.selectionStart = start + 1;
            latexInput.selectionEnd = start + 1;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderLatex, 500);
    }

    function handleEnvironmentCompletion(e) {
        if (e.key !== 'Enter') return;
        if (latexInput.selectionStart !== latexInput.selectionEnd) return;

        const pos = latexInput.selectionStart;
        const val = latexInput.value;
        const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
        const lineText = val.slice(lineStart, pos);
        const match = lineText.match(/\\begin\{([^}]+)\}\s*$/);
        if (!match) return;

        const envName = match[1];
        if (!ENVIRONMENTS.has(envName)) return;

        e.preventDefault();

        const indent = lineText.match(/^(\s*)/)[1];
        const inner = '\n' + indent + '    ';
        const closing = '\n' + indent + '\\end{' + envName + '}';
        latexInput.value = val.slice(0, pos) + inner + closing + val.slice(pos);
        const cursorPos = pos + inner.length;
        latexInput.selectionStart = cursorPos;
        latexInput.selectionEnd = cursorPos;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderLatex, 500);
    }

    // ===================== Event Listeners =====================
    latexInput.addEventListener('keydown', (e) => {
        handleBracketCompletion(e);
        handleEnvironmentCompletion(e);
    });

    latexInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderLatex, 500);
    });

    downloadBtn.addEventListener('click', () => {
        if (!currentBlob) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    action: 'download',
                    dataUrl: reader.result,
                    filename: 'latex_render.png'
                });
            }
            addToHistory(currentLatex);
        };
        reader.readAsDataURL(currentBlob);
    });

    copyBtn.addEventListener('click', async () => {
        if (!currentBlob) return;
        try {
            await navigator.clipboard.write([new ClipboardItem({ [currentBlob.type]: currentBlob })]);
            addToHistory(currentLatex);
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.textContent = 'Copy Image';
                copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy image:', err);
        }
    });

    bookmarkCurrentBtn.addEventListener('click', () => {
        if (!currentLatex) return;
        toggleBookmark(currentLatex);
    });

    // ===================== Init =====================
    loadAll(() => {
        applySettingsToUI();
        renderHistoryList();
        renderBookmarksList();
        // Render initial equation
        setTimeout(renderLatex, 50);
    });

    latexInput.focus();
    latexInput.select();
});
