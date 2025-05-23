// Background script for the bookmark manager extension

console.log('🚀 מארגן הסימניות המתקדם - Background Script פועל');

// התקנה ראשונית
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('📦 התוסף הותקן:', details.reason);
    
    if (details.reason === 'install') {
        console.log('🎉 התקנה ראשונית - פותח דף הגדרות');
        // פתיחת הדף המלא בהתקנה ראשונית
        await chrome.tabs.create({
            url: chrome.runtime.getURL('bookmarks.html')
        });
        
        // הודעה על התקנה מוצלחת
        showNotification('התקנה מוצלחת!', 'מארגן הסימניות המתקדם מוכן לשימוש');
    } else if (details.reason === 'update') {
        console.log('🔄 עדכון התוסף');
        showNotification('עדכון מוצלח!', 'מארגן הסימניות עודכן לגרסה החדשה');
    }
});

// טיפול בפקודות מקלדת
chrome.commands.onCommand.addListener(async (command) => {
    console.log('⌨️ פקודת מקלדת:', command);
    
    if (command === 'open-bookmarks') {
        await openBookmarksPage();
    }
});

// פתיחת הדף המלא
async function openBookmarksPage() {
    try {
        // בדיקה אם יש כבר כרטיסיה פתוחה עם הדף שלנו
        const tabs = await chrome.tabs.query({
            url: chrome.runtime.getURL('bookmarks.html')
        });
        
        if (tabs.length > 0) {
            // אם יש כרטיסיה פתוחה - עבור אליה
            await chrome.tabs.update(tabs[0].id, { active: true });
            await chrome.windows.update(tabs[0].windowId, { focused: true });
            console.log('🔄 עבר לכרטיסיה קיימת');
        } else {
            // אם אין - פתח כרטיסיה חדשה
            await chrome.tabs.create({
                url: chrome.runtime.getURL('bookmarks.html')
            });
            console.log('✨ פתח כרטיסיה חדשה');
        }
    } catch (error) {
        console.error('❌ שגיאה בפתיחת הדף:', error);
    }
}

// האזנה ללחיצה על האייקון (אופציונלי)
chrome.action.onClicked.addListener(async (tab) => {
    console.log('🖱️ לחיצה על האייקון');
    // אופציה: פתח דף מלא במקום popup
    // await openBookmarksPage();
});

// טיפול בהודעות מסקריפטים אחרים
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 הודעה נתקבלה:', message);
    
    switch (message.action) {
        case 'openBookmarks':
            openBookmarksPage();
            sendResponse({ success: true });
            break;
            
        case 'getBookmarkCount':
            getBookmarkCount().then(count => {
                sendResponse({ count });
            });
            return true; // אסינכרוני
            
        case 'showNotification':
            showNotification(message.title, message.message);
            sendResponse({ success: true });
            break;
            
        default:
            console.log('❓ פעולה לא מוכרת:', message.action);
            sendResponse({ error: 'פעולה לא מוכרת' });
    }
});

// ספירת סימניות (לסטטיסטיקות)
async function getBookmarkCount() {
    try {
        const bookmarkTree = await chrome.bookmarks.getTree();
        let count = 0;
        
        function countBookmarks(node) {
            if (node.url) {
                count++;
            }
            if (node.children) {
                node.children.forEach(countBookmarks);
            }
        }
        
        bookmarkTree.forEach(countBookmarks);
        return count;
    } catch (error) {
        console.error('❌ שגיאה בספירת סימניות:', error);
        return 0;
    }
}

// הצגת הודעות (אם יש הרשאות)
function showNotification(title, message) {
    try {
        // נסה ליצור התראה אם יש הרשאות
        if (chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: title,
                message: message
            });
        } else {
            console.log('📢 הודעה:', title, '-', message);
        }
    } catch (error) {
        console.log('📢 הודעה:', title, '-', message);
    }
}

// ניטור שינויים בסימניות (אופציונלי)
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    console.log('➕ סימנייה חדשה נוצרה:', bookmark.title);
});

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
    console.log('🗑️ סימנייה נמחקה:', id);
});

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
    console.log('✏️ סימנייה עודכנה:', id, changeInfo);
});

// ניקוי זיכרון cache (כל שעה)
setInterval(() => {
    console.log('🧹 ניקוי cache תקופתי');
    // כאן ניתן להוסיף ניקוי cache אם נצטרך
}, 60 * 60 * 1000); // שעה

console.log('✅ Background Script מוכן לפעולה');