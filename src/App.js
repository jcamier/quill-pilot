import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BlogEditor from './components/BlogEditor';
import AISettings from './components/AISettings';
import Dashboard from './components/Dashboard';
import { aiService } from './services/aiService';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [aiModels, setAiModels] = useState({ openai: [], ollama: [] });
  const [aiStatus, setAiStatus] = useState({ openai_available: false, ollama_available: false });
  const [loading, setLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);

  // Create content directory for both web and desktop modes
  const ensureContentDirectory = async () => {
    try {
      // Try to create directory using Electron if available
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.getContentDirectory();
          if (result.success) {
            console.log('Content directory ready:', result.path);
          }
        } catch (error) {
          console.log('Electron directory creation failed, using web mode');
        }
      }

      // For web mode, we'll create the directory when first post is saved
      // This ensures the system works regardless of launch mode
      console.log('Content directory will be created when first post is saved');
    } catch (error) {
      console.error('Error ensuring content directory:', error);
    }
  };

  useEffect(() => {
    initializeApp();
    setupElectronMenuListeners();

    return () => {
      // Cleanup menu listeners
      if (window.electronAPI) {
        window.electronAPI.removeMenuListeners();
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);

      // Ensure content directory is ready (works for both web and desktop)
      await ensureContentDirectory();

      // Load blog posts from file system if available
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.loadBlogPosts();
          if (result.success) {
            setBlogPosts(result.posts);
            console.log(`Loaded ${result.posts.length} blog posts from file system`);
          }
        } catch (error) {
          console.log('No file-based posts found, starting with empty state');
        }
      }

      // Initialize AI services
      await initializeAIServices();

      // Load preferences from localStorage as fallback if no file-based posts
      if (blogPosts.length === 0) {
        const savedPosts = localStorage.getItem('quillpilot-posts');
        if (savedPosts) {
          try {
            const parsedPosts = JSON.parse(savedPosts);
            setBlogPosts(parsedPosts);
            console.log('Loaded posts from localStorage as fallback');
          } catch (error) {
            console.error('Error parsing localStorage posts:', error);
          }
        }
      }

    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeAIServices = async () => {
    try {
      // Check AI service health
      const status = await aiService.checkHealth();
      setAiStatus(status);

      // Get available models
      const models = await aiService.getAvailableModels();
      setAiModels(models);
    } catch (error) {
      console.error('Failed to initialize AI services:', error);
    }
  };

  const setupElectronMenuListeners = () => {
    if (window.electronAPI) {
      window.electronAPI.onMenuEvent((event, data) => {
        const channel = event.type || event;

        switch (channel) {
          case 'menu-new-blog-post':
            handleNewBlogPost();
            break;
          case 'menu-save':
            handleSave();
            break;
          case 'menu-export-markdown':
            handleExport('markdown');
            break;
          case 'menu-export-html':
            handleExport('html');
            break;
          case 'menu-ai-generate':
            if (currentView === 'editor') {
              // Trigger AI generation in editor
              setCurrentView('editor');
            }
            break;
          case 'menu-ai-improve':
            if (currentView === 'editor') {
              // Trigger AI improvement in editor
            }
            break;
          case 'menu-ai-settings':
            setCurrentView('settings');
            break;
          default:
            break;
        }
      });
    }
  };

  const handleNewBlogPost = () => {
    const newPost = {
      id: Date.now().toString(),
      title: 'Untitled Blog Post',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      seoKeywords: [],
      metaDescription: '',
      status: 'draft'
    };

    setCurrentPost(newPost);
    setCurrentView('editor');
  };

  const handleSave = async () => {
    if (currentPost && window.electronAPI) {
      try {
        const content = currentPost.content || '';
        const filename = `${currentPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

        const result = await window.electronAPI.saveFile(content, filename);
        if (result.success) {
          console.log('File saved successfully:', result.filePath);
        }
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  };

  const handleExport = async (format) => {
    if (currentPost && window.electronAPI) {
      try {
        let content = currentPost.content || '';
        let filename = `${currentPost.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

        if (format === 'html') {
          // Convert markdown to HTML (basic conversion)
          content = convertMarkdownToHTML(content);
          filename += '.html';
        } else {
          filename += '.md';
        }

        const result = await window.electronAPI.saveFile(content, filename);
        if (result.success) {
          console.log('File exported successfully:', result.filePath);
        }
      } catch (error) {
        console.error('Failed to export file:', error);
      }
    }
  };

  const convertMarkdownToHTML = (markdown) => {
    // Basic markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  };

  const saveBlogPost = async (post) => {
    let updatedPosts = [...blogPosts];
    const existingIndex = updatedPosts.findIndex(p => p.id === post.id);

    if (existingIndex >= 0) {
      updatedPosts[existingIndex] = { ...post, updatedAt: new Date().toISOString() };
    } else {
      updatedPosts.push({ ...post, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    setBlogPosts(updatedPosts);

    // Save to file system if available
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveBlogPost(post);
        if (result.success) {
          console.log('Blog post saved to file system:', result.filePath);
        } else {
          console.error('Failed to save to file system:', result.message);
          // Fallback to localStorage only
          console.log('Using localStorage fallback for this post');
        }
      } catch (error) {
        console.error('Error saving to file system:', error);
        // Fallback to localStorage only
        console.log('Using localStorage fallback for this post');
      }
    }

    // Keep localStorage as fallback
    localStorage.setItem('quillpilot-posts', JSON.stringify(updatedPosts));
    setCurrentPost(post);
  };

  const deleteBlogPost = (postId) => {
    const updatedPosts = blogPosts.filter(p => p.id !== postId);
    setBlogPosts(updatedPosts);
    localStorage.setItem('quillpilot-posts', JSON.stringify(updatedPosts));

    if (currentPost && currentPost.id === postId) {
      setCurrentPost(null);
      setCurrentView('dashboard');
    }
  };

  const openBlogPost = (post) => {
    setCurrentPost(post);
    setCurrentView('editor');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading QuillPilot</h2>
          <p className="text-gray-600">Initializing AI services...</p>
        </div>
      </div>
    );
  }

    return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        aiStatus={aiStatus}
        onNewPost={handleNewBlogPost}
        blogPosts={blogPosts}
        onOpenPost={openBlogPost}
        onDeletePost={deleteBlogPost}
        currentPost={currentPost}
      />

      <main className="flex-1">
        {currentView === 'dashboard' && (
          <Dashboard
            blogPosts={blogPosts}
            onOpenPost={openBlogPost}
            onNewPost={handleNewBlogPost}
            onDeletePost={deleteBlogPost}
            aiStatus={aiStatus}
          />
        )}

        {currentView === 'editor' && (
          <BlogEditor
            post={currentPost}
            onSave={saveBlogPost}
            onDelete={deleteBlogPost}
            aiModels={aiModels}
            aiStatus={aiStatus}
            onNavigateToSettings={() => setCurrentView('settings')}
          />
        )}

        {currentView === 'settings' && (
          <AISettings
            aiModels={aiModels}
            aiStatus={aiStatus}
            onRefresh={initializeApp}
          />
        )}
      </main>
    </div>
  );
}

export default App;
