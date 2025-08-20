import React, { useState } from 'react';
import {
  Plus,
  FileText,
  TrendingUp,
  Clock,
  Edit3,
  Trash2,
  ExternalLink,
  BarChart3,
  Calendar,
  Target,
  Zap
} from 'lucide-react';

const Dashboard = ({
  blogPosts = [],
  onOpenPost,
  onNewPost,
  onDeletePost,
  aiStatus
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Calculate statistics
  const totalPosts = blogPosts.length;
  const publishedPosts = blogPosts.filter(post => post.status === 'published').length;
  const draftPosts = blogPosts.filter(post => post.status === 'draft').length;
  const totalWords = blogPosts.reduce((sum, post) => sum + (post.content || '').split(' ').length, 0);

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPosts = blogPosts.filter(post =>
    new Date(post.updatedAt || post.createdAt) >= sevenDaysAgo
  ).length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getReadingTime = (content) => {
    const words = (content || '').split(' ').length;
    return Math.ceil(words / 200);
  };

  const handleDeletePost = (postId) => {
    onDeletePost(postId);
    setShowDeleteConfirm(null);
  };

  const recentBlogPosts = blogPosts
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your writing overview.</p>
        </div>

        {/* AI Status Alert */}
        {!aiStatus.openai_available && !aiStatus.ollama_available && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <div>
                <h3 className="font-medium text-amber-800">AI Services Offline</h3>
                <p className="text-sm text-amber-700">
                  Connect to OpenAI or start Ollama to enable AI-powered writing features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={onNewPost}
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all text-left"
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">New Blog Post</h3>
                <p className="text-sm text-gray-500">Start writing with AI assistance</p>
              </div>
            </button>

            <button
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all text-left"
              disabled={!aiStatus.openai_available && !aiStatus.ollama_available}
            >
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI Content Ideas</h3>
                <p className="text-sm text-gray-500">Get inspiration from AI</p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all text-left">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Writing Goals</h3>
                <p className="text-sm text-gray-500">Set and track progress</p>
              </div>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Posts</h3>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalPosts}</div>
              <div className="text-sm text-gray-500 mt-1">
                {publishedPosts} published, {draftPosts} drafts
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Words</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {totalWords.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                ~{Math.ceil(totalWords / 200)} minutes reading
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">This Week</h3>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{recentPosts}</div>
              <div className="text-sm text-gray-500 mt-1">
                Posts created or updated
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">AI Status</h3>
                <Zap className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {aiStatus.openai_available || aiStatus.ollama_available ? 'Active' : 'Offline'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {aiStatus.openai_available && 'OpenAI'}
                {aiStatus.openai_available && aiStatus.ollama_available && ' & '}
                {aiStatus.ollama_available && 'Ollama'}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            {totalPosts > 5 && (
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all posts
              </button>
            )}
          </div>

          {recentBlogPosts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts yet</h3>
                <p className="text-gray-500 mb-6">Create your first blog post to get started with QuillPilot.</p>
                <button
                  onClick={onNewPost}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Post
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {recentBlogPosts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {post.title || 'Untitled'}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.status || 'draft'}
                          </span>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {post.content ?
                            post.content.replace(/[#*`]/g, '').substring(0, 150) + '...' :
                            'No content yet...'
                          }
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.updatedAt || post.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {getReadingTime(post.content)} min read
                          </div>
                          {post.seoKeywords && post.seoKeywords.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span>{post.seoKeywords.length} keywords</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => onOpenPost(post)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit post"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(post.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Post</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
