// Application State
let releaseNotes = [];
let filteredNotes = [];
let currentFilter = 'all';
let currentSearchQuery = '';

// DOM Elements
const updatesContainer = document.getElementById('updatesContainer');
const searchInput = document.getElementById('searchInput');
const filterTabs = document.getElementById('filterTabs');
const refreshBtn = document.getElementById('refreshBtn');
const refreshIcon = document.getElementById('refreshIcon');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Stats Elements
const statTotal = document.getElementById('statTotal');
const statFeatures = document.getElementById('statFeatures');
const statAnnouncements = document.getElementById('statAnnouncements');
const statIssues = document.getElementById('statIssues');

// Modal Elements
const tweetModal = document.getElementById('tweetModal');
const tweetTextarea = document.getElementById('tweetTextarea');
const closeModalBtn = document.getElementById('closeModalBtn');
const postTweetBtn = document.getElementById('postTweetBtn');
const charCounter = document.getElementById('charCounter');
const charCount = document.getElementById('charCount');
const attachmentTitle = document.getElementById('attachmentTitle');
const attachmentLink = document.getElementById('attachmentLink');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// Active Tweet State
let activeTweetData = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Refresh Button
    refreshBtn.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase();
        applyFiltersAndSearch();
    });

    // Filter Tabs
    filterTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-item')) {
            // Update active tab UI
            document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            
            currentFilter = e.target.getAttribute('data-filter');
            applyFiltersAndSearch();
        }
    });

    // Close Modal
    closeModalBtn.addEventListener('click', closeTweetModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Textarea character count and validation
    tweetTextarea.addEventListener('input', () => {
        updateCharCount();
    });

    // Post Tweet Button click
    postTweetBtn.addEventListener('click', submitTweet);

    // Export to CSV Button
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportFilteredToCSV);
    }
}

// Fetch Release Notes from API
async function fetchReleaseNotes(force = false) {
    setLoadingState(true);
    try {
        const url = `/api/release-notes${force ? '?force_refresh=true' : ''}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        releaseNotes = data.updates || [];
        filteredNotes = [...releaseNotes];
        
        // Update stats dashboard
        calculateStats();
        
        // Render Notes
        renderReleaseNotes();
        
        // Show success status
        const fetchTime = data.last_updated ? data.last_updated.split(' ')[1] : new Date().toLocaleTimeString();
        setSuccessState(`Updated ${fetchTime}`);
        
        if (force) {
            showToast("Successfully fetched latest release notes!", "success");
        }
    } catch (error) {
        console.error("Error fetching release notes:", error);
        setErrorState("Failed to load");
        showToast("Error loading release notes. Please try again.", "error");
        updatesContainer.innerHTML = `
            <div class="no-results">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>Connection Error</h3>
                <p>We couldn't retrieve the release notes. Please check your network and try again.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="fetchReleaseNotes(true)">Retry Connection</button>
            </div>
        `;
    } finally {
        setLoadingState(false);
    }
}

// Calculate Stats for Dashboard
function calculateStats() {
    statTotal.textContent = releaseNotes.length;
    
    const features = releaseNotes.filter(n => n.type === 'Feature').length;
    statFeatures.textContent = features;
    
    const announcements = releaseNotes.filter(n => n.type === 'Announcement').length;
    statAnnouncements.textContent = announcements;
    
    const issues = releaseNotes.filter(n => ['Issue', 'Deprecated', 'Fixed'].includes(n.type)).length;
    statIssues.textContent = issues;
}

// Apply Filters and Search query to current state
function applyFiltersAndSearch() {
    filteredNotes = releaseNotes.filter(note => {
        // Filter match
        const matchesFilter = (currentFilter === 'all') || (note.type === currentFilter);
        
        // Search match
        const matchesSearch = 
            note.date.toLowerCase().includes(currentSearchQuery) ||
            note.type.toLowerCase().includes(currentSearchQuery) ||
            note.content_text.toLowerCase().includes(currentSearchQuery);
            
        return matchesFilter && matchesSearch;
    });
    
    renderReleaseNotes();
}

// Render release notes to feed container
function renderReleaseNotes() {
    if (filteredNotes.length === 0) {
        updatesContainer.innerHTML = `
            <div class="no-results">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3>No Updates Found</h3>
                <p>We couldn't find any updates matching "${currentSearchQuery || currentFilter}". Try adjusting your filters.</p>
            </div>
        `;
        return;
    }

    updatesContainer.innerHTML = '';
    
    filteredNotes.forEach((note, index) => {
        const typeClass = `badge-${note.type.toLowerCase()}`;
        const card = document.createElement('article');
        card.className = 'update-card';
        card.style.setProperty('--tag-color', `var(--color-${note.type.toLowerCase()}, var(--color-update))`);
        card.style.animation = `toast-in 0.4s ease forwards ${index * 0.05}s`;
        card.style.opacity = '0';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-meta">
                    <span class="badge ${typeClass}">${note.type}</span>
                    <time class="card-date" datetime="${note.timestamp}">${note.date}</time>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary btn-icon-only card-share-action" title="Tweet update" onclick="openTweetComposer('${note.id}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </button>
                    <button class="btn btn-secondary btn-icon-only card-share-action" title="Copy Content to Clipboard" onclick="copyCardContent('${note.id}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="btn btn-secondary btn-icon-only card-share-action" title="Copy Direct Link" onclick="copyDirectLink('${note.link}')">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="card-body">
                ${note.content_html}
            </div>
            
            <div class="card-footer">
                <a href="${note.link}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.4rem 0.8rem;">
                    View in Official Docs
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>
        `;
        
        updatesContainer.appendChild(card);
    });
}

