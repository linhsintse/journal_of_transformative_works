
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

    // The Master Layout Container
    const masterContainer = document.createElement('div');
    masterContainer.id = 'academic-master-layout';

    masterContainer.innerHTML = `
        <nav class="academic-top-nav">
            <div class="nav-content">
                <div class="nav-brand">Journal of Transformative Works</div>
                <ul class="nav-links">
                    <li><a href="#">Browse Articles</a></li>
                    <li><a href="#">Search Database</a></li>
                    <li><a href="#">About the Journal</a></li>
                </ul>
            </div>
        </nav>

        <div class="academic-grid">
            
            <main id="academic-paper-wrapper">
                <header class="academic-header">
                    <h1 class="paper-title">${data.title}</h1>
                    <h2 class="paper-authors">${data.authors}</h2>
                    <div class="journal-branding">Published: ${data.publishDate} | Word Count: ${data.wordCount}</div>
                </header>

                ${data.summary ? `
                <section class="academic-abstract">
                    <h3>Abstract</h3>
                    <div class="abstract-content">${data.summary}</div>
                    <div class="academic-keywords"><strong>Keywords:</strong> ${data.keywords}</div>
                </section>` : ''}

                <article class="academic-body">
                    ${data.text}
                </article>

                ${data.notes ? `
                <footer class="academic-appendix">
                    <h3>Appendix / Notes</h3>
                    <div class="appendix-content">${data.notes}</div>
                </footer>` : ''}
            </main>

            <aside class="academic-sidebar">
                <div class="sidebar-block primary-actions">
                    <button class="action-btn download-btn">Download PDF</button>
                    <button class="action-btn cite-btn">Cite this paper</button>
                </div>

                <div class="sidebar-block">
                    <h4>Article Metrics</h4>
                    <ul class="sidebar-links">
                        <li><a href="#">Citations (0)</a></li>
                        <li><a href="#">Altmetric Score</a></li>
                        <li><a href="#">Accesses (Kudos)</a></li>
                    </ul>
                </div>

                <div class="sidebar-block">
                    <h4>Related Content</h4>
                    <ul class="sidebar-links">
                        <li><a href="#">Similar articles in this Fandom</a></li>
                        <li><a href="#">Other works by these Authors</a></li>
                        <li><a href="#">View Collection</a></li>
                    </ul>
                </div>
            </aside>
        </div>
    `;

    // Hide the original AO3 layout
    const originalBody = document.querySelector('#outer');
    if (originalBody) {
        originalBody.style.display = 'none'; 
    }
    
    // Inject the new layout
    document.body.appendChild(masterContainer);
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