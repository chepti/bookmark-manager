console.log('🔖 מארגן הסימניות המתקדם - הופעל בדף מלא');

class BookmarkManager {
    constructor() {
        this.allBookmarks = [];
        this.filteredBookmarks = [];
        this.currentFolder = null;
        this.bookmarkTree = null;
        this.expandedFolders = new Set(['all']);
        this.favIconCache = new Map();
        this.init();
    }

    async init() {
        console.log('🚀 מאתחל את מארגן הסימניות...');
        this.setupEventListeners();
        await this.loadBookmarks();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        console.log('⚙️ מגדיר event listeners...');
        
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', this.debounce((e) => {
            this.searchBookmarks(e.target.value);
        }, 300));

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshBookmarks();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportBookmarks();
        });

        // מקש ESC לניקוי חיפוש
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.searchBookmarks('');
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async loadBookmarks() {
        console.log('📚 מתחיל לטעון סימניות...');
        
        try {
            if (!chrome?.bookmarks) {
                throw new Error('ה-API של סימניות אינו זמין');
            }
            console.log('✅ API של סימניות זמין');

            const bookmarkTree = await chrome.bookmarks.getTree();
            console.log('📁 עץ סימניות נטען:', bookmarkTree);

            if (!bookmarkTree?.[0]) {
                throw new Error('לא ניתן לטעון את עץ הסימניות');
            }

            this.bookmarkTree = bookmarkTree[0];
            this.allBookmarks = this.flattenBookmarks(this.bookmarkTree);
            this.filteredBookmarks = [...this.allBookmarks];
            
            console.log(`📋 נטענו ${this.allBookmarks.length} סימניות`);

            // טעינה מהירה של הממשק
            requestAnimationFrame(() => {
                this.renderFolderTree();
                this.renderBookmarks();
                this.updateStats();
                
                if (this.allBookmarks.length === 0) {
                    this.showMessage('אין סימניות בכרום. הוסף סימניות ולחץ רענן.', 'info');
                } else {
                    this.showMessage(`נטענו ${this.allBookmarks.length} סימניות בהצלחה!`, 'success');
                }
            });

        } catch (error) {
            console.error('❌ שגיאה בטעינת סימניות:', error);
            this.showError(`שגיאה: ${error.message}`);
        }
    }

    flattenBookmarks(node, path = [], allNodes = []) {
        let bookmarks = [];
        
        if (node.children) {
            for (const child of node.children) {
                const currentPath = [...path, node.title].filter(Boolean);
                
                if (child.url) {
                    // זוהי סימנייה
                    bookmarks.push({
                        ...child,
                        path: currentPath,
                        pathString: currentPath.join('/'),
                        nodeId: child.id
                    });
                } else {
                    // זוהי תיקייה
                    allNodes.push({
                        ...child,
                        path: currentPath,
                        pathString: currentPath.join('/'),
                        isFolder: true
                    });
                    
                    // המשך רקורסיבי
                    bookmarks = bookmarks.concat(
                        this.flattenBookmarks(child, currentPath, allNodes)
                    );
                }
            }
        }
        
        return bookmarks;
    }

    buildFolderHierarchy(node, level = 0) {
        if (!node.children) return '';
        
        return node.children.map(child => {
            if (!child.url) { // זוהי תיקייה
                const folderPath = this.getFolderPath(child);
                const childCount = this.getChildrenCount(child);
                const isExpanded = this.expandedFolders.has(folderPath);
                const hasChildren = child.children && child.children.some(c => !c.url);
                
                const indentStyle = `margin-right: ${level * 15}px;`;
                
                let html = `
                    <div class="folder-item ${this.currentFolder === folderPath ? 'active' : ''}" 
                         data-folder="${folderPath}" 
                         data-level="${level}"
                         style="${indentStyle}">
                        ${hasChildren ? 
                            `<span class="folder-toggle ${isExpanded ? 'expanded' : ''}" data-folder="${folderPath}">
                                ${isExpanded ? '▼' : '▶'}
                            </span>` : 
                            '<span class="folder-spacer"></span>'
                        }
                        <span class="folder-icon">📁</span>
                        <span class="folder-name">${child.title}</span>
                        <span class="folder-count">${childCount}</span>
                    </div>
                `;
                
                if (isExpanded && hasChildren) {
                    html += this.buildFolderHierarchy(child, level + 1);
                }
                
                return html;
            }
            return '';
        }).join('');
    }

    getFolderPath(node) {
        return node.id;
    }

    getChildrenCount(node) {
        let count = 0;
        if (node.children) {
            for (const child of node.children) {
                if (child.url) {
                    count++;
                } else {
                    count += this.getChildrenCount(child);
                }
            }
        }
        return count;
    }

    renderFolderTree() {
        const folderTree = document.getElementById('folderTree');
        
        // כל הסימניות
        let html = `
            <div class="folder-item ${this.currentFolder === 'all' ? 'active' : ''}" data-folder="all">
                <span class="folder-spacer"></span>
                <span class="folder-icon">🌐</span>
                <span class="folder-name">כל הסימניות</span>
                <span class="folder-count">${this.allBookmarks.length}</span>
            </div>
        `;

        // הירארכיה של תיקיות
        if (this.bookmarkTree) {
            html += this.buildFolderHierarchy(this.bookmarkTree);
        }
        
        folderTree.innerHTML = html;

        // Event listeners
        folderTree.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('folder-toggle')) {
                    this.selectFolder(item.dataset.folder);
                }
            });
        });

        folderTree.querySelectorAll('.folder-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFolder(toggle.dataset.folder);
            });
        });
    }

    toggleFolder(folderPath) {
        if (this.expandedFolders.has(folderPath)) {
            this.expandedFolders.delete(folderPath);
        } else {
            this.expandedFolders.add(folderPath);
        }
        this.renderFolderTree();
    }

    selectFolder(folderPath) {
        console.log(`📂 נבחרה תיקייה: ${folderPath}`);
        
        this.currentFolder = folderPath;
        
        if (folderPath === 'all') {
            this.filteredBookmarks = [...this.allBookmarks];
            document.getElementById('contentTitle').innerHTML = '🌐 כל הסימניות';
        } else {
            // מחפש לפי ID של תיקייה
            this.filteredBookmarks = this.allBookmarks.filter(bookmark => {
                return this.isBookmarkInFolder(bookmark, folderPath);
            });
            
            // מציאת שם התיקייה
            const folderName = this.findFolderName(folderPath);
            document.getElementById('contentTitle').innerHTML = `📁 ${folderName}`;
        }
        
        this.renderFolderTree(); // עדכון הפעיל
        this.renderBookmarks();
        this.updateStats();
    }

    findFolderName(folderId) {
        const findInTree = (node) => {
            if (node.id === folderId) return node.title;
            if (node.children) {
                for (const child of node.children) {
                    const result = findInTree(child);
                    if (result) return result;
                }
            }
            return null;
        };
        
        return findInTree(this.bookmarkTree) || 'תיקייה לא ידועה';
    }

    isBookmarkInFolder(bookmark, folderId) {
        return bookmark.pathString.includes(folderId) || bookmark.parentId === folderId;
    }

    async getFavicon(url) {
        if (this.favIconCache.has(url)) {
            return this.favIconCache.get(url);
        }

        try {
            const domain = new URL(url).hostname;
            const favIconUrls = [
                `https://www.google.com/s2/favicons?domain=${domain}&sz=24`,
                `https://${domain}/favicon.ico`,
                `https://icons.duckduckgo.com/ip3/${domain}.ico`
            ];

            for (const favIconUrl of favIconUrls) {
                try {
                    const response = await fetch(favIconUrl);
                    if (response.ok) {
                        this.favIconCache.set(url, favIconUrl);
                        return favIconUrl;
                    }
                } catch (e) {
                    continue;
                }
            }
        } catch (e) {
            console.warn('לא ניתן לטעון favicon עבור:', url);
        }

        const fallback = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23e9ecef"/><text x="12" y="16" text-anchor="middle" font-size="12" fill="%236c757d">🌐</text></svg>';
        this.favIconCache.set(url, fallback);
        return fallback;
    }

    async renderBookmarks() {
        const container = document.getElementById('bookmarksList');
        
        if (this.filteredBookmarks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">אין סימניות להצגה</div>
                    <div class="empty-hint">נסה לחפש משהו אחר או בחר תיקייה אחרת</div>
                </div>
            `;
            return;
        }

        const bookmarksHtml = await Promise.all(
            this.filteredBookmarks.slice(0, 60).map(async (bookmark, index) => {
                const favIconUrl = await this.getFavicon(bookmark.url);
                
                return `
                    <div class="bookmark-item" 
                         data-id="${bookmark.id}" 
                         data-url="${bookmark.url}"
                         draggable="true"
                         style="animation-delay: ${index * 0.02}s">
                        <div class="bookmark-content">
                            <div class="bookmark-header">
                                <img class="bookmark-favicon" 
                                     src="${favIconUrl}" 
                                     alt="favicon"
                                     loading="lazy">
                                <div class="bookmark-title" title="${bookmark.title}">
                                    ${bookmark.title || 'ללא כותרת'}
                                </div>
                                <div class="bookmark-actions">
                                    <button class="action-btn edit" title="עריכה">✏️</button>
                                    <button class="action-btn delete" title="מחיקה">🗑️</button>
                                    <button class="action-btn drag-handle" title="גרירה">⋮⋮</button>
                                </div>
                            </div>
                            <div class="bookmark-url" title="${bookmark.url}">
                                ${this.shortenUrl(bookmark.url)}
                            </div>
                            ${bookmark.path.length > 0 ? 
                                `<div class="bookmark-path">${bookmark.path.join(' › ')}</div>` : 
                                ''
                            }
                        </div>
                    </div>
                `;
            })
        );

        container.innerHTML = bookmarksHtml.join('');
        
        if (this.filteredBookmarks.length > 60) {
            this.loadRemainingBookmarks(60);
        }

        this.setupBookmarkListeners();
    }

    async loadRemainingBookmarks(startIndex) {
        const container = document.getElementById('bookmarksList');
        const remaining = this.filteredBookmarks.slice(startIndex);
        
        for (let i = 0; i < remaining.length; i += 30) {
            const batch = remaining.slice(i, i + 30);
            const batchHtml = await Promise.all(
                batch.map(async (bookmark, index) => {
                    const favIconUrl = await this.getFavicon(bookmark.url);
                    const actualIndex = startIndex + i + index;
                    
                    return `
                        <div class="bookmark-item" 
                             data-id="${bookmark.id}" 
                             data-url="${bookmark.url}"
                             draggable="true"
                             style="animation-delay: ${actualIndex * 0.01}s">
                            <div class="bookmark-content">
                                <div class="bookmark-header">
                                    <img class="bookmark-favicon" 
                                         src="${favIconUrl}" 
                                         alt="favicon"
                                         loading="lazy">
                                    <div class="bookmark-title" title="${bookmark.title}">
                                        ${bookmark.title || 'ללא כותרת'}
                                    </div>
                                    <div class="bookmark-actions">
                                        <button class="action-btn edit" title="עריכה">✏️</button>
                                        <button class="action-btn delete" title="מחיקה">🗑️</button>
                                        <button class="action-btn drag-handle" title="גרירה">⋮⋮</button>
                                    </div>
                                </div>
                                <div class="bookmark-url" title="${bookmark.url}">
                                    ${this.shortenUrl(bookmark.url)}
                                </div>
                                ${bookmark.path.length > 0 ? 
                                    `<div class="bookmark-path">${bookmark.path.join(' › ')}</div>` : 
                                    ''
                                }
                            </div>
                        </div>
                    `;
                })
            );
            
            container.insertAdjacentHTML('beforeend', batchHtml.join(''));
            this.setupBookmarkListeners();
            
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    setupDragAndDrop() {
        let draggedElement = null;
        
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('bookmark-item')) {
                draggedElement = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('bookmark-item')) {
                e.target.classList.remove('dragging');
                document.querySelectorAll('.drop-zone').forEach(zone => {
                    zone.classList.remove('drop-over');
                });
                draggedElement = null;
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('.bookmark-item, .folder-item');
            if (dropZone && draggedElement && dropZone !== draggedElement) {
                dropZone.classList.add('drop-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('.bookmark-item, .folder-item');
            if (dropZone) {
                dropZone.classList.remove('drop-over');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('.folder-item');
            if (dropZone && draggedElement) {
                this.moveBookmarkToFolder(draggedElement.dataset.id, dropZone.dataset.folder);
                dropZone.classList.remove('drop-over');
            }
        });
    }

    async moveBookmarkToFolder(bookmarkId, folderId) {
        try {
            await chrome.bookmarks.move(bookmarkId, { parentId: folderId });
            this.showMessage('הסימנייה הועברה בהצלחה', 'success');
            await this.refreshBookmarks();
        } catch (error) {
            console.error('❌ שגיאה בהעברת הסימנייה:', error);
            this.showMessage('שגיאה בהעברת הסימנייה', 'error');
        }
    }

    setupBookmarkListeners() {
        document.querySelectorAll('.bookmark-item').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn')) {
                    window.open(newItem.dataset.url, '_blank');
                }
            });

            const editBtn = newItem.querySelector('.edit');
            const deleteBtn = newItem.querySelector('.delete');

            editBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editBookmark(newItem.dataset.id);
            });

            deleteBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteBookmark(newItem.dataset.id);
            });
        });
    }

    searchBookmarks(query) {
        console.log(`🔍 חיפוש: "${query}"`);
        
        if (!query.trim()) {
            this.filteredBookmarks = [...this.allBookmarks];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredBookmarks = this.allBookmarks.filter(bookmark =>
                bookmark.title.toLowerCase().includes(searchTerm) ||
                bookmark.url.toLowerCase().includes(searchTerm) ||
                bookmark.path.some(pathPart => pathPart.toLowerCase().includes(searchTerm))
            );
        }
        this.renderBookmarks();
        this.updateStats();
    }

    updateStats() {
        document.getElementById('totalCount').textContent = `${this.allBookmarks.length} סימניות`;
        document.getElementById('filteredCount').textContent = `${this.filteredBookmarks.length} מוצגות`;
    }

    async refreshBookmarks() {
        console.log('🔄 מרענן סימניות...');
        
        document.getElementById('bookmarksList').innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div class="empty-text">טוען סימניות...</div>
                <div class="empty-hint">אנא המתן...</div>
            </div>
        `;
        
        this.favIconCache.clear();
        await this.loadBookmarks();
    }

    async exportBookmarks() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                bookmarks: this.allBookmarks,
                folders: this.bookmarkTree
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('הסימניות יוצאו בהצלחה!', 'success');
        } catch (error) {
            console.error('❌ שגיאה בייצוא:', error);
            this.showMessage('שגיאה בייצוא הסימניות', 'error');
        }
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
            return url.length > 50 ? url.substring(0, 50) + '...' : url;
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
                <div class="error-icon">❌</div>
                <div class="error-text">${message}</div>
                <button class="btn btn-primary" onclick="location.reload()">נסה שוב</button>
            </div>
        `;
    }
}

// הפעלה כאשר הדף נטען
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM נטען - מתחיל את מארגן הסימניות בדף מלא');
    new BookmarkManager();
});

window.addEventListener('error', (e) => {
    console.error('❌ שגיאה לא צפויה:', e.error);
}); 