// Set Loading UI States
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshIcon.classList.add('spinner');
        refreshBtn.disabled = true;
        statusDot.className = 'status-dot loading';
        statusText.textContent = "Loading...";
    } else {
        refreshIcon.classList.remove('spinner');
        refreshBtn.disabled = false;
    }
}

function setSuccessState(text) {
    statusDot.className = 'status-dot';
    statusText.textContent = text;
}

function setErrorState(text) {
    statusDot.className = 'status-dot';
    statusDot.style.backgroundColor = '#F43F5E';
    statusDot.style.boxShadow = '0 0 8px #F43F5E';
    statusText.textContent = text;
}

// Toast System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = '';
    if (type === 'success') {
        icon = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`;
    } else {
        icon = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>`;
    }
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    // Auto-remove
    setTimeout(() => {
        toast.style.animation = 'toast-in 0.3s reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Copy Direct Link
function copyDirectLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showToast("Link copied to clipboard!");
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        showToast("Failed to copy link.", "error");
    });
}

// Open Tweet Modal with populated text
window.openTweetComposer = function(noteId) {
    const note = releaseNotes.find(n => n.id === noteId);
    if (!note) return;
    
    activeTweetData = note;
    
    // Compose dynamic default text
    // E.g., "BigQuery Feature (June 17): You can enable autonomous embedding generation on new or existing tables..."
    const prefix = `Google #BigQuery ${note.type} update (${note.date}):\n\n`;
    
    // Clean text and make sure it fits
    let desc = note.content_text;
    
    // Default tweet templates
    let text = `${prefix}${desc}`;
    
    tweetTextarea.value = text;
    
    // Update link attachments in modal UI
    attachmentTitle.textContent = `${note.type}: BigQuery Release Notes`;
    attachmentLink.textContent = note.link;
    
    // Open modal
    tweetModal.classList.add('open');
    updateCharCount();
    
    // Focus textarea
    setTimeout(() => tweetTextarea.focus(), 100);
};

function closeTweetModal() {
    tweetModal.classList.remove('open');
    activeTweetData = null;
}

// Update Twitter character counts
// Note: Twitter calculates links as 23 characters regardless of length.
function updateCharCount() {
    const text = tweetTextarea.value;
    
    // We assume the user attaches a link (which counts as 23 chars)
    // plus a space and some formatting. Let's calculate:
    const linkLength = 23;
    const spacingLength = 2; // "\n\n" or similar
    
    const textLength = text.length;
    const totalLength = textLength + spacingLength + linkLength;
    
    charCount.textContent = totalLength;
    
    if (totalLength > 280) {
        charCounter.classList.add('limit-exceeded');
        postTweetBtn.disabled = true;
    } else {
        charCounter.classList.remove('limit-exceeded');
        postTweetBtn.disabled = false;
    }
}

// Open window to post Tweet
function submitTweet() {
    if (!activeTweetData) return;
    
    const tweetText = tweetTextarea.value;
    const link = activeTweetData.link;
    
    // Twitter Web Intent format:
    // https://twitter.com/intent/tweet?text=TEXT&url=URL
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(link)}`;
    
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
    closeTweetModal();
    showToast("Opening X (Twitter)...");
}

// Copy Card Content
window.copyCardContent = function(noteId) {
    const note = releaseNotes.find(n => n.id === noteId);
    if (!note) return;
    
    const textToCopy = `Google BigQuery ${note.type} Update (${note.date})\n\n${note.content_text}\n\nRead more: ${note.link}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Update content copied!");
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        showToast("Failed to copy content.", "error");
    });
};

// Export current filtered notes to CSV
function exportFilteredToCSV() {
    if (filteredNotes.length === 0) {
        showToast("No updates to export.", "error");
        return;
    }
    
    // CSV Headers
    const headers = ["ID", "Date", "Timestamp", "Type", "Content", "Link"];
    
    // Convert notes to CSV rows
    const rows = filteredNotes.map(note => {
        return [
            note.id,
            note.date,
            note.timestamp,
            note.type,
            note.content_text,
            note.link
        ].map(val => {
            // Escape double quotes and wrap in quotes
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(",");
    });
    
    // Join header and rows
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Set file name based on current filters/search
    const filterName = currentFilter !== 'all' ? `-${currentFilter.toLowerCase()}` : '';
    const searchName = currentSearchQuery ? `-${currentSearchQuery.replace(/[^a-z0-9]/gi, '_')}` : '';
    const filename = `bigquery-release-notes${filterName}${searchName}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${filteredNotes.length} updates to CSV!`);
}
