# 📁 Content Storage System

## Overview

QuillPilot now automatically saves your blog posts to your computer's file system, ensuring your content is safe and accessible even if you uninstall the app.

## 🎯 **How It Works Now**

### ✅ **Dual-Mode Support**

**Desktop Mode (Electron):**
- Folder created automatically on app startup
- Posts saved directly to `~/QuillPilot/blog-posts/`
- Full file system integration
- "Open Folder" button works immediately

**Web Mode (Browser):**
- Posts saved to localStorage (temporary)
- Folder created when first post is saved (if Electron available)
- Export functionality for saving files manually
- Clear messaging about storage differences

### 🔄 **Automatic Folder Creation**

The system now creates the content directory in multiple ways:

1. **On Electron Startup**: `ensureContentDirectory()` runs automatically
2. **On App Initialization**: React app checks for directory availability
3. **On First Save**: Directory created when first post is saved
4. **Manual Creation**: Users can trigger folder creation via dashboard

### 📱 **User Experience by Mode**

| Mode | Folder Creation | Storage | User Action |
|------|----------------|---------|-------------|
| **Desktop** | ✅ Automatic | File System | Ready to use immediately |
| **Web** | ⏳ On first save | localStorage + Export | Export posts as files |
| **Hybrid** | ✅ Automatic | File System | Best of both worlds |

### 2. **File Format**
Each markdown file contains:
```markdown
---
title: "Your Blog Post Title"
createdAt: "2024-01-01T00:00:00.000Z"
updatedAt: "2024-01-01T00:00:00.000Z"
status: "draft"
seoKeywords: ["keyword1", "keyword2"]
metaDescription: "Your meta description"
---

Your blog post content goes here...
```

### 3. **Dual Storage Strategy**
- **Primary**: File system storage (persistent, accessible)
- **Fallback**: localStorage (browser storage, temporary)
- If file system fails, localStorage ensures no data loss

## User Benefits

✅ **Content Safety**: Posts won't be lost if you uninstall the app
✅ **Easy Access**: Open the folder to see all your posts
✅ **Portable**: Copy files to another computer or backup service
✅ **Editable**: Open posts in any Markdown editor
✅ **Private**: Your content stays on your device
✅ **No Internet**: Access your content offline

## How to Access Your Files

### From the App
1. Open QuillPilot
2. Go to Dashboard
3. Click "Open Folder" button
4. Your system file manager will open showing all posts

### From Your Computer
- **macOS**: `~/QuillPilot/blog-posts/`
- **Windows**: `C:\Users\YourUsername\QuillPilot\blog-posts\`
- **Linux**: `~/QuillPilot/blog-posts/`

## Technical Details

### File Naming Convention
- Format: `safe_title_postid.md`
- Example: `my_amazing_blog_post_1704067200000.md`
- Safe titles: lowercase, underscores instead of spaces, no special characters

### Metadata Preservation
- All post properties are stored in YAML frontmatter
- SEO keywords, creation dates, status, etc. are preserved
- Content is stored below the frontmatter

### Error Handling
- If file system operations fail, localStorage is used as fallback
- Console logs show which storage method is being used
- No data loss occurs if file system is unavailable

## For Developers

### IPC Handlers Added
- `get-content-directory`: Returns the content directory path
- `save-blog-post`: Saves a post to the file system
- `load-blog-posts`: Loads all posts from the file system
- `open-content-directory`: Opens the folder in system file manager

### File System Operations
- Directory creation is automatic
- File reading/writing with error handling
- Frontmatter parsing for metadata
- Safe filename generation

### Integration Points
- `App.js`: Main storage logic and fallback handling
- `BlogEditor.js`: Auto-save triggers file system storage
- `Dashboard.js`: Shows storage status and folder access

## Migration from localStorage

Existing users with posts in localStorage:
1. Posts are automatically loaded from localStorage on first run
2. As you edit posts, they're saved to the file system
3. localStorage remains as a backup
4. No manual migration needed

## Troubleshooting

### "Can't find my posts"
- Check the content directory: `~/QuillPilot/blog-posts/`
- Use "Open Folder" button in the dashboard
- Check console logs for storage method being used

### "Posts not saving"
- Ensure you have write permissions to your home directory
- Check console logs for error messages
- Posts will fall back to localStorage if file system fails

### "Folder won't open"
- The folder is created automatically when you first save a post
- Try creating a new post first
- Check that the app has permission to access your home directory

## Security & Privacy

- **Local Storage**: All content stays on your device
- **No Cloud Sync**: Your writing is never uploaded anywhere
- **File Permissions**: Standard file system permissions apply
- **Backup Friendly**: Easy to include in your regular backups

---

*This system ensures your creative work is always safe and accessible, while maintaining the simplicity of the QuillPilot experience.*
