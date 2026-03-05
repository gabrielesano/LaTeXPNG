chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'download' && message.dataUrl) {
        chrome.downloads.download({
            url: message.dataUrl,
            filename: message.filename || 'latex_render.png'
        }, (downloadId) => {
            sendResponse({ success: !!downloadId });
        });
        return true; // keep channel open for async response
    }
});
