// Content script for bookmark manager extension
// Handles page analysis and quick bookmark features

(function() {
    'use strict';
    
    // Quick bookmark button functionality
    let quickBookmarkButton = null;
    let isBookmarkButtonVisible = false;
    
    // Initialize content script
    function init() {
        createQuickBookmarkButton();
        setupPageAnalysis();
        setupKeyboardShortcuts();
        detectBookmarkableContent();
    }
    
    // Create floating quick bookmark button
    function createQuickBookmarkButton() {
        quickBookmarkButton = document.createElement('div');
        quickBookmarkButton.id = 'bookmark-quick-btn';
        quickBookmarkButton.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 999999;
                background: linear-gradient(45deg, #3498db, #2980b9);
                color: white;
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
                transition: all 0.3s ease;
                opacity: 0;
                transform: scale(0.8);
            " title="הוסף לסימניות">
                🔖
            </div>
        `;
        
        const button = quickBookmarkButton.firstElementChild;
        
        // Add hover effects
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.4)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.3)';
        });
        
        // Add click handler
        button.addEventListener('click', () => {
            addCurrentPageToBookmarks();
        });
        
        document.body.appendChild(quickBookmarkButton);
        
        // Show button after a delay
        setTimeout(() => {
            showQuickBookmarkButton();
        }, 2000);
        
        // Hide button after inactivity
        let hideTimeout;
        const resetHideTimeout = () => {
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                hideQuickBookmarkButton();
            }, 10000);
        };
        
        document.addEventListener('mousemove', resetHideTimeout);
        document.addEventListener('keypress', resetHideTimeout);
        resetHideTimeout();
    }
    
    function showQuickBookmarkButton() {
        if (quickBookmarkButton && !isBookmarkButtonVisible) {
            const button = quickBookmarkButton.firstElementChild;
            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
            isBookmarkButtonVisible = true;
        }
    }
    
    function hideQuickBookmarkButton() {
        if (quickBookmarkButton && isBookmarkButtonVisible) {
            const button = quickBookmarkButton.firstElementChild;
            button.style.opacity = '0';
            button.style.transform = 'scale(0.8)';
            isBookmarkButtonVisible = false;
        }
    }
    
    // Add current page to bookmarks with smart categorization
    async function addCurrentPageToBookmarks() {
        try {
            const pageData = analyzeCurrentPage();
            
            // Send message to background script for smart categorization
            const response = await chrome.runtime.sendMessage({
                action: 'addSmartBookmark',
                data: pageData
            });
            
            // Show success notification
            showNotification('הסימנייה נוספה בהצלחה!', 'success');
            
            // Animate button to show success
            const button = quickBookmarkButton.firstElementChild;
            button.innerHTML = '✅';
            button.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
            
            setTimeout(() => {
                button.innerHTML = '🔖';
                button.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
            }, 2000);
            
        } catch (error) {
            console.error('Error adding bookmark:', error);
            showNotification('שגיאה בהוספת הסימנייה', 'error');
        }
    }
    
    // Analyze current page for smart categorization
    function analyzeCurrentPage() {
        const title = document.title;
        const url = window.location.href;
        const domain = window.location.hostname;
        
        // Extract meta information
        const description = document.querySelector('meta[name="description"]')?.content || '';
        const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
        
        // Analyze page content
        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
            .map(h => h.textContent.trim())
            .filter(Boolean);
        
        // Check for specific content types
        const hasVideo = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length > 0;
        const hasArticle = document.querySelector('article') !== null;
        const hasShoppingCart = document.querySelector('[class*="cart"], [id*="cart"], [class*="shop"], [id*="shop"]') !== null;
        const hasLoginForm = document.querySelector('input[type="password"]') !== null;
        
        return {
            title,
            url,
            domain,
            description,
            keywords,
            headings: headings.slice(0, 5), // Top 5 headings
            contentType: {
                hasVideo,
                hasArticle,
                hasShoppingCart,
                hasLoginForm
            },
            timestamp: new Date().toISOString()
        };
    }
    
    // Setup page analysis for automatic categorization suggestions
    function setupPageAnalysis() {
        // Monitor for dynamic content changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if new content might be bookmarkable
                    detectBookmarkableContent();
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Detect content that might be worth bookmarking
    function detectBookmarkableContent() {
        // Look for articles, tutorials, important forms, etc.
        const importantSelectors = [
            'article',
            '[role="article"]',
            '.article',
            '.post',
            '.tutorial',
            '.guide',
            '.documentation',
            'main[role="main"]'
        ];
        
        const hasImportantContent = importantSelectors.some(selector => 
            document.querySelector(selector) !== null
        );
        
        if (hasImportantContent && !isBookmarkButtonVisible) {
            showQuickBookmarkButton();
        }
    }
    
    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+B - Quick bookmark
            if (e.ctrlKey && e.shiftKey && e.key === 'B') {
                e.preventDefault();
                addCurrentPageToBookmarks();
            }
            
            // Ctrl+Shift+O - Open bookmark organizer
            if (e.ctrlKey && e.shiftKey && e.key === 'O') {
                e.preventDefault();
                chrome.runtime.sendMessage({ action: 'openBookmarkOrganizer' });
            }
        });
    }
    
    // Show notification to user
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000000;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Highlight bookmarkable links on page
    function highlightBookmarkableLinks() {
        const links = document.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const href = link.href;
            const text = link.textContent.trim();
            
            // Check if link seems important/bookmarkable
            const isImportant = (
                text.length > 10 && 
                !href.includes('#') && 
                !href.startsWith('mailto:') &&
                !href.startsWith('tel:') &&
                (text.includes('article') || 
                 text.includes('tutorial') || 
                 text.includes('guide') ||
                 text.includes('documentation') ||
                 link.querySelector('img'))
            );
            
            if (isImportant) {
                // Add bookmark icon to important links
                const bookmarkIcon = document.createElement('span');
                bookmarkIcon.innerHTML = ' 🔖';
                bookmarkIcon.style.cssText = `
                    opacity: 0.6;
                    font-size: 12px;
                    cursor: pointer;
                    margin-left: 5px;
                `;
                
                bookmarkIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Add this specific link to bookmarks
                    chrome.runtime.sendMessage({
                        action: 'addSmartBookmark',
                        data: {
                            title: text,
                            url: href,
                            domain: new URL(href).hostname
                        }
                    });
                    
                    showNotification(`הקישור "${text}" נוסף לסימניות`, 'success');
                });
                
                link.appendChild(bookmarkIcon);
            }
        });
    }
    
    // Extract structured data from page (for better categorization)
    function extractStructuredData() {
        const structuredData = {};
        
        // JSON-LD structured data
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        jsonLdScripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@type']) {
                    structuredData.type = data['@type'];
                    structuredData.jsonLd = data;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        });
        
        // Open Graph data
        const ogTags = document.querySelectorAll('meta[property^="og:"]');
        const openGraph = {};
        ogTags.forEach(tag => {
            const property = tag.getAttribute('property').replace('og:', '');
            openGraph[property] = tag.getAttribute('content');
        });
        
        if (Object.keys(openGraph).length > 0) {
            structuredData.openGraph = openGraph;
        }
        
        // Twitter Card data
        const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
        const twitterCard = {};
        twitterTags.forEach(tag => {
            const name = tag.getAttribute('name').replace('twitter:', '');
            twitterCard[name] = tag.getAttribute('content');
        });
        
        if (Object.keys(twitterCard).length > 0) {
            structuredData.twitterCard = twitterCard;
        }
        
        return structuredData;
    }
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'analyzeCurrentPage':
                const pageData = analyzeCurrentPage();
                const structuredData = extractStructuredData();
                sendResponse({
                    success: true,
                    data: { ...pageData, structuredData }
                });
                break;
                
            case 'highlightBookmarkableContent':
                highlightBookmarkableLinks();
                sendResponse({ success: true });
                break;
                
            case 'showQuickBookmark':
                showQuickBookmarkButton();
                sendResponse({ success: true });
                break;
                
            case 'hideQuickBookmark':
                hideQuickBookmarkButton();
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Cleanup when page unloads
    window.addEventListener('beforeunload', () => {
        if (quickBookmarkButton && quickBookmarkButton.parentNode) {
            quickBookmarkButton.parentNode.removeChild(quickBookmarkButton);
        }
    });
    
})();