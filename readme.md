# מארגן הסימניות המתקדם 🔖

תוסף Chrome מתקדם לארגון וניהול סימניות עם תצוגה מקדימה, קטגוריזציה אוטומטית ושיתוף קל.

## ✨ תכונות עיקריות

### 🎯 ארגון חכם
- **גרירה ושחרור** - ארגן סימניות בקלות על ידי גרירתן בין תיקיות
- **קטגוריזציה אוטומטית** - התוסף מזהה אוטומטית את סוג האתר ומציע קטגוריה מתאימה
- **תיקיות היררכיות** - ניהול קל של תיקיות מקוננות
- **חיפוש חכם** - חיפוש מהיר בכל הסימניות לפי כותרת או URL

### 👀 תצוגה מקדימה
- **Preview מובנה** - צפייה באתרים מבלי לעזוב את התוסף
- **Favicon אוטומטי** - זיהוי ותצוגה של סמלי האתרים
- **מידע מהיר** - הצגת פרטי האתר והקטגוריה

### 🔗 שיתוף ושמירה
- **ייצוא וייבוא** - שמירת הסימניות לקובץ JSON או HTML
- **שיתוף במייל** - שליחת רשימת סימניות במייל
- **העתקה ללוח** - העתקה מהירה של קישורים

### ⌨️ קיצורי מקלדת
- `Ctrl+Shift+B` - הוספה מהירה של העמוד הנוכחי לסימניות
- `Ctrl+Shift+O` - פתיחת מארגן הסימניות

## 📦 התקנה

### שלב 1: הורדת הקבצים
1. צור תיקייה חדשה על המחשב (למשל: `bookmark-manager`)
2. שמור את הקבצים הבאים בתיקייה:
   - `manifest.json`
   - `popup.html`
   - `background.js`
   - `content.js`

### שלב 2: הוספת סמלים (אופציונלי)
צור תיקיית `icons` והוסף סמלים בגדלים הבאים:
- `icon16.png` (16x16 פיקסלים)
- `icon48.png` (48x48 פיקסלים)  
- `icon128.png` (128x128 פיקסלים)

### שלב 3: טעינת התוסף ב-Chrome
1. פתח Chrome והיכנס ל: `chrome://extensions/`
2. הפעל את **מצב מפתח** (Developer mode) בצד ימין עליון
3. לחץ על **Load unpacked** (טען לא 