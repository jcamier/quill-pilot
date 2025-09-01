import React, { useState, useEffect, useRef } from 'react';
import {
  PenTool,
  FileText,
  Settings,
  Home,
  Plus,
  Search,
  Clock,
  Trash2,
  Edit3,
  MoreVertical
} from 'lucide-react';

const Sidebar = ({
  currentView,
  setCurrentView,
  aiStatus,
  onNewPost,
  blogPosts = [],
  onOpenPost,
  onDeletePost,
  currentPost
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenuFor, setShowMenuFor] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenuFor(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const getStatusColor = () => {
    if (aiStatus.openai_available || aiStatus.ollama_available) {
      return 'bg-green-500';
    }
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (aiStatus.openai_available && aiStatus.ollama_available) {
      return 'All AI services online';
    } else if (aiStatus.openai_available) {
      return 'OpenAI available';
    } else if (aiStatus.ollama_available) {
      return 'Ollama available';
    }
    return 'No AI services available';
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview and recent posts'
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: Edit3,
      description: 'Write and edit content'
    },
    {
      id: 'settings',
      label: 'AI Settings',
      icon: Settings,
      description: 'Configure AI models'
    }
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <PenTool className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">QuillPilot</h1>
            <p className="text-sm text-gray-500">AI Writing Assistant</p>
          </div>
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-gray-600">{getStatusText()}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-gray-200">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* New Post Button */}
        <button
          onClick={onNewPost}
          className="w-full flex items-center gap-3 px-3 py-3 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Blog Post
        </button>
      </div>

      {/* Recent Posts */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Recent Posts</h2>
            <span className="text-sm text-gray-500">{blogPosts.length}</span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Posts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              {blogPosts.length === 0 ? (
                <div>
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No blog posts yet</p>
                  <p className="text-sm text-gray-400">Create your first post to get started</p>
                </div>
              ) : (
                <div>
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No posts found</p>
                  <p className="text-sm text-gray-400">Try a different search term</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                    currentPost && currentPost.id === post.id
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onOpenPost(post)}
                    >
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                        {post.title || 'Untitled'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        post.status === 'published' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}></span>

                      {/* Post Actions Menu */}
                      <div className="relative" ref={menuRef}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenuFor(showMenuFor === post.id ? null : post.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {showMenuFor === post.id && (
                          <div className="absolute right-0 top-6 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPost(post);
                                setShowMenuFor(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                                  onDeletePost(post.id);
                                  setShowMenuFor(null);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg border-t border-gray-100"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="cursor-pointer"
                    onClick={() => onOpenPost(post)}
                  >
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {truncateContent(post.content.replace(/[#*`]/g, ''))}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(post.updatedAt || post.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{Math.ceil(post.content.split(' ').length / 200)} min read</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
