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
  Link
} from 'lucide-react';
import { aiService } from '../services/aiService';

const BlogEditor = ({ post, onSave, aiModels, aiStatus }) => {
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
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedAiProvider, setSelectedAiProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('');
  const [generateOptions, setGenerateOptions] = useState({
    style: 'informative',
    length: 'medium',
    template: ''
  });

  const contentRef = useRef(null);
  const previewRef = useRef(null);

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

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      let generatedContent;

      if (generateOptions.template === 'blog') {
        // Generate full blog post
        const blogPost = await aiService.generateBlogPost({
          topic: aiPrompt,
          style: generateOptions.style,
          length: generateOptions.length,
          aiProvider: selectedAiProvider,
          model: selectedModel
        });

        updatePost({
          title: blogPost.title || aiPrompt,
          content: blogPost.content || blogPost.introduction + '\n\n' + blogPost.content + '\n\n' + blogPost.conclusion,
          seoKeywords: blogPost.seo_keywords || [],
          metaDescription: blogPost.meta_description || ''
        });
      } else {
        // Generate custom content
        generatedContent = await aiService.generateContent({
          prompt: aiPrompt,
          aiProvider: selectedAiProvider,
          model: selectedModel,
          maxTokens: generateOptions.length === 'short' ? 500 : generateOptions.length === 'medium' ? 1000 : 2000
        });

        const newContent = currentPost.content + (currentPost.content ? '\n\n' : '') + generatedContent;
        updatePost({
          content: newContent,
          seoKeywords: aiService.generateSEOKeywords(currentPost.title, newContent),
          metaDescription: aiService.generateMetaDescription(currentPost.title, newContent)
        });
      }

      setAiPrompt('');
    } catch (error) {
      console.error('AI generation failed:', error);
      alert(`AI generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
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
    <div className="flex-1 flex flex-col h-full bg-white">
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
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* AI Panel */}
        {showAIPanel && (
          <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">AI Assistant</h3>

              {/* AI Provider Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={selectedAiProvider}
                  onChange={(e) => setSelectedAiProvider(e.target.value)}
                  className="w-full input text-sm"
                >
                  {aiStatus.ollama_available && <option value="ollama">Ollama (Local)</option>}
                  {aiStatus.openai_available && <option value="openai">OpenAI</option>}
                </select>
              </div>

              {/* Model Selection */}
              {aiModels[selectedAiProvider]?.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full input text-sm"
                  >
                    <option value="">Default</option>
                    {aiModels[selectedAiProvider].map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Generation Options */}
              <div className="space-y-3 mb-4">
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
                    <option value="persuasive">Persuasive</option>
                    <option value="engaging">Engaging</option>
                    <option value="technical">Technical</option>
                    <option value="casual">Casual</option>
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
                    <option value="short">Short (300-500 words)</option>
                    <option value="medium">Medium (800-1200 words)</option>
                    <option value="long">Long (1500-2000 words)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Templates */}
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Templates</h4>
              <div className="space-y-2">
                {aiService.getBlogTemplates().slice(0, 4).map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className="w-full text-left p-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-gray-500 text-xs">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Prompt */}
            <div className="flex-1 p-4">
              <h4 className="font-medium text-gray-900 mb-2">Generate Content</h4>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to write about..."
                className="w-full h-24 textarea text-sm mb-3"
              />
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isGenerating}
                className="w-full btn-primary text-sm flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
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
