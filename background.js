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
chrome.commands.onCommand.addListener((command) => {
    console.log('⌨️ פקודת מקלדת:', command);
    
    if (command === 'open-bookmarks') {
        openBookmarksPage();
    } else if (command === 'open-organic-garden') {
        openOrganicGarden();
    }
});

// פתיחת הדף המלא
async function openBookmarksPage() {
    try {
        console.log('📚 פותח דף סימניות...');
        
        // בדיקה אם יש כבר טאב פתוח
        const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('bookmarks.html') });
        
        if (tabs.length > 0) {
            // מעבר לטאב הקיים
            await chrome.tabs.update(tabs[0].id, { active: true });
            await chrome.windows.update(tabs[0].windowId, { focused: true });
            console.log('✅ עבר לטאב סימניות קיים');
        } else {
            // פתיחת טאב חדש
            await chrome.tabs.create({ 
                url: chrome.runtime.getURL('bookmarks.html'),
                active: true 
            });
            console.log('✅ נפתח טאב סימניות חדש');
        }
    } catch (error) {
        console.error('❌ שגיאה בפתיחת דף סימניות:', error);
    }
}

// פתיחת הגן הדיגיטלי
async function openOrganicGarden() {
    try {
        console.log('🌳 פותח את הגן הדיגיטלי...');
        
        // בדיקה אם יש כבר טאב פתוח
        const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('organic-bookmarks.html') });
        
        if (tabs.length > 0) {
            // מעבר לטאב הקיים
            await chrome.tabs.update(tabs[0].id, { active: true });
            await chrome.windows.update(tabs[0].windowId, { focused: true });
            console.log('✅ עבר לטאב הגן הדיגיטלי קיים');
        } else {
            // פתיחת טאב חדש
            await chrome.tabs.create({ 
                url: chrome.runtime.getURL('organic-bookmarks.html'),
                active: true 
            });
            console.log('✅ נפתח טאב הגן הדיגיטלי חדש');
        }
    } catch (error) {
        console.error('❌ שגיאה בפתיחת הגן הדיגיטלי:', error);
    }
}

// האזנה ללחיצה על האייקון (אופציונלי)
chrome.action.onClicked.addListener(async (tab) => {
    console.log('🖱️ לחיצה על האייקון');
    // אופציה: פתח דף מלא במקום popup
    // await openBookmarksPage();
});

// טיפול בהודעות מסקריפטים אחרים
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 הודעה התקבלה:', request);
    
    switch (request.action) {
        case 'openBookmarks':
            openBookmarksPage();
            break;
            
        case 'openOrganicGarden':
            openOrganicGarden();
            break;
            
        case 'getBookmarkCount':
            getBookmarkCount().then(count => {
                sendResponse({ count });
            });
            return true; // יחזיק את הערוץ פתוח לתשובה אסינכרונית
            
        case 'showNotification':
            chrome.notifications.create({
                type: 'basic',
                title: request.title || 'מארגן סימניות',
                message: request.message || 'פעולה בוצעה בהצלחה',
                iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMTIiIGZpbGw9IiM0Rjc5QTQiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHN0cm9rZT0iI0ZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo8L3N2Zz4='
            });
            break;
            
        default:
            console.log('❓ פעולה לא מוכרת:', request.action);
            sendResponse({ error: 'פעולה לא מוכרת' });
    }
});

// ספירת סימניות
async function getBookmarkCount() {
    try {
        console.log('🔢 סופר סימניות...');
        
        const bookmarkTree = await chrome.bookmarks.getTree();
        let count = 0;
        
        function countBookmarks(nodes) {
            for (const node of nodes) {
                if (node.url) {
                    count++;
                } else if (node.children) {
                    countBookmarks(node.children);
                }
            }
        }
        
        countBookmarks(bookmarkTree);
        console.log(`📊 נמצאו ${count} סימניות`);
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