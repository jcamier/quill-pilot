import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Wand2,
  Eye,
  EyeOff,
  Settings,
  Download,
  FileText,
  Lightbulb,
  RefreshCw,
  Tag,
  Search,
  Type,
  AlignLeft,
  Bold,
  Italic,
  List,
  Link,
  Trash2
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { preferencesService } from '../services/preferencesService';

const BlogEditor = ({ post, onSave, onDelete, aiModels, aiStatus, onNavigateToSettings }) => {
  const [currentPost, setCurrentPost] = useState(post || {
    id: Date.now().toString(),
    title: '',
    content: '',
    seoKeywords: [],
    metaDescription: '',
    status: 'draft'
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedAiProvider, setSelectedAiProvider] = useState('ollama');
  const [generateOptions, setGenerateOptions] = useState({
    style: 'informative',
    length: 'medium',
    template: ''
  });

  const contentRef = useRef(null);
  const previewRef = useRef(null);
  const streamingContentRef = useRef('');

  useEffect(() => {
    if (post) {
      setCurrentPost(post);
    }
  }, [post]);

  useEffect(() => {
    // Auto-save functionality
    const timer = setTimeout(() => {
      if (currentPost.title || currentPost.content) {
        onSave(currentPost);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentPost, onSave]);

  const updatePost = (updates) => {
    setCurrentPost(prev => ({ ...prev, ...updates }));
  };

  const handleTitleChange = (e) => {
    updatePost({ title: e.target.value });
  };

  const handleContentChange = (e) => {
    const content = e.target.value;
    updatePost({
      content,
      seoKeywords: aiService.generateSEOKeywords(currentPost.title, content),
      metaDescription: aiService.generateMetaDescription(currentPost.title, content)
    });
  };

  const handleSave = () => {
    onSave(currentPost);
  };

  const handleDelete = () => {
    if (currentPost && currentPost.id && window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      onDelete(currentPost.id);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;

    console.log('Starting AI generation...', {
      prompt: aiPrompt,
      selectedProvider: selectedAiProvider,
      aiStatus: aiStatus
    });

    // Declare variables at function scope so they're accessible in catch block
    let currentProvider = selectedAiProvider;
    let selectedModel = null;

    setIsGenerating(true);
    try {
      // Determine which AI provider to use based on availability and user preference
      if (!aiStatus[currentProvider + '_available']) {
        currentProvider = aiStatus.ollama_available ? 'ollama' : aiStatus.openai_available ? 'openai' : null;
      }

      if (!currentProvider) {
        throw new Error('No AI providers are available. Please configure Ollama or OpenAI in Settings.');
      }

      // Get the user's preferred model for the selected provider
      const availableModels = aiModels[currentProvider] || [];
      selectedModel = preferencesService.getBestModelForProvider(currentProvider, availableModels);

      console.log('AI generation details:', {
        currentProvider,
        selectedModel,
        availableModels: availableModels.length,
        generateOptions
      });

      // Start streaming generation
      setIsStreaming(true);
      setStreamingContent('');
      streamingContentRef.current = '';

      if (generateOptions.template === 'blog') {
        // Generate full blog post with streaming
        await aiService.generateBlogPostStream({
          topic: aiPrompt,
          style: generateOptions.style,
          length: generateOptions.length,
          aiProvider: currentProvider,
          model: selectedModel
        },
        // onChunk callback
        (chunk) => {
          streamingContentRef.current += chunk;
          setStreamingContent(streamingContentRef.current);
        },
        // onComplete callback
        () => {
          const finalContent = streamingContentRef.current;
          console.log('Blog generation completed, final content:', finalContent);

          // Parse the streaming content as JSON for blog posts
          try {
            const blogData = JSON.parse(finalContent);
            updatePost({
              title: blogData.title || aiPrompt,
              content: blogData.content || blogData.introduction + '\n\n' + blogData.content + '\n\n' + blogData.conclusion,
              seoKeywords: blogData.seo_keywords || [],
              metaDescription: blogData.meta_description || ''
            });
          } catch (parseError) {
            console.log('JSON parsing failed, using raw content:', parseError);
            // If JSON parsing fails, use the raw content
            updatePost({
              title: aiPrompt,
              content: finalContent,
              seoKeywords: aiService.generateSEOKeywords(aiPrompt, finalContent),
              metaDescription: aiService.generateMetaDescription(aiPrompt, finalContent)
            });
          }
          setIsStreaming(false);
          setStreamingContent('');
          streamingContentRef.current = '';
          setAiPrompt('');
        },
        // onError callback
        (error) => {
          console.error('Streaming blog generation failed:', error);
          setIsStreaming(false);
          setStreamingContent('');
          streamingContentRef.current = '';
          throw new Error(`Blog generation failed: ${error}`);
        }
        );
      } else {
        // Generate custom content with streaming
        await aiService.generateContentStream({
          prompt: aiPrompt,
          aiProvider: currentProvider,
          model: selectedModel,
          maxTokens: generateOptions.length === 'short' ? 500 : generateOptions.length === 'medium' ? 1000 : 2000
        },
        // onChunk callback
        (chunk) => {
          streamingContentRef.current += chunk;
          setStreamingContent(streamingContentRef.current);
        },
        // onComplete callback
        () => {
          const finalContent = streamingContentRef.current;
          console.log('Content generation completed, final content length:', finalContent.length);

          const newContent = currentPost.content + (currentPost.content ? '\n\n' : '') + finalContent;
          updatePost({
            content: newContent,
            seoKeywords: aiService.generateSEOKeywords(currentPost.title, newContent),
            metaDescription: aiService.generateMetaDescription(currentPost.title, newContent)
          });
          setIsStreaming(false);
          setStreamingContent('');
          streamingContentRef.current = '';
          setAiPrompt('');
        },
        // onError callback
        (error) => {
          console.error('Streaming content generation failed:', error);
          setIsStreaming(false);
          setStreamingContent('');
          streamingContentRef.current = '';
          throw new Error(`Content generation failed: ${error}`);
        }
        );
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      console.error('Error details:', {
        provider: currentProvider,
        model: selectedModel,
        prompt: aiPrompt,
        options: generateOptions
      });

      let errorMessage = 'AI generation failed';
      if (error.message.includes('AI service is not running')) {
        errorMessage = 'AI service is not running. Please check if Ollama is running or OpenAI is configured.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'AI generation timed out. Try a shorter prompt or check your connection.';
      } else if (error.message.includes('No AI providers')) {
        errorMessage = 'No AI providers available. Please configure Ollama or OpenAI in Settings.';
      } else {
        errorMessage = `AI generation failed: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
      setStreamingContent('');
      streamingContentRef.current = '';
    }
  };

  const handleTemplateSelect = (template) => {
    const templates = aiService.getBlogTemplates();
    const selectedTemplate = templates.find(t => t.id === template);

    if (selectedTemplate) {
      setAiPrompt(selectedTemplate.promptTemplate.replace('{topic}', ''));
      setGenerateOptions(prev => ({
        ...prev,
        template: 'blog',
        style: selectedTemplate.style
      }));
    }
  };

  const insertText = (before, after = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = before + selectedText + after;

    const newContent = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    updatePost({ content: newContent });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const formatMarkdown = (content) => {
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>')
      .replace(/^(.+)$/gim, '<p class="mb-4">$1</p>');
  };

  const wordCount = currentPost.content.split(' ').filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">Blog Editor</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{readingTime} min read</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition-colors ${
              showPreview ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Toggle preview"
          >
            {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`p-2 rounded-lg transition-colors ${
              showAIPanel ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="AI Assistant"
            disabled={!aiStatus.openai_available && !aiStatus.ollama_available}
          >
            <Wand2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
            title="Delete Post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* AI Panel */}
        {showAIPanel && (
          <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
            {/* AI Panel Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">AI Assistant</h3>

              {/* Show current AI provider and model */}
              {(() => {
                // Determine which AI provider to use based on availability and user preference
                let currentProvider = selectedAiProvider;
                if (!aiStatus[currentProvider + '_available']) {
                  currentProvider = aiStatus.ollama_available ? 'ollama' : aiStatus.openai_available ? 'openai' : null;
                }

                if (currentProvider) {
                  const availableModels = aiModels[currentProvider] || [];
                  const currentModel = preferencesService.getBestModelForProvider(currentProvider, availableModels);

                  return (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">
                          {currentProvider === 'ollama' ? 'Ollama (Local)' : 'OpenAI (Cloud)'}
                        </span>
                      </div>
                      {currentModel && (
                        <p className="text-xs text-green-700">
                          Using: <span className="font-medium">{currentModel}</span>
                        </p>
                      )}
                      <p className="text-xs text-green-600 mt-1">
                        Change in{' '}
                        <button
                          onClick={onNavigateToSettings}
                          className="text-green-700 underline hover:text-green-800 font-medium"
                        >
                          AI Settings ⚙️
                        </button>
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium mb-1">No AI providers configured</p>
                      <p className="text-xs text-yellow-700">
                        Configure in{' '}
                        <button
                          onClick={onNavigateToSettings}
                          className="text-yellow-800 underline hover:text-yellow-900 font-medium"
                        >
                          AI Settings ⚙️
                        </button>
                      </p>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Generation Options */}
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Generation Type
                  </label>
                  <select
                    value={generateOptions.template}
                    onChange={(e) => setGenerateOptions(prev => ({ ...prev, template: e.target.value }))}
                    className="w-full input text-sm"
                  >
                    <option value="">Custom Content (append)</option>
                    <option value="blog">Full Blog Post (replace)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Style
                    </label>
                    <select
                      value={generateOptions.style}
                      onChange={(e) => setGenerateOptions(prev => ({ ...prev, style: e.target.value }))}
                      className="w-full input text-sm"
                    >
                      <option value="informative">Informative</option>
                      <option value="conversational">Conversational</option>
                      <option value="persuasive">Persuasive</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Length
                    </label>
                    <select
                      value={generateOptions.length}
                      onChange={(e) => setGenerateOptions(prev => ({ ...prev, length: e.target.value }))}
                      className="w-full input text-sm"
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Chat Interface */}
            <div className="flex-1 p-4">
              <h4 className="font-medium text-gray-900 mb-2">Generate Content</h4>
              <p className="text-xs text-gray-600 mb-3">
                Describe what you want to write. Be specific for better results.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: 'Write an introduction about the benefits of remote work' or 'Add 5 tips for better productivity'"
                className="w-full h-32 textarea text-sm mb-3 resize-none"
              />
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isGenerating || isStreaming || (!aiStatus.ollama_available && !aiStatus.openai_available)}
                className="w-full btn-primary text-sm flex items-center justify-center gap-2"
              >
                {isGenerating || isStreaming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isStreaming ? 'AI Writing...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        )}

                  {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Title */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={currentPost.title}
                onChange={handleTitleChange}
                placeholder="Enter your blog post title..."
                className="w-full text-2xl font-bold border-none outline-none placeholder-gray-400"
              />
            </div>

            {/* Streaming Content Indicator */}
            {isStreaming && (
              <div className="p-4 border-b border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-700">AI is writing...</span>
                </div>
                <div className="text-sm text-blue-600 bg-white p-3 rounded border border-blue-200 max-h-32 overflow-y-auto">
                  {streamingContent || 'Starting generation...'}
                </div>
              </div>
            )}

          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => insertText('**', '**')}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertText('*', '*')}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertText('# ', '')}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded"
              title="Heading"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertText('- ', '')}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded"
              title="List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertText('[', '](url)')}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded"
              title="Link"
            >
              <Link className="w-4 h-4" />
            </button>
          </div>

          {/* Editor/Preview */}
          <div className="flex-1 flex">
            {/* Editor */}
            <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col`}>
              <textarea
                ref={contentRef}
                value={currentPost.content}
                onChange={handleContentChange}
                placeholder="Start writing your blog post... Use Markdown for formatting."
                className="flex-1 p-4 border-none outline-none resize-none font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="w-1/2 border-l border-gray-200 overflow-auto">
                <div
                  ref={previewRef}
                  className="p-4 prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdown(currentPost.content || 'Nothing to preview yet...')
                  }}
                />
              </div>
            )}
          </div>

          {/* SEO Panel */}
          {currentPost.seoKeywords?.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Keywords:</span>
                  <div className="flex gap-1">
                    {currentPost.seoKeywords.slice(0, 5).map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
