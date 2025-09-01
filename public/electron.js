const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Keep a global reference of the window object
let mainWindow;
let pythonProcess;

// Create the content directory on app startup
function ensureContentDirectory() {
  try {
    const contentDir = path.join(os.homedir(), 'QuillPilot', 'blog-posts');
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
      console.log('Created content directory on startup:', contentDir);

      // Create a welcome README file
      const welcomeContent = `# 📝 Welcome to QuillPilot!

This folder contains all your blog posts and writing content.

## What's Here
- **Your blog posts** are automatically saved as Markdown files
- **Each file** contains your content plus metadata (dates, SEO info, etc.)
- **Safe storage** - your content won't be lost if you uninstall the app

## File Format
Each post is saved as: \`title_postid.md\`

## How It Works
1. **Auto-save**: Posts are saved automatically as you type
2. **Easy access**: Use "Open Folder" in the QuillPilot dashboard
3. **Portable**: Copy files to backup services or other computers
4. **Editable**: Open posts in any Markdown editor

## Getting Started
Just start writing in QuillPilot! Your first post will appear here automatically.

---
*Created by QuillPilot - Your AI Writing Assistant*
`;

      const welcomePath = path.join(contentDir, 'README.md');
      fs.writeFileSync(welcomePath, welcomeContent, 'utf8');
      console.log('Created welcome README file:', welcomePath);

    } else {
      console.log('Content directory already exists:', contentDir);
    }
  } catch (error) {
    console.error('Error creating content directory:', error);
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'), // Add app icon
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the React app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

function startPythonBackend() {
  if (pythonProcess) return;

  const pythonPath = isDev
    ? path.join(__dirname, '../src/python/app.py')
    : path.join(process.resourcesPath, 'src/python/app.py');

    console.log('Starting Python backend...');

  pythonProcess = spawn('uvicorn', ['app:app', '--host', '0.0.0.0', '--port', '5001'], {
    cwd: path.dirname(pythonPath),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    pythonProcess = null;
  });
}

function stopPythonBackend() {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Blog Post',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-blog-post');
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as Markdown',
              click: () => {
                mainWindow.webContents.send('menu-export-markdown');
              }
            },
            {
              label: 'Export as HTML',
              click: () => {
                mainWindow.webContents.send('menu-export-html');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'AI',
      submenu: [
        {
          label: 'Generate Content',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            mainWindow.webContents.send('menu-ai-generate');
          }
        },
        {
          label: 'Improve Writing',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-ai-improve');
          }
        },
        {
          label: 'AI Settings',
          click: () => {
            mainWindow.webContents.send('menu-ai-settings');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[5].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('save-blog-post', async (event, post) => {
  try {
    // Get the content directory
    const contentDir = path.join(os.homedir(), 'QuillPilot', 'blog-posts');

    // Ensure the directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
      console.log('Created content directory:', contentDir);
    }

    // Create a safe filename from the post title
    const safeTitle = post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled';
    const filename = `${safeTitle}_${post.id}.md`;
    const filePath = path.join(contentDir, filename);

    // Create markdown content with metadata
    const markdownContent = `---
title: "${post.title}"
createdAt: "${post.createdAt}"
updatedAt: "${post.updatedAt}"
status: "${post.status}"
seoKeywords: ${JSON.stringify(post.seoKeywords || [])}
metaDescription: "${post.metaDescription || ''}"
---

${post.content || ''}
`;

    // Save the file
    fs.writeFileSync(filePath, markdownContent, 'utf8');
    console.log('Blog post saved successfully:', filePath);

    return { success: true, filePath, filename };
  } catch (error) {
    console.error('Error saving blog post:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-content-directory', () => {
  try {
    // Create a dedicated content directory in the user's home directory
    const contentDir = path.join(os.homedir(), 'QuillPilot', 'blog-posts');

    // Ensure the directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    return { success: true, path: contentDir };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('load-blog-posts', async () => {
  try {
    // Get the content directory
    const contentDir = path.join(os.homedir(), 'QuillPilot', 'blog-posts');

    // Check if directory exists
    if (!fs.existsSync(contentDir)) {
      return { success: true, posts: [] };
    }

    // Read all markdown files
    const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.md'));
    const posts = [];

    for (const file of files) {
      try {
        const filePath = path.join(contentDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Parse frontmatter and content
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const postContent = frontmatterMatch[2];

          // Parse frontmatter (simple YAML-like parsing)
          const metadata = {};
          frontmatter.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(': ');
            if (key && valueParts.length > 0) {
              const value = valueParts.join(': ').replace(/^"|"$/g, '');
              try {
                metadata[key] = JSON.parse(value);
              } catch {
                metadata[key] = value;
              }
            }
          });

          posts.push({
            id: metadata.id || file.replace('.md', '').split('_').pop(),
            title: metadata.title || 'Untitled',
            content: postContent,
            createdAt: metadata.createdAt || new Date().toISOString(),
            updatedAt: metadata.updatedAt || new Date().toISOString(),
            status: metadata.status || 'draft',
            seoKeywords: metadata.seoKeywords || [],
            metaDescription: metadata.metaDescription || '',
            filePath: filePath
          });
        }
      } catch (fileError) {
        console.error(`Error parsing file ${file}:`, fileError);
      }
    }

    return { success: true, posts };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('open-content-directory', async () => {
  try {
    // Get the content directory
    const contentDir = path.join(os.homedir(), 'QuillPilot', 'blog-posts');

    // Ensure the directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    // Open the directory in the system file manager
    const { shell } = require('electron');
    shell.openPath(contentDir);

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Test handler to manually create the content directory
ipcMain.handle('test-create-content-directory', () => {
  try {
    ensureContentDirectory();
    return { success: true, message: 'Content directory created/verified' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('save-file', async (event, content, filename) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'HTML', extensions: ['html'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      fs.writeFileSync(filePath, content);
      return { success: true, filePath };
    }
    return { success: false, message: 'Save cancelled' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('open-file', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePaths && filePaths.length > 0) {
      const content = fs.readFileSync(filePaths[0], 'utf8');
      return { success: true, content, filePath: filePaths[0] };
    }
    return { success: false, message: 'No file selected' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// App event handlers
app.whenReady().then(() => {
  ensureContentDirectory(); // Create content directory on startup
  createWindow();
  createMenu();

  // Only start Python backend if not in development mode
  // In dev mode, the backend is started by npm run dev:python
  if (!isDev) {
    startPythonBackend();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Only stop Python backend if we started it (i.e., not in dev mode)
  if (!isDev) {
    stopPythonBackend();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Only stop Python backend if we started it (i.e., not in dev mode)
  if (!isDev) {
    stopPythonBackend();
  }
});

// Handle certificate errors in development
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});
