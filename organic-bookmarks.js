console.log('🌱 מתחיל לטעון את הגן הדיגיטלי...');

class OrganicBookmarkGarden {
    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.searchTerm = '';
        this.expandedNodes = new Set();
        this.savedPositions = new Map(); // שמירת מיקומים קבועים
        
        // ניסיון לטעון סימניות אמיתיות מכרום
        this.loadChromeBookmarks().then(() => {
            this.initializeSvg();
            this.setupEventListeners();
            this.createTree();
            console.log('🌳 הגן הדיגיטלי מוכן!');
        });
    }

    async loadChromeBookmarks() {
        console.log('📚 מנסה לטעון סימניות מכרום...');
        
        try {
            if (typeof chrome !== 'undefined' && chrome.bookmarks) {
                const bookmarkTree = await chrome.bookmarks.getTree();
                this.bookmarksData = this.convertChromeBookmarks(bookmarkTree[0]);
                console.log('✅ סימניות נטענו מכרום!', this.bookmarksData);
            } else {
                console.log('⚠️ לא זוהה Chrome API, משתמש בנתוני דמו');
                this.bookmarksData = this.generateDemoData();
            }
        } catch (error) {
            console.error('❌ שגיאה בטעינת סימניות מכרום:', error);
            this.bookmarksData = this.generateDemoData();
        }
    }

    convertChromeBookmarks(bookmarkNode) {
        console.log('🔄 ממיר סימניות כרום לפורמט הגן...');
        
        const convertNode = (node) => {
            const converted = {
                name: node.title || 'ללא שם',
                url: node.url,
                id: node.id,
                favicon: this.getFaviconForUrl(node.url)
            };

            // זיהוי תגיות אוטומטי לפי URL
            if (node.url) {
                converted.tags = this.getTagsForUrl(node.url);
                converted.description = this.getDescriptionForUrl(node.url);
            }

            if (node.children && node.children.length > 0) {
                converted.children = node.children
                    .filter(child => child.title) // רק עם שמות
                    .map(convertNode);
            }

            return converted;
        };

        return convertNode(bookmarkNode);
    }

    getFaviconForUrl(url) {
        if (!url) return '📁';
        
        const domain = new URL(url).hostname.toLowerCase();
        const favicons = {
            'github.com': '⚡',
            'stackoverflow.com': '❓',
            'developer.mozilla.org': '📚',
            'codepen.io': '🎨',
            'figma.com': '🎨',
            'canva.com': '🖼️',
            'youtube.com': '📺',
            'google.com': '🔍',
            'facebook.com': '👥',
            'twitter.com': '🐦',
            'linkedin.com': '💼',
            'instagram.com': '📸',
            'reddit.com': '🤖',
            'netflix.com': '🎬',
            'amazon.com': '📦',
            'wikipedia.org': '📖'
        };
        
        return favicons[domain] || '🔗';
    }

    getTagsForUrl(url) {
        if (!url) return [];
        
        const domain = new URL(url).hostname.toLowerCase();
        const tags = [];
        
        // תגיות לפי דומיין
        if (domain.includes('github') || domain.includes('stackoverflow') || domain.includes('codepen')) {
            tags.push('tool', 'free');
        }
        if (domain.includes('youtube') || domain.includes('coursera') || domain.includes('khan')) {
            tags.push('learning');
        }
        if (domain.includes('figma') || domain.includes('canva') || domain.includes('adobe')) {
            tags.push('tool');
        }
        if (domain.includes('google') || domain.includes('notion') || domain.includes('slack')) {
            tags.push('work', 'tool');
        }
        
        return tags.length > 0 ? tags : ['general'];
    }

    getDescriptionForUrl(url) {
        if (!url) return '';
        
        const domain = new URL(url).hostname.toLowerCase();
        const descriptions = {
            'github.com': 'ניהול קוד ופרויקטים',
            'stackoverflow.com': 'פתרונות לבעיות תכנות',
            'youtube.com': 'סרטונים ולמידה',
            'google.com': 'חיפוש ושירותים',
            'figma.com': 'עיצוב ופרוטוטיפים'
        };
        
        return descriptions[domain] || `אתר ${domain}`;
    }

    generateDemoData() {
        console.log('📝 יוצר נתוני דמו...');
        return {
            name: "שורש הגן",
            children: [
                {
                    name: "פיתוח",
                    tags: ['work', 'tool'],
                    children: [
                        { name: "GitHub", url: "https://github.com", description: "ניהול קוד", tags: ['tool', 'free'], favicon: "⚡" },
                        { name: "Stack Overflow", url: "https://stackoverflow.com", description: "פתרונות לבעיות", tags: ['learning', 'free'], favicon: "❓" },
                        { name: "MDN Web Docs", url: "https://developer.mozilla.org", description: "תיעוד ווב", tags: ['learning', 'free'], favicon: "📚" },
                        { name: "CodePen", url: "https://codepen.io", description: "משחק עם קוד", tags: ['tool', 'free'], favicon: "🎨" },
                        { name: "VS Code", url: "https://code.visualstudio.com", description: "עורך הקוד הטוב", tags: ['tool', 'free'], favicon: "💻" }
                    ]
                },
                {
                    name: "עיצוב",
                    tags: ['work', 'tool'],
                    children: [
                        { name: "Figma", url: "https://figma.com", description: "עיצוב UI/UX מתקדם", tags: ['tool', 'free'], favicon: "🎨" },
                        { name: "Canva", url: "https://canva.com", description: "עיצובים מהירים", tags: ['tool', 'free'], favicon: "🖼️" },
                        { name: "Adobe Color", url: "https://color.adobe.com", description: "פלטות צבעים", tags: ['tool', 'free'], favicon: "🌈" },
                        { name: "Unsplash", url: "https://unsplash.com", description: "תמונות חינמיות", tags: ['free'], favicon: "📸" }
                    ]
                },
                {
                    name: "כלים",
                    tags: ['tool'],
                    children: [
                        { name: "Google Analytics", url: "https://analytics.google.com", description: "ניתוח תנועה", tags: ['tool', 'free'], favicon: "📊" },
                        { name: "Notion", url: "https://notion.so", description: "ארגון מחשבות", tags: ['tool'], favicon: "📝" },
                        { name: "Slack", url: "https://slack.com", description: "תקשורת צוות", tags: ['work', 'tool'], favicon: "💬" },
                        { name: "Zoom", url: "https://zoom.us", description: "וידאו קונפרנס", tags: ['work', 'tool'], favicon: "📹" }
                    ]
                },
                {
                    name: "למידה",
                    tags: ['learning'],
                    children: [
                        { name: "Coursera", url: "https://coursera.org", description: "קורסים אקדמיים", tags: ['learning'], favicon: "🎓" },
                        { name: "YouTube", url: "https://youtube.com", description: "סרטוני הדרכה", tags: ['learning', 'free'], favicon: "📺" },
                        { name: "Khan Academy", url: "https://khanacademy.org", description: "חינוך חינמי", tags: ['learning', 'free'], favicon: "🧮" },
                        { name: "Duolingo", url: "https://duolingo.com", description: "לימוד שפות", tags: ['learning', 'free'], favicon: "🗣️" }
                    ]
                }
            ]
        };
    }

    initializeSvg() {
        console.log('🎨 יוצר SVG...');
        this.svg = d3.select('#treeSvg')
            .attr('width', this.width)
            .attr('height', this.height);

        // קבוצות לשכבות שונות
        this.linksGroup = this.svg.append('g').attr('class', 'links');
        this.nodesGroup = this.svg.append('g').attr('class', 'nodes');

        // מרכז הגן
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        // הוספת zoom וpan
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('zoom', (event) => {
                this.linksGroup.attr('transform', event.transform);
                this.nodesGroup.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);
    }

    setupEventListeners() {
        console.log('🔗 מגדיר מאזינים...');
        
        // חיפוש
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.highlightSearch();
        });

        // כפתורים
        document.getElementById('resetBtn').addEventListener('click', () => this.resetView());
        document.getElementById('addNodeBtn').addEventListener('click', () => this.addRandomBranch());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportStructure());

        // גודל חלון
        window.addEventListener('resize', () => this.handleResize());
    }

    createTree() {
        console.log('🌳 בונה את העץ עם מיקומים קבועים...');
        
        // יוצר את המבנה ההיררכי עם D3
        this.root = d3.hierarchy(this.bookmarksData);
        
        // חישוב מיקומים קבועים במבנה רדיאלי
        this.calculateStaticPositions();
        this.updateVisualization();
    }

    calculateStaticPositions() {
        console.log('📍 מחשב מיקומים קבועים...');
        
        const nodes = this.root.descendants();
        
        // שורש במרכז
        this.root.x = this.centerX;
        this.root.y = this.centerY;
        
        // חישוב מיקומים רדיאליים לכל רמה
        const levels = {};
        nodes.forEach(node => {
            if (!levels[node.depth]) levels[node.depth] = [];
            levels[node.depth].push(node);
        });

        Object.keys(levels).forEach(depth => {
            const levelNodes = levels[depth];
            const radius = depth * 150; // מרחק מהמרכז
            
            levelNodes.forEach((node, index) => {
                if (depth == 0) return; // שורש כבר במרכז
                
                const angle = (index / levelNodes.length) * 2 * Math.PI;
                const nodeKey = `${node.data.name}_${depth}`;
                
                // בדיקה אם יש מיקום שמור
                if (this.savedPositions.has(nodeKey)) {
                    const saved = this.savedPositions.get(nodeKey);
                    node.x = saved.x;
                    node.y = saved.y;
                } else {
                    // מיקום חדש
                    node.x = this.centerX + Math.cos(angle) * radius;
                    node.y = this.centerY + Math.sin(angle) * radius;
                    
                    // שמירת המיקום
                    this.savedPositions.set(nodeKey, {x: node.x, y: node.y});
                }
            });
        });
    }

    updateVisualization() {
        console.log('🔄 מעדכן ויזואליזציה...');
        
        const nodes = this.root.descendants();
        const links = this.root.links();

        this.updateLinks(links);
        this.updateNodes(nodes);
        this.updateStats(nodes);
    }

    updateLinks(links) {
        const linkSelection = this.linksGroup
            .selectAll('.branch')
            .data(links, d => `${d.source.data.name}-${d.target.data.name}`);

        linkSelection.exit()
            .transition()
            .duration(500)
            .style('opacity', 0)
            .remove();

        const linkEnter = linkSelection.enter()
            .append('path')
            .attr('class', 'branch')
            .style('opacity', 0);

        linkEnter.transition()
            .duration(800)
            .style('opacity', 0.7);

        this.links = linkEnter.merge(linkSelection);

        // עדכון פוזיציות הקווים
        this.links.attr('d', d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy) * 0.2;
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
    }

    updateNodes(nodes) {
        const nodeSelection = this.nodesGroup
            .selectAll('.bookmark-node')
            .data(nodes, d => d.data.name);

        nodeSelection.exit()
            .transition()
            .duration(500)
            .style('opacity', 0)
            .attr('transform', 'scale(0)')
            .remove();

        const nodeEnter = nodeSelection.enter()
            .append('g')
            .attr('class', 'bookmark-node')
            .attr('transform', d => `translate(${d.x},${d.y}) scale(0)`)
            .style('opacity', 0);

        // עיגול רקע
        nodeEnter.append('circle')
            .attr('class', 'bookmark-circle')
            .attr('r', d => d.depth === 0 ? 35 : (d.children ? 25 : 20))
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // אייקון/פביקון
        nodeEnter.append('text')
            .attr('class', 'bookmark-icon')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', d => d.depth === 0 ? '20px' : '16px')
            .text(d => d.data.favicon || (d.children ? '📁' : '🔗'));

        // תווית
        nodeEnter.append('text')
            .attr('class', 'bookmark-text')
            .attr('text-anchor', 'middle')
            .attr('dy', d => d.depth === 0 ? '45px' : '35px')
            .attr('font-size', '10px')
            .text(d => d.data.name);

        // אנימציית כניסה
        nodeEnter.transition()
            .duration(800)
            .delay((d, i) => i * 30)
            .style('opacity', 1)
            .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);

        this.nodes = nodeEnter.merge(nodeSelection);

        // עדכון מיקומים של נודים קיימים
        this.nodes
            .transition()
            .duration(800)
            .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);

        // הוספת אירועים
        this.nodes
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .on('click', (event, d) => this.handleNodeClick(d))
            .call(this.setupDragBehavior());
    }

    setupDragBehavior() {
        return d3.drag()
            .on('start', (event, d) => {
                d.startX = d.x;
                d.startY = d.y;
            })
            .on('drag', (event, d) => {
                d.x = event.x;
                d.y = event.y;
                
                // עדכון מיקום הנוד
                d3.select(event.sourceEvent.target.parentNode)
                    .attr('transform', `translate(${d.x},${d.y}) scale(1)`);
                
                // עדכון הקווים
                this.updateLinks(this.root.links());
            })
            .on('end', (event, d) => {
                // שמירת המיקום החדש
                const nodeKey = `${d.data.name}_${d.depth}`;
                this.savedPositions.set(nodeKey, {x: d.x, y: d.y});
                console.log(`💾 נשמר מיקום חדש עבור ${d.data.name}`);
            });
    }

    getNodeColor(d) {
        if (d.depth === 0) return '#4fc3f7'; // שורש
        if (d.children) return '#81c784'; // תיקיות
        
        // צבע לפי תגיות
        const tags = d.data.tags || [];
        if (tags.includes('free')) return '#4caf50';
        if (tags.includes('tool')) return '#2196f3';
        if (tags.includes('learning')) return '#ff9800';
        if (tags.includes('work')) return '#9c27b0';
        
        return '#90a4ae'; // ברירת מחדל
    }

    showTooltip(event, d) {
        const tooltip = document.getElementById('tooltip');
        const data = d.data;
        
        document.getElementById('tooltipTitle').textContent = data.name;
        document.getElementById('tooltipUrl').textContent = data.url || '';
        document.getElementById('tooltipDescription').textContent = data.description || '';
        
        // תגיות
        const tagsContainer = document.getElementById('tooltipTags');
        tagsContainer.innerHTML = '';
        if (data.tags) {
            data.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = `tag ${tag}`;
                tagElement.textContent = this.getTagText(tag);
                tagsContainer.appendChild(tagElement);
            });
        }

        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY - 10) + 'px';
        tooltip.classList.add('visible');
    }

    hideTooltip() {
        document.getElementById('tooltip').classList.remove('visible');
    }

    getTagText(tag) {
        const tagTexts = {
            'free': 'חינמי',
            'tool': 'כלי עזר', 
            'learning': 'למידה',
            'work': 'עבודה',
            'general': 'כללי'
        };
        return tagTexts[tag] || tag;
    }

    handleNodeClick(d) {
        console.log('🖱️ לחיצה על:', d.data.name);
        
        if (d.data.url) {
            // פתיחת קישור
            window.open(d.data.url, '_blank');
        } else if (d.children || d._children) {
            // הרחבה/כיווץ של ענף
            this.toggleNode(d);
        }
    }

    toggleNode(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
            this.expandedNodes.delete(d.data.name);
        } else {
            d.children = d._children;
            d._children = null;
            this.expandedNodes.add(d.data.name);
        }
        
        // חישוב מיקומים מחדש
        this.calculateStaticPositions();
        this.updateVisualization();
    }

    highlightSearch() {
        if (!this.searchTerm) {
            this.nodes.classed('highlighted', false);
            this.links.classed('highlighted', false);
            return;
        }

        this.nodes.classed('highlighted', d => 
            d.data.name.toLowerCase().includes(this.searchTerm) ||
            (d.data.description && d.data.description.toLowerCase().includes(this.searchTerm)) ||
            (d.data.url && d.data.url.toLowerCase().includes(this.searchTerm))
        );

        console.log(`🔍 חיפוש: "${this.searchTerm}"`);
    }

    resetView() {
        console.log('🔄 איפוס תצוגה...');
        
        this.expandedNodes.clear();
        this.searchTerm = '';
        document.getElementById('searchInput').value = '';
        
        // איפוס זום
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
        
        // איפוס המבנה
        this.root.descendants().forEach(d => {
            if (d._children) {
                d.children = d._children;
                d._children = null;
            }
        });
        
        this.calculateStaticPositions();
        this.updateVisualization();
    }

    addRandomBranch() {
        console.log('🌱 מוסיף ענף חדש...');
        
        const newBranch = {
            name: `ענף חדש ${Date.now()}`,
            description: 'ענף שנוסף באופן ידני',
            favicon: '🆕',
            tags: ['tool']
        };

        // הוספה לשורש
        this.bookmarksData.children.push(newBranch);
        this.root = d3.hierarchy(this.bookmarksData);
        this.calculateStaticPositions();
        this.updateVisualization();
    }

    exportStructure() {
        console.log('📤 מייצא מבנה...');
        const exportData = {
            bookmarks: this.bookmarksData,
            positions: Object.fromEntries(this.savedPositions)
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'organic-bookmarks-galaxy.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    updateStats(nodes) {
        document.getElementById('totalNodes').textContent = nodes.length;
        document.getElementById('visibleNodes').textContent = nodes.filter(d => d.depth > 0).length;
        document.getElementById('expandedBranches').textContent = this.expandedNodes.size;
    }

    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);
    }
}

// התחלה כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 DOM נטען, מתחיל את הגן...');
    window.garden = new OrganicBookmarkGarden();
});

console.log('📜 הסקריפט נטען בהצלחה!'); 