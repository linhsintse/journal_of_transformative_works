document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('auto-enable');
    const themeSelect = document.getElementById('theme-select');
    const formatBtn = document.getElementById('format-btn');
    const revertBtn = document.getElementById('revert-btn');

    // Load saved preferences
    chrome.storage.sync.get({ autoEnable: false, theme: 'theme-springer' }, (result) => {
        checkbox.checked = result.autoEnable;
        themeSelect.value = result.theme;
    });

    // Save preferences when changed
    checkbox.addEventListener('change', () => {
        chrome.storage.sync.set({ autoEnable: checkbox.checked });
    });

    themeSelect.addEventListener('change', () => {
        const selectedTheme = themeSelect.value;
        chrome.storage.sync.set({ theme: selectedTheme });
        
        // If the user changes the dropdown, auto-update the page instantly
        sendActionToTab("changeTheme", { theme: selectedTheme });
    });

    async function sendActionToTab(actionName, payload = {}) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url.includes("archiveofourown.org/works/")) {
                chrome.tabs.sendMessage(tab.id, { action: actionName, ...payload }, (response) => {
                    if (!chrome.runtime.lastError && actionName !== "changeTheme") {
                        window.close(); // Only close popup on format/revert clicks
                    }
                });
            } else if (actionName !== "changeTheme") {
                alert("This extension only works on an AO3 story page.");
            }
        } catch (error) {
            console.error("Popup error:", error);
        }
    }

    formatBtn.addEventListener('click', () => sendActionToTab("formatPaper"));
    revertBtn.addEventListener('click', () => sendActionToTab("revertPaper"));
});