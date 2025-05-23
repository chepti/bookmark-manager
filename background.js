// Background script for the bookmark manager extension

// Install event - set up initial data
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Bookmark Manager Extension installed');
    
    // Create context menu for bookmarks
    chrome.contextMenus.create({
        id: 'organizeBookmark',
        title: 'ארגן בסימניות',
        contexts: ['page', 'link']
    });
    
    chrome.contextMenus.create({
        id: 'addToBookmarks',
        title: 'הוסף לסימניות המובנות',
        contexts: ['page', 'link']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'organizeBookmark') {
        // Open the bookmark organizer
        chrome.action.openPopup();
    } else if (info.menuItemId === 'addToBookmarks') {
        // Add current page to bookmarks with smart categorization
        addSmartBookmark(tab, info.linkUrl);
    }
});

// Smart bookmark categorization
async function addSmartBookmark(tab, linkUrl = null) {
    try {
        const url = linkUrl || tab.url;
        const title = tab.title;
        
        // Analyze the URL to suggest a category
        const category = categorizeUrl(url);
        
        // Create bookmark in the suggested category
        const bookmark = await chrome.bookmarks.create({
            parentId: await getOrCreateCategoryFolder(category),
            title: title,
            url: url
        });
        
        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'סימנייה נוספה',
            message: `${title} נוסף לקטגוריה: ${category}`
        });
        
    } catch (error) {
        console.error('Error adding smart bookmark:', error);
    }
}

// Categorize URL based on domain and content
function categorizeUrl(url) {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Social media sites
    if (domain.includes('facebook') || domain.includes('twitter') || 
        domain.includes('instagram') || domain.includes('linkedin') ||
        domain.includes('tiktok') || domain.includes('youtube')) {
        return 'רשתות חברתיות';
    }
    
    // News sites
    if (domain.includes('news') || domain.includes('ynet') || 
        domain.includes('walla') || domain.includes('haaretz') ||
        domain.includes('maariv') || domain.includes('calcalist')) {
        return 'חדשות';
    }
    
    // Shopping sites
    if (domain.includes('amazon') || domain.includes('ebay') || 
        domain.includes('aliexpress') || domain.includes('zap') ||
        domain.includes('shop') || domain.includes('store')) {
        return 'קניות';
    }
    
    // Educational/Learning sites
    if (domain.includes('wikipedia') || domain.includes('coursera') || 
        domain.includes('udemy') || domain.includes('khan') ||
        domain.includes('edu') || domain.includes('learn')) {
        return 'למידה';
    }
    
    // Entertainment
    if (domain.includes('netflix') || domain.includes('spotify') || 
        domain.includes('entertainment') || domain.includes('games') ||
        domain.includes('movie') || domain.includes('music')) {
        return 'בידור';
    }
    
    // Work/Professional
    if (domain.includes('gmail') || domain.includes('office') || 
        domain.includes('slack') || domain.includes('zoom') ||
        domain.includes('drive') || domain.includes('docs')) {
        return 'עבודה';
    }
    
    // Tech/Development
    if (domain.includes('github') || domain.includes('stackoverflow') || 
        domain.includes('dev') || domain.includes('tech') ||
        domain.includes('code') || domain.includes('programming')) {
        return 'טכנולוגיה';
    }
    
    // Default category
    return 'כללי';
}

// Get or create category folder
async function getOrCreateCategoryFolder(categoryName) {
    try {
        // First, check if the category folder exists
        const bookmarkTree = await chrome.bookmarks.getTree();
        const bookmarkBar = bookmarkTree[0].children[0]; // Bookmark bar
        
        // Look for existing category folder
        const existingFolder = bookmarkBar.children?.find(
            child => child.title === categoryName && !child.url
        );
        
        if (existingFolder) {
            return existingFolder.id;
        }
        
        // Create new category folder
        const newFolder = await chrome.bookmarks.create({
            parentId: bookmarkBar.id,
            title: categoryName
        });
        
        return newFolder.id;
        
    } catch (error) {
        console.error('Error managing category folder:', error);
        return '1'; // Default to bookmark bar
    }
}

// Bookmark change listener for syncing
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    console.log('Bookmark created:', bookmark);
    // Could trigger UI refresh if popup is open
});

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
    console.log('Bookmark removed:', id);
    // Could trigger UI refresh if popup is open
});

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
    console.log('Bookmark changed:', id, changeInfo);
    // Could trigger UI refresh if popup is open
});

// Storage management for user preferences
async function saveUserPreferences(preferences) {
    try {
        await chrome.storage.sync.set({ userPreferences: preferences });
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
}

async function getUserPreferences() {
    try {
        const result = await chrome.storage.sync.get(['userPreferences']);
        return result.userPreferences || {
            defaultView: 'grid',
            sortBy: 'title',
            showPreviews: true,
            autoCategories: true
        };
    } catch (error) {
        console.error('Error getting preferences:', error);
        return {};
    }
}

// Export bookmarks functionality
async function exportBookmarks() {
    try {
        const bookmarkTree = await chrome.bookmarks.getTree();
        const exportData = {
            timestamp: new Date().toISOString(),
            bookmarks: bookmarkTree,
            version: '1.0'
        };
        
        return exportData;
    } catch (error) {
        console.error('Error exporting bookmarks:', error);
        throw error;
    }
}

// Import bookmarks functionality
async function importBookmarks(importData) {
    try {
        // Validate import data
        if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
            throw new Error('Invalid bookmark data format');
        }
        
        // Create import folder
        const importFolder = await chrome.bookmarks.create({
            parentId: '1',
            title: `Imported - ${new Date().toLocaleDateString('he-IL')}`
        });
        
        // Recursively import bookmarks
        await importBookmarkNode(importData.bookmarks[0], importFolder.id);
        
        return true;
    } catch (error) {
        console.error('Error importing bookmarks:', error);
        throw error;
    }
}

async function importBookmarkNode(node, parentId) {
    if (node.children) {
        // Create folder
        const folder = await chrome.bookmarks.create({
            parentId: parentId,
            title: node.title || 'Unnamed Folder'
        });
        
        // Import children
        for (const child of node.children) {
            await importBookmarkNode(child, folder.id);
        }
    } else if (node.url) {
        // Create bookmark
        await chrome.bookmarks.create({
            parentId: parentId,
            title: node.title || 'Untitled',
            url: node.url
        });
    }
}

// Message handling for communication with popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'exportBookmarks':
            exportBookmarks()
                .then(data => sendResponse({ success: true, data }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true; // Keep message channel open for async response
            
        case 'importBookmarks':
            importBookmarks(request.data)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
            
        case 'savePreferences':
            saveUserPreferences(request.preferences)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
            
        case 'getPreferences':
            getUserPreferences()
                .then(prefs => sendResponse({ success: true, preferences: prefs }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
            
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Periodic cleanup of old temporary data
chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        // Clean up old temporary data, cache, etc.
        console.log('Running periodic cleanup...');
    }
});

// Analytics for usage patterns (privacy-friendly)
function trackUsage(action) {
    // Only track general usage patterns, no personal data
    chrome.storage.local.get(['usageStats'], (result) => {
        const stats = result.usageStats || {};
        const today = new Date().toDateString();
        
        if (!stats[today]) {
            stats[today] = {};
        }
        
        stats[today][action] = (stats[today][action] || 0) + 1;
        
        // Keep only last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        Object.keys(stats).forEach(date => {
            if (new Date(date) < thirtyDaysAgo) {
                delete stats[date];
            }
        });
        
        chrome.storage.local.set({ usageStats: stats });
    });
}

// Extension startup
console.log('Bookmark Manager Extension background script loaded');