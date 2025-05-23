console.log('🌱 מתחיל לטעון את הגן הדיגיטלי...');

class OrganicBookmarkGarden {
    constructor() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.searchTerm = '';
        this.expandedNodes = new Set();
        this.savedPositions = new Map();
        this.currentZoomLevel = 1; // רמת זום נוכחית
        this.maxNodesPerLevel = 50; // מקסימום נודים לרמה
        this.clusterThreshold = 30; // מרחק לקיבוץ
        this.maxNodeRadius = 50; // גודל מקסימלי לעיגול
        this.branchLength = 80; // אורך ענף מהתיקיה
        this.focusedNode = null; // הנוד שהוא במוקד
        this.focusLevel = 0; // רמת מיקוד (0 = כללי, 1+ = ממוקד)
        
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
                
                // סטטיסטיקות
                const stats = this.calculateStats(this.bookmarksData);
                console.log(`📊 סה"כ ${stats.totalBookmarks} סימניות ב-${stats.totalFolders} תיקיות`);
            } else {
                console.log('⚠️ לא זוהה Chrome API, משתמש בנתוני דמו');
                this.bookmarksData = this.generateDemoData();
            }
        } catch (error) {
            console.error('❌ שגיאה בטעינת סימניות מכרום:', error);
            this.bookmarksData = this.generateDemoData();
        }
    }

    calculateStats(data) {
        let totalBookmarks = 0;
        let totalFolders = 0;
        
        const count = (node) => {
            if (node.url) {
                totalBookmarks++;
            } else if (node.children) {
                totalFolders++;
                node.children.forEach(count);
            }
        };
        
        count(data);
        return { totalBookmarks, totalFolders };
    }

    convertChromeBookmarks(bookmarkNode) {
        console.log('🔄 ממיר סימניות כרום לפורמט הגן...');
        
        const convertNode = (node, depth = 0) => {
            const converted = {
                name: node.title || 'ללא שם',
                url: node.url,
                id: node.id,
                depth: depth,
                favicon: this.getFaviconForUrl(node.url)
            };

            // זיהוי תגיות אוטומטי לפי URL
            if (node.url) {
                converted.tags = this.getTagsForUrl(node.url);
                converted.description = this.getDescriptionForUrl(node.url);
            }

            if (node.children && node.children.length > 0) {
                // מגביל רק לרמות עליונות אם יש יותר מדי פריטים
                const shouldLimitChildren = depth < 2 && node.children.length > this.maxNodesPerLevel;
                
                converted.children = node.children
                    .filter(child => child.title)
                    .slice(0, shouldLimitChildren ? this.maxNodesPerLevel : undefined)
                    .map(child => convertNode(child, depth + 1));
                
                if (shouldLimitChildren && node.children.length > this.maxNodesPerLevel) {
                    // הוספת נוד "עוד..." 
                    converted.children.push({
                        name: `עוד ${node.children.length - this.maxNodesPerLevel} פריטים...`,
                        isMore: true,
                        remainingItems: node.children.slice(this.maxNodesPerLevel),
                        favicon: '➕'
                    });
                }
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
            'wikipedia.org': '📖',
            'medium.com': '✍️',
            'dribbble.com': '🏀',
            'behance.net': '🎨',
            'unsplash.com': '📸'
        };
        
        return favicons[domain] || '🔗';
    }

    // פביקון אמיתי לרמת זום גבוהה
    getRealFaviconUrl(url) {
        if (!url) return null;
        
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return null;
        }
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
        if (domain.includes('dribbble') || domain.includes('behance') || domain.includes('unsplash')) {
            tags.push('free');
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
            'figma.com': 'עיצוב ופרוטוטיפים',
            'medium.com': 'כתבות ובלוגים',
            'dribbble.com': 'השראה לעיצוב',
            'behance.net': 'פורטפוליו עיצוב'
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

        // הוספת zoom וpan עם מערכת Focus חכמה
        this.zoom = d3.zoom()
            .scaleExtent([0.3, 5])
            .on('zoom', (event) => {
                const { transform } = event;
                this.linksGroup.attr('transform', transform);
                this.nodesGroup.attr('transform', transform);
                
                // במקום זום רגיל - מערכת Focus חכמה
                this.handleSmartFocus(transform);
            });

        this.svg.call(this.zoom);
        
        // האזנה ללחיצות כפולות למיקוד
        this.svg.on('dblclick.zoom', null); // מבטל זום כפול רגיל
    }

    handleSmartFocus(transform) {
        // חישוב איזה נוד הכי קרוב למרכז המסך
        const screenCenterX = this.width / 2;
        const screenCenterY = this.height / 2;
        
        // המרה למערכת הקואורדינטות של ה-SVG
        const svgPoint = transform.invert([screenCenterX, screenCenterY]);
        
        // מציאת הנוד הקרוב ביותר למרכז
        const focusCandidate = this.findClosestFolder(svgPoint[0], svgPoint[1]);
        
        // עדכון מיקוד אם זה נוד חדש ובמרחק סביר
        if (focusCandidate && focusCandidate !== this.focusedNode) {
            const distance = Math.sqrt(
                Math.pow(focusCandidate.x - svgPoint[0], 2) + 
                Math.pow(focusCandidate.y - svgPoint[1], 2)
            );
            
            // רק אם קרוב מספיק ויש לו ילדים
            if (distance < 100 && focusCandidate.children && transform.k > 1.2) {
                this.setFocus(focusCandidate);
            } else if (transform.k < 1.0) {
                this.clearFocus();
            }
        }
    }

    findClosestFolder(x, y) {
        if (!this.root) return null;
        
        let closest = null;
        let minDistance = Infinity;
        
        this.root.descendants().forEach(node => {
            if (node.children && node.depth > 0) { // רק תיקיות שאינן השורש
                const distance = Math.sqrt(
                    Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = node;
                }
            }
        });
        
        return closest;
    }

    setFocus(node) {
        if (this.focusedNode === node) return;
        
        console.log('🎯 מיקוד על:', node.data.name);
        this.focusedNode = node;
        this.focusLevel = 1;
        
        // הרחבת התיקיה המיוקדת
        if (node._children) {
            node.children = node._children;
            node._children = null;
            this.expandedNodes.add(node.data.name);
        }
        
        // עדכון הצגה
        this.updateFocusDisplay();
    }

    clearFocus() {
        if (!this.focusedNode) return;
        
        console.log('🌸 ביטול מיקוד');
        this.focusedNode = null;
        this.focusLevel = 0;
        
        // עדכון הצגה
        this.updateFocusDisplay();
    }

    updateFocusDisplay() {
        if (!this.nodes) return;
        
        if (this.focusedNode) {
            // מצב מיקוד
            this.nodes.transition()
                .duration(600)
                .style('opacity', d => {
                    if (d === this.focusedNode) return 1; // הנוד המיוקד
                    if (d.parent === this.focusedNode) return 1; // הילדים שלו
                    if (d === this.focusedNode.parent) return 0.7; // ההורה שלו
                    return 0.2; // כל השאר מעומעמים
                })
                .attr('transform', d => {
                    // סידור מחדש של הילדים של הנוד המיוקד
                    if (d.parent === this.focusedNode) {
                        const siblings = this.focusedNode.children;
                        const index = siblings.indexOf(d);
                        const position = this.calculateFocusedChildPosition(d, index, siblings.length);
                        return `translate(${position.x},${position.y}) scale(1)`;
                    }
                    return `translate(${d.x},${d.y}) scale(1)`;
                });
            
            // עדכון קווים
            this.links.transition()
                .duration(600)
                .style('opacity', d => {
                    if (d.source === this.focusedNode || d.target === this.focusedNode) return 1;
                    if (d.source.parent === this.focusedNode || d.target.parent === this.focusedNode) return 0.8;
                    return 0.1;
                })
                .attr('d', d => this.calculateFocusedLinkPath(d));
            
        } else {
            // מצב רגיל - חזרה למיקומים מקוריים
            this.nodes.transition()
                .duration(600)
                .style('opacity', 1)
                .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);
            
            this.links.transition()
                .duration(600)
                .style('opacity', 0.7)
                .attr('d', d => this.calculateNormalLinkPath(d));
        }
    }

    calculateFocusedChildPosition(child, index, totalSiblings) {
        const parent = this.focusedNode;
        
        // סידור הילדים במעגל מסודר סביב ההורה
        const radius = 120;
        const angleStep = (2 * Math.PI) / totalSiblings;
        const angle = index * angleStep;
        
        const x = parent.x + Math.cos(angle) * radius;
        const y = parent.y + Math.sin(angle) * radius;
        
        // עדכון המיקום בנוד
        child.focusX = x;
        child.focusY = y;
        
        return { x, y };
    }

    calculateFocusedLinkPath(d) {
        if (d.source === this.focusedNode && d.target.focusX) {
            // קו מההורה המיוקד לילד במיקום החדש
            return `M${d.source.x},${d.source.y}L${d.target.focusX},${d.target.focusY}`;
        }
        return this.calculateNormalLinkPath(d);
    }

    calculateNormalLinkPath(d) {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // עיקול קל לענפים ארוכים
        const curvature = Math.min(distance * 0.15, 30);
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;
        
        // הוספת נקודת ביניים מעט בצד לעיקול טבעי
        const perpX = -dy / distance * curvature;
        const perpY = dx / distance * curvature;
        
        return `M${d.source.x},${d.source.y}Q${midX + perpX},${midY + perpY} ${d.target.x},${d.target.y}`;
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
        document.getElementById('helpBtn').addEventListener('click', () => {
            document.getElementById('helpOverlay').style.display = 'flex';
        });

        // גודל חלון
        window.addEventListener('resize', () => this.handleResize());
        
        // מקשי קיצור
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.searchTerm = '';
                this.highlightSearch();
                this.clearFocus(); // ביטול מיקוד עם ESC
            }
            if (e.key === 'f' || e.key === 'F') {
                // F למיקוד על התיקיה הקרובה למרכז
                const centerNode = this.findClosestFolder(this.centerX, this.centerY);
                if (centerNode) this.setFocus(centerNode);
            }
        });
    }

    createTree() {
        console.log('🌳 בונה את העץ עם מיקומים קבועים...');
        
        // יוצר את המבנה ההיררכי עם D3
        this.root = d3.hierarchy(this.bookmarksData);
        
        // חישוב מיקומים קבועים במבנה פרח/ענפים
        this.calculateBranchPositions();
        this.updateVisualization();
    }

    calculateBranchPositions() {
        console.log('🌸 מחשב מיקומים בסגנון ענפי פרח...');
        
        const nodes = this.root.descendants();
        
        // שורש במרכז
        this.root.x = this.centerX;
        this.root.y = this.centerY;
        
        // חישוב מיקומים בסגנון ענפים לכל רמה
        const levels = {};
        nodes.forEach(node => {
            if (!levels[node.depth]) levels[node.depth] = [];
            levels[node.depth].push(node);
        });

        Object.keys(levels).forEach(depth => {
            if (depth == 0) return; // שורש כבר במרכז
            
            const levelNodes = levels[depth];
            
            levelNodes.forEach((node, index) => {
                const nodeKey = `${node.data.name}_${depth}`;
                
                // בדיקה אם יש מיקום שמור
                if (this.savedPositions.has(nodeKey)) {
                    const saved = this.savedPositions.get(nodeKey);
                    node.x = saved.x;
                    node.y = saved.y;
                } else {
                    // חישוב מיקום בסגנון ענפים
                    this.calculateFlowerPosition(node, index, levelNodes.length);
                    
                    // שמירת המיקום
                    this.savedPositions.set(nodeKey, {x: node.x, y: node.y});
                }
            });
        });
    }

    calculateFlowerPosition(node, index, totalSiblings) {
        const parent = node.parent;
        if (!parent) return;
        
        if (node.depth === 1) {
            // רמה ראשונה - עיגול סביב השורש
            const radius = Math.min(150, this.width * 0.2);
            const angle = (index / totalSiblings) * 2 * Math.PI;
            
            node.x = parent.x + Math.cos(angle) * radius;
            node.y = parent.y + Math.sin(angle) * radius;
        } else {
            // רמות עמוקות יותר - ענפים שיוצאים מההורה
            const branchAngle = this.calculateBranchAngle(node, index, totalSiblings);
            const distance = this.branchLength * (0.8 + Math.random() * 0.4); // וריאציה באורך
            
            node.x = parent.x + Math.cos(branchAngle) * distance;
            node.y = parent.y + Math.sin(branchAngle) * distance;
        }
    }

    calculateBranchAngle(node, index, totalSiblings) {
        const parent = node.parent;
        
        // זווית בסיסית של ההורה (אם יש לו הורה)
        let parentAngle = 0;
        if (parent && parent.parent) {
            parentAngle = Math.atan2(parent.y - parent.parent.y, parent.x - parent.parent.x);
        }
        
        // פיזור הענפים סביב כיוון ההורה
        const spreadAngle = Math.PI * 0.6; // 108 מעלות
        const startAngle = parentAngle - spreadAngle / 2;
        const angleStep = totalSiblings > 1 ? spreadAngle / (totalSiblings - 1) : 0;
        
        return startAngle + (index * angleStep);
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

        // עדכון פוזיציות הקווים בסגנון ענפים
        this.links.attr('d', d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // עיקול קל לענפים ארוכים
            const curvature = Math.min(distance * 0.15, 30);
            const midX = (d.source.x + d.target.x) / 2;
            const midY = (d.source.y + d.target.y) / 2;
            
            // הוספת נקודת ביניים מעט בצד לעיקול טבעי
            const perpX = -dy / distance * curvature;
            const perpY = dx / distance * curvature;
            
            return `M${d.source.x},${d.source.y}Q${midX + perpX},${midY + perpY} ${d.target.x},${d.target.y}`;
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

        // עיגול רקע עם גודל מוגבל
        nodeEnter.append('circle')
            .attr('class', 'bookmark-circle')
            .attr('r', d => this.getNodeRadius(d))
            .attr('fill', d => this.getNodeColor(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        // אייקון/פביקון (אימוג'י)
        nodeEnter.append('text')
            .attr('class', 'bookmark-icon')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', d => this.getIconSize(d))
            .text(d => d.data.favicon || (d.children ? '📁' : '🔗'));

        // תווית עם גודל דינמי
        nodeEnter.append('text')
            .attr('class', 'bookmark-text')
            .attr('text-anchor', 'middle')
            .attr('dy', d => this.getNodeRadius(d) + 15)
            .attr('font-size', '10px')
            .text(d => this.getDisplayName(d));

        // מספר פריטים לקלסטרים
        nodeEnter.append('text')
            .attr('class', 'cluster-count')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .attr('font-size', '8px')
            .attr('fill', '#fff')
            .style('opacity', d => this.shouldShowClusterCount(d) ? 1 : 0)
            .text(d => this.getClusterCount(d));

        // אנימציית כניסה
        nodeEnter.transition()
            .duration(800)
            .delay((d, i) => Math.min(i * 10, 500)) // מגביל עיכוב
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
            .on('dblclick', (event, d) => {
                // לחיצה כפולה למיקוד על תיקיות
                if (d.children || d._children) {
                    this.setFocus(d);
                }
            })
            .call(this.setupDragBehavior());

        // אם יש מיקוד פעיל, עדכן את התצוגה
        if (this.focusedNode) {
            this.updateFocusDisplay();
        }
    }

    getNodeRadius(d) {
        let baseRadius;
        
        if (d.depth === 0) baseRadius = 35; // שורש - הקטנתי קצת
        else if (d.data.isMore) baseRadius = 12; // נוד "עוד..."
        else if (d.children) baseRadius = Math.min(22, 10 + d.children.length * 0.6); // תיקיות - הקטנתי
        else baseRadius = 8; // סימניות רגילות - הקטנתי
        
        // הגבלה לגודל מקסימלי
        return Math.min(baseRadius, this.maxNodeRadius * 0.8); // הקטנתי את המקסימום
    }

    getIconSize(d, withUnits = true) {
        const radius = this.getNodeRadius(d);
        const size = Math.max(8, Math.min(radius * 0.6, 16)); // הקטנתי את גדל האייקון
        return withUnits ? size + 'px' : size;
    }

    getDisplayName(d) {
        const name = d.data.name;
        const radius = this.getNodeRadius(d);
        const maxLength = radius > 15 ? 12 : 8; // הקטנתי את אורך הטקסט
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
    }

    shouldShowClusterCount(d) {
        return d.children && d.children.length > 1;
    }

    getClusterCount(d) {
        if (!d.children) return '';
        return d.children.length > 99 ? '99+' : d.children.length.toString();
    }

    getNodeColor(d) {
        if (d.depth === 0) return '#4fc3f7'; // שורש
        if (d.data.isMore) return '#ff6b35'; // נוד "עוד..."
        if (d.children) return '#81c784'; // תיקיות
        
        // צבע לפי תגיות
        const tags = d.data.tags || [];
        if (tags.includes('free')) return '#4caf50';
        if (tags.includes('tool')) return '#2196f3';
        if (tags.includes('learning')) return '#ff9800';
        if (tags.includes('work')) return '#9c27b0';
        
        return '#90a4ae'; // ברירת מחדל
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

    showTooltip(event, d) {
        const tooltip = document.getElementById('tooltip');
        const data = d.data;
        
        document.getElementById('tooltipTitle').textContent = data.name;
        document.getElementById('tooltipUrl').textContent = data.url || '';
        
        // תיאור מתקדם
        let description = data.description || '';
        if (d.children) {
            description += ` (${d.children.length} פריטים)`;
        }
        if (data.isMore && data.remainingItems) {
            description = `${data.remainingItems.length} פריטים נוספים`;
        }
        document.getElementById('tooltipDescription').textContent = description;
        
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
        } else if (d.data.isMore) {
            // הרחבת נוד "עוד..."
            this.expandMoreNode(d);
        } else if (d.children || d._children) {
            // לחיצה כפולה למיקוד, לחיצה רגילה להרחבה/כיווץ
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
        
        // חישוב מיקומים מחדש בסגנון ענפים
        this.calculateBranchPositions();
        this.updateVisualization();
    }

    expandMoreNode(d) {
        console.log('➕ מרחיב נוד "עוד..."');
        // כאן אפשר להוסיף פונקציונליות להרחבת פריטים נוספים
        // לעת עתה פשוט נעלם את הנוד
        d.data.isMore = false;
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
        
        this.clearFocus(); // ביטול מיקוד
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
        
        this.calculateBranchPositions();
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
        this.calculateBranchPositions();
        this.updateVisualization();
    }

    exportStructure() {
        console.log('📤 מייצא מבנה...');
        const exportData = {
            bookmarks: this.bookmarksData,
            positions: Object.fromEntries(this.savedPositions),
            stats: this.calculateStats(this.bookmarksData)
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
        const visibleNodes = nodes.filter(d => this.shouldShowNode(d));
        document.getElementById('totalNodes').textContent = nodes.length;
        document.getElementById('visibleNodes').textContent = visibleNodes.length;
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