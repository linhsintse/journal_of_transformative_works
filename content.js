
async function initAcademicLayout() {
    
    const url = new URL(window.location.href);
    const workId = url.pathname.split('/')[2];
    const isMultiChapter = document.querySelector('.chapter.preface.group');
    const isFullWorkView = url.searchParams.get('view_full_work') === 'true';

    let extractionDocument = document;

    if (isMultiChapter && !isFullWorkView) {
        showLoadingState();
        try {
            // Fetch the full work HTML in the background
            const response = await fetch(`https://archiveofourown.org/works/${workId}?view_full_work=true`);
            const htmlText = await response.text();
            
            // Parse the returned HTML string into a virtual DOM
            const parser = new DOMParser();
            extractionDocument = parser.parseFromString(htmlText, 'text/html');
        } catch (error) {
            console.error("Failed to fetch full work:", error);
            alert("Network error: Could not compile the full paper.");
            removeLoadingState();
            return;
        }
    }

    const paperData = extractData(extractionDocument);
    
    renderAcademicPaper(paperData);
}

function showLoadingState() {
    const loader = document.createElement('div');
    loader.id = 'academic-loader';
    loader.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: white; z-index: 999999; display: flex;
        justify-content: center; align-items: center; font-family: sans-serif;
    `;
    loader.innerHTML = `<h2>Compiling Research Paper...</h2>`;
    document.body.appendChild(loader);
}

function removeLoadingState() {
    const loader = document.getElementById('academic-loader');
    if (loader) loader.remove();
}

function extractData(doc) {
    const getHTML = (selector) => doc.querySelector(selector)?.innerHTML || '';
    const getText = (selector) => doc.querySelector(selector)?.textContent?.trim() || '';
    
    const tagElements = doc.querySelectorAll('.tags.commas .tag');
    const keywords = Array.from(tagElements).map(tag => tag.textContent?.trim()).filter(Boolean).join(', ');

    return {
        title: getText('h2.title.heading'),
        authors: getText('h3.byline.heading') || 'Anonymous',
        summary: getHTML('.summary.module blockquote.userstuff'),
        keywords: keywords || 'No keywords provided.',
        publishDate: getText('dd.published'),
        wordCount: getText('dd.words'),
        notes: getHTML('.notes.module blockquote.userstuff'),
        text: getHTML('#workskin') 
    };
}

function renderAcademicPaper(data) {
    removeLoadingState();

    const paperContainer = document.createElement('div');
    paperContainer.id = 'academic-paper-wrapper';

    paperContainer.innerHTML = `
        <header class="academic-header">
            <div class="journal-branding">Archive of Our Own | Published: ${data.publishDate} | Words: ${data.wordCount}</div>
            <h1 class="paper-title">${data.title}</h1>
            <h2 class="paper-authors">${data.authors}</h2>
        </header>

        ${data.summary ? `
        <section class="academic-abstract">
            <h3>Abstract</h3>
            <div class="abstract-content">${data.summary}</div>
            <p class="academic-keywords"><strong>Keywords:</strong> ${data.keywords}</p>
        </section>` : ''}

        <article class="academic-body">
            ${data.text}
        </article>

        ${data.notes ? `
        <footer class="academic-appendix">
            <h3>Appendix</h3>
            <div class="appendix-content">${data.notes}</div>
        </footer>` : ''}
    `;

    const originalBody = document.querySelector('#outer');
    if (originalBody) {
        originalBody.style.display = 'none'; 
    }
    
    document.body.appendChild(paperContainer);
}

function isPageFormatted() {
    return document.getElementById('academic-paper-wrapper') !== null || document.getElementById('academic-loader') !== null;
}

function triggerFormatting() {
    console.log("AO3 Reader: Formatting triggered!"); // <-- Check for this in your F12 console
    if (!isPageFormatted()) {
        initAcademicLayout();
    } else {
        console.log("AO3 Reader: Page is already formatted, ignoring.");
    }
}

function revertLayout() {
    console.log("AO3 Reader: Reverting layout...");
    // A hard reload is the safest way to guarantee a clean AO3 slate
    window.location.reload(); 
}

// 1. Check if the user wants it to run automatically on page load
chrome.storage.sync.get({ autoEnable: false }, (result) => {
    console.log("AO3 Reader: Auto-enable is set to " + result.autoEnable);
    if (result.autoEnable) {
        triggerFormatting();
    }
});

// 2. Listen for a manual click from the popup menu
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("AO3 Reader: Received message from popup -", request.action);
    
    if (request.action === "checkState") {
        sendResponse({ isFormatted: isPageFormatted() });
    } else if (request.action === "formatPaper") {
        triggerFormatting();
        sendResponse({status: "success"});
    } else if (request.action === "revertPaper") {
        revertLayout();
        sendResponse({status: "success"});
    }
});