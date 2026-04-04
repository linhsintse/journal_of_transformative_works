document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('auto-enable');
    const formatBtn = document.getElementById('format-btn');
    const revertBtn = document.getElementById('revert-btn');

    chrome.storage.sync.get({ autoEnable: false }, (result) => {
        checkbox.checked = result.autoEnable;
    });

    checkbox.addEventListener('change', () => {
        chrome.storage.sync.set({ autoEnable: checkbox.checked });
    });

    async function sendActionToTab(actionName) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab && tab.url && tab.url.includes("archiveofourown.org/works/")) {
                // 1. Ask the content script for its current formatting state
                chrome.tabs.sendMessage(tab.id, { action: "checkState" }, (stateResponse) => {
                    if (chrome.runtime.lastError) {
                        console.error("Connection failed. Did you refresh the AO3 tab?", chrome.runtime.lastError);
                        alert("Cannot connect to the page. Please refresh the AO3 tab and try again.");
                        return;
                    }

                    // 2. Test if the action is valid based on the current state
                    const isFormatted = stateResponse && stateResponse.isFormatted;
                    
                    if (actionName === "formatPaper" && isFormatted) {
                        alert("The page is already formatted!");
                        return; 
                    }
                    if (actionName === "revertPaper" && !isFormatted) {
                        alert("The page is already in its normal state.");
                        return; 
                    }

                    // 3. Send the actual action and close the popup menu
                    chrome.tabs.sendMessage(tab.id, { action: actionName }, (response) => {
                        window.close();
                    });
                });
            } else {
                alert("This extension only works on an AO3 story page.");
            }
        } catch (error) {
            console.error("Popup error:", error);
        }
    }

    formatBtn.addEventListener('click', () => sendActionToTab("formatPaper"));
    revertBtn.addEventListener('click', () => sendActionToTab("revertPaper"));
});