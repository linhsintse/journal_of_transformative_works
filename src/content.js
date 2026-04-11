
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

function renderAcademicPaper(data, themeClass) {
    removeLoadingState();

    const masterContainer = document.createElement('div');
    masterContainer.id = 'academic-master-layout';
    const fandomElement = document.querySelector('dd.fandom a');
    const fandom = fandomElement ? fandomElement.innerText : 'Literature';

    masterContainer.className = themeClass; 
    
    masterContainer.innerHTML = `
        <nav class="academic-top-nav">
            <div class="nav-content">
                <div class="nav-brand">Journal of Transformative Works</div>
                <ul class="nav-links">
                    <li><a href="#">Search</a></li>
                    <li><a href="#">Login</a></li>
                </ul>
            </div>
        </nav>

        <div class="academic-grid">
            <main id="academic-paper-wrapper">
                
                <nav class="academic-breadcrumbs">
                    <a href="#">Home</a> <span class="separator">/</span> 
                    <a href="#">${fandom}</a> <span class="separator">/</span> 
                    <span class="current-page">Article</span>
                </nav>

                <header class="academic-header">
                    <div class="content-type">Original Research</div>
                    <h1 class="paper-title">${data.title}</h1>
                    <h2 class="paper-authors">${data.authors}</h2>
                    <div class="journal-branding">
                        <span>Published: ${data.publishDate}</span>
                        <span>Words: ${data.wordCount}</span>
                    </div>
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
                    <h3>Author Information & Notes</h3>
                    <div class="appendix-content">${data.notes}</div>
                </footer>` : ''}
            </main>

            <aside class="academic-sidebar">
                
                <div class="ac-button-group">
                    <button class="ac-sidebar-btn ac-primary-btn">
                        Download PDF 
                        <span class="ac-btn-subtext">View offline</span>
                    </button>
                    <button class="ac-sidebar-btn ac-secondary-btn">Cite this paper</button>
                </div>

                <div class="sidebar-accordion">
                    <div class="accordion-item">
                        <a href="#">Sections</a>
                    </div>
                    <div class="accordion-item">
                        <a href="#">Abstract</a>
                    </div>
                    <div class="accordion-item">
                        <a href="#">Author information</a>
                    </div>
                    <div class="accordion-item">
                        <a href="#">Rights and permissions</a>
                    </div>
                </div>

                <div class="sidebar-block metrics-block">
                    <h4>Metrics</h4>
                    <div class="metric-item"><strong>0</strong> Citations</div>
                    <div class="metric-item"><strong>${data.wordCount}</strong> Words</div>
                </div>
            </aside>
        </div>
    `;

    const originalBody = document.querySelector('#outer');
    if (originalBody) originalBody.style.display = 'none'; 
    document.body.appendChild(masterContainer);
}

let isFormatted = false;

function triggerFormatting(themeClass) {
    if (!isFormatted) {
        initAcademicLayout(themeClass); 
        isFormatted = true;
    }
}

function revertLayout() {
    window.location.reload(); 
}

function swapTheme(newTheme) {
    const layout = document.getElementById('academic-master-layout');
    if (layout) {
        layout.className = newTheme; // Instantly swaps the CSS context
    }
}

chrome.storage.sync.get({ autoEnable: false, theme: 'theme-springer' }, (result) => {
    window.currentTheme = result.theme; 
    
    initAcademicLayout = async function() {
       const paperData = extractData(extractionDocument);
       renderAcademicPaper(paperData, window.currentTheme); // <--- Pass it here
    };

    if (result.autoEnable) triggerFormatting(window.currentTheme);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "formatPaper") {
        chrome.storage.sync.get({ theme: 'theme-springer' }, (result) => {
            triggerFormatting(result.theme);
        });
        sendResponse({status: "success"});
    } else if (request.action === "revertPaper") {
        revertLayout();
        sendResponse({status: "success"});
    } else if (request.action === "changeTheme") {
        window.currentTheme = request.theme;
        swapTheme(request.theme); // Live swap without reloading the page!
        sendResponse({status: "success"});
    }
});