console.log('🔖 מארגן הסימניות - הופעל');

class BookmarkManager {
    constructor() {
        this.allBookmarks = [];
        this.filteredBookmarks = [];
        this.currentFolder = null;
        this.init();
    }

    async init() {
        console.log('🚀 מאתחל את מארגן הסימניות...');
        this.setupEventListeners();
        await this.loadBookmarks();
    }

    setupEventListeners() {
        console.log('⚙️ מגדיר event listeners...');
        
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchBookmarks(e.target.value);
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshBookmarks();
        });
    }

    async loadBookmarks() {
        console.log('📚 מתחיל לטעון סימניות...');
        
        try {
            // בדיקה שה-API זמין
            if (!chrome || !chrome.bookmarks) {
                throw new Error('ה-API של סימניות אינו זמין');
            }
            console.log('✅ API של סימניות זמין');

            // טעינת עץ הסימניות
            const bookmarkTree = await chrome.bookmarks.getTree();
            console.log('📁 עץ סימניות נטען:', bookmarkTree);

            if (!bookmarkTree || !bookmarkTree[0]) {
                throw new Error('לא ניתן לטעון את עץ הסימניות');
            }

            // המרה לרשימה שטוחה
            this.allBookmarks = this.flattenBookmarks(bookmarkTree[0]);
            this.filteredBookmarks = [...this.allBookmarks];
            
            console.log(`📋 נטענו ${this.allBookmarks.length} סימניות`);

            // עדכון התצוגה
            this.renderFolderTree();
            this.renderBookmarks();

            if (this.allBookmarks.length === 0) {
                this.showMessage('אין סימניות בכרום. הוסף סימניות ולחץ רענן.', 'info');
            } else {
                this.showMessage(`נטענו ${this.allBookmarks.length} סימניות בהצלחה!`, 'success');
            }

        } catch (error) {
            console.error('❌ שגיאה בטעינת סימניות:', error);
            this.showError(`שגיאה: ${error.message}`);
        }
    }

    flattenBookmarks(node, path = []) {
        let bookmarks = [];
        
        if (node.children) {
            for (const child of node.children) {
                if (child.url) {
                    // זוהי סימנייה
                    bookmarks.push({
                        ...child,
                        path: [...path, node.title].filter(Boolean)
                    });
                } else {
                    // זוהי תיקייה - רקורסיה
                    bookmarks = bookmarks.concat(
                        this.flattenBookmarks(child, [...path, node.title].filter(Boolean))
                    );
                }
            }
        }
        
        return bookmarks;
    }

    renderFolderTree() {
        const folderTree = document.getElementById('folderTree');
        
        // יצירת רשימת תיקיות ייחודיות
        const folders = new Set();
        this.allBookmarks.forEach(bookmark => {
            bookmark.path.forEach((folder, index) => {
                const path = bookmark.path.slice(0, index + 1).join('/');
                folders.add(path);
            });
        });

        const sortedFolders = Array.from(folders).sort();
        
        folderTree.innerHTML = `
            <div class="folder-item active" data-folder="all">
                <span class="folder-icon">🌐</span>
                כל הסימניות
                <span class="folder-count">${this.allBookmarks.length}</span>
            </div>
            ${sortedFolders.map(folder => {
                const count = this.allBookmarks.filter(b => b.path.join('/') === folder).length;
                return `
                    <div class="folder-item" data-folder="${folder}">
                        <span class="folder-icon">📁</span>
                        ${folder.split('/').pop()}
                        <span class="folder-count">${count}</span>
                    </div>
                `;
            }).join('')}
        `;

        // הוספת event listeners לתיקיות
        folderTree.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectFolder(item.dataset.folder);
                folderTree.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    selectFolder(folderPath) {
        console.log(`📂 נבחרה תיקייה: ${folderPath}`);
        
        if (folderPath === 'all') {
            this.filteredBookmarks = [...this.allBookmarks];
        } else {
            this.filteredBookmarks = this.allBookmarks.filter(bookmark => 
                bookmark.path.join('/') === folderPath
            );
        }
        this.renderBookmarks();
    }

    renderBookmarks() {
        const container = document.getElementById('bookmarksList');
        
        if (this.filteredBookmarks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>📭</div>
                    <div>אין סימניות להצגה</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredBookmarks.map(bookmark => `
            <div class="bookmark-item" data-id="${bookmark.id}" data-url="${bookmark.url}">
                <div class="bookmark-title">
                    <img class="bookmark-favicon" src="chrome://favicon/${bookmark.url}" 
                         onerror="this.style.display='none'">
                    ${bookmark.title || 'ללא כותרת'}
                </div>
                <div class="bookmark-url">${this.shortenUrl(bookmark.url)}</div>
                ${bookmark.path.length > 0 ? `<div class="bookmark-path">${bookmark.path.join(' > ')}</div>` : ''}
                <div class="bookmark-actions">
                    <button class="action-btn edit" title="עריכה">✏️</button>
                    <button class="action-btn delete" title="מחיקה">🗑️</button>
                </div>
            </div>
        `).join('');

        this.setupBookmarkListeners();
    }

    setupBookmarkListeners() {
        document.querySelectorAll('.bookmark-item').forEach(item => {
            // קליק לפתיחה
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn')) {
                    window.open(item.dataset.url, '_blank');
                }
            });

            // כפתורי פעולה
            const editBtn = item.querySelector('.edit');
            const deleteBtn = item.querySelector('.delete');

            editBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editBookmark(item.dataset.id);
            });

            deleteBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteBookmark(item.dataset.id);
            });
        });
    }

    searchBookmarks(query) {
        console.log(`🔍 חיפוש: "${query}"`);
        
        if (!query.trim()) {
            this.filteredBookmarks = [...this.allBookmarks];
        } else {
            this.filteredBookmarks = this.allBookmarks.filter(bookmark =>
                bookmark.title.toLowerCase().includes(query.toLowerCase()) ||
                bookmark.url.toLowerCase().includes(query.toLowerCase())
            );
        }
        this.renderBookmarks();
    }

    async refreshBookmarks() {
        console.log('🔄 מרענן סימניות...');
        
        document.getElementById('bookmarksList').innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div>טוען סימניות...</div>
            </div>
        `;
        
        await this.loadBookmarks();
    }

    async editBookmark(id) {
        const bookmark = this.allBookmarks.find(b => b.id === id);
        if (!bookmark) return;

        const newTitle = prompt('כותרת חדשה:', bookmark.title);
        if (newTitle && newTitle !== bookmark.title) {
            try {
                await chrome.bookmarks.update(id, { title: newTitle });
                this.showMessage('הסימנייה עודכנה בהצלחה', 'success');
                await this.refreshBookmarks();
            } catch (error) {
                console.error('❌ שגיאה בעדכון:', error);
                this.showMessage('שגיאה בעדכון הסימנייה', 'error');
            }
        }
    }

    async deleteBookmark(id) {
        const bookmark = this.allBookmarks.find(b => b.id === id);
        if (!bookmark) return;

        if (confirm(`האם למחוק את "${bookmark.title}"?`)) {
            try {
                await chrome.bookmarks.remove(id);
                this.showMessage('הסימנייה נמחקה', 'success');
                await this.refreshBookmarks();
            } catch (error) {
                console.error('❌ שגיאה במחיקה:', error);
                this.showMessage('שגיאה במחיקת הסימנייה', 'error');
            }
        }
    }

    shortenUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url.length > 40 ? url.substring(0, 40) + '...' : url;
        }
    }

    showMessage(message, type = 'info') {
        console.log(`📢 הודעה: ${message}`);
        
        const statusEl = document.createElement('div');
        statusEl.className = `status-message status-${type === 'success' ? 'success' : 'error'}`;
        statusEl.textContent = message;
        
        document.body.appendChild(statusEl);
        
        setTimeout(() => {
            if (statusEl.parentNode) {
                statusEl.parentNode.removeChild(statusEl);
            }
        }, 3000);
    }

    showError(message) {
        console.error(`❌ שגיאה: ${message}`);
        
        document.getElementById('bookmarksList').innerHTML = `
            <div class="error-state">
                <div>❌</div>
                <div>${message}</div>
                <button class="btn btn-refresh" onclick="location.reload()">נסה שוב</button>
            </div>
        `;
    }
}

// הפעלה כאשר הדף נטען
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM נטען - מתחיל את מארגן הסימניות');
    new BookmarkManager();
});

// טיפול בשגיאות לא צפויות
window.addEventListener('error', (e) => {
    console.error('❌ שגיאה לא צפויה:', e.error);
}); 