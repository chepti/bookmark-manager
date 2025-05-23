console.log('🔖 Popup Script נטען');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 מאתחל popup...');
    
    // כפתור פתיחת דף מלא
    document.getElementById('openFullPageBtn').addEventListener('click', () => {
        console.log('🖱️ לחיצה על פתח בדף מלא');
        chrome.runtime.sendMessage({ action: 'openBookmarks' });
        window.close();
    });

    // כפתור רענון
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        try {
            console.log('🔄 לחיצה על רענון');
            // שליחת הודעה לרענון
            chrome.runtime.sendMessage({ 
                action: 'showNotification',
                title: 'רענון',
                message: 'הסימניות מתרעננות...'
            });
            window.close();
        } catch (error) {
            console.error('שגיאה ברענון:', error);
        }
    });

    // טעינת סטטיסטיקות מהירות
    try {
        console.log('📊 טוען סטטיסטיקות...');
        const response = await chrome.runtime.sendMessage({ action: 'getBookmarkCount' });
        if (response && response.count) {
            document.getElementById('quickStats').textContent = 
                `יש לך ${response.count} סימניות`;
            console.log(`✅ נמצאו ${response.count} סימניות`);
        } else {
            document.getElementById('quickStats').textContent = 
                'לחץ כדי לראות את הסימניות שלך';
            console.log('⚠️ לא נמצאו סימניות');
        }
    } catch (error) {
        console.error('❌ שגיאה בטעינת סטטיסטיקות:', error);
        document.getElementById('quickStats').textContent = 
            'לחץ כדי לראות את הסימניות שלך';
    }
    
    console.log('✅ Popup מוכן');
}); 