import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log('AI Service Request:', config.method.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('AI Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        console.error('AI Service Response Error:', error);

        if (error.code === 'ECONNREFUSED') {
          throw new Error('AI service is not running. Please start the Python backend.');
        }

        if (error.response) {
          throw new Error(error.response.data?.error || 'AI service error');
        }

        throw new Error('Network error. Please check your connection.');
      }
    );
  }

  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return {
        status: 'unhealthy',
        openai_available: false,
        ollama_available: false,
        error: error.message
      };
    }
  }

  async getAvailableModels() {
    try {
      const response = await this.client.get('/models');
      return response;
    } catch (error) {
      console.error('Failed to get models:', error.message);
      return {
        openai: [],
        ollama: [],
        error: error.message
      };
    }
  }

  async generateBlogPost(options) {
    const {
      topic,
      style = 'informative',
      length = 'medium',
      aiProvider = 'ollama',
      model = null
    } = options;

    try {
      const response = await this.client.post('/generate-blog', {
        topic,
        style,
        length,
        ai_provider: aiProvider,
        model
      });

      if (response.success) {
        return response.blog_post;
      } else {
        throw new Error(response.error || 'Failed to generate blog post');
      }
    } catch (error) {
      console.error('Blog generation failed:', error.message);
      throw error;
    }
  }

  async generateContent(options) {
    const {
      prompt,
      aiProvider = 'ollama',
      model = null,
      maxTokens = 1000
    } = options;

    try {
      const response = await this.client.post('/generate-content', {
        prompt,
        ai_provider: aiProvider,
        model,
        max_tokens: maxTokens
      });

      if (response.success) {
        return response.content;
      } else {
        throw new Error(response.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Content generation failed:', error.message);
      throw error;
    }
  }

  async generateContentStream(options, onChunk, onComplete, onError) {
    const {
      prompt,
      aiProvider = 'ollama',
      model = null,
      maxTokens = 1000
    } = options;

    try {
      const response = await fetch(`${API_BASE_URL}/generate-content-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          ai_provider: aiProvider,
          model,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  onError(data.error);
                  return;
                }

                if (data.done) {
                  onComplete();
                  return;
                }

                if (data.content) {
                  onChunk(data.content);
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Streaming content generation failed:', error.message);
      onError(error.message);
    }
  }

  async generateBlogPostStream(options, onChunk, onComplete, onError) {
    const {
      topic,
      style = 'informative',
      length = 'medium',
      aiProvider = 'ollama',
      model = null
    } = options;

    try {
      const response = await fetch(`${API_BASE_URL}/generate-blog-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          style,
          length,
          ai_provider: aiProvider,
          model
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  onError(data.error);
                  return;
                }

                if (data.done) {
                  onComplete();
                  return;
                }

                if (data.content) {
                  onChunk(data.content);
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        onComplete();
      }
    } catch (error) {
      console.error('Streaming blog generation failed:', error.message);
      onError(error.message);
    }
  }

  // Predefined blog post templates
  getBlogTemplates() {
    return [
      {
        id: 'how-to',
        name: 'How-To Guide',
        description: 'Step-by-step instructional content',
        style: 'instructional',
        promptTemplate: 'Write a comprehensive how-to guide about {topic}. Include step-by-step instructions, tips, and common pitfalls to avoid.'
      },
      {
        id: 'listicle',
        name: 'Listicle',
        description: 'List-based article format',
        style: 'engaging',
        promptTemplate: 'Create an engaging listicle about {topic}. Use numbered points and make each item valuable and actionable.'
      },
      {
        id: 'review',
        name: 'Product/Service Review',
        description: 'Detailed review format',
        style: 'analytical',
        promptTemplate: 'Write a thorough and balanced review of {topic}. Include pros, cons, and a final recommendation.'
      },
      {
        id: 'opinion',
        name: 'Opinion Piece',
        description: 'Personal perspective article',
        style: 'persuasive',
        promptTemplate: 'Write a compelling opinion piece about {topic}. Present your viewpoint with supporting arguments and evidence.'
      },
      {
        id: 'news',
        name: 'News Article',
        description: 'Factual news reporting',
        style: 'informative',
        promptTemplate: 'Write a news article about {topic}. Focus on facts, quotes, and objective reporting.'
      },
      {
        id: 'tutorial',
        name: 'Technical Tutorial',
        description: 'In-depth technical guide',
        style: 'technical',
        promptTemplate: 'Create a detailed technical tutorial about {topic}. Include code examples, explanations, and best practices.'
      }
    ];
  }

  // SEO optimization helpers
  generateSEOKeywords(topic, content) {
    // Simple keyword extraction - in a real app, you might use a more sophisticated NLP service
    const words = content.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);

    const wordFreq = {};
    words.forEach(word => {
      if (word.length > 3 && !commonWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const keywords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // Always include the main topic
    if (!keywords.includes(topic.toLowerCase())) {
      keywords.unshift(topic.toLowerCase());
    }

    return keywords.slice(0, 8);
  }

  generateMetaDescription(title, content) {
    // Extract first 150-160 characters from content, ending at a complete sentence
    const plainText = content.replace(/[#*`]/g, '').replace(/\n+/g, ' ').trim();
    let description = plainText.substring(0, 150);

    // Try to end at a sentence
    const lastPeriod = description.lastIndexOf('.');
    const lastExclamation = description.lastIndexOf('!');
    const lastQuestion = description.lastIndexOf('?');

    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

    if (lastSentenceEnd > 100) {
      description = description.substring(0, lastSentenceEnd + 1);
    } else {
      // If no good sentence ending, try to end at a word boundary
      const lastSpace = description.lastIndexOf(' ');
      if (lastSpace > 100) {
        description = description.substring(0, lastSpace) + '...';
      }
    }

    return description;
  }
}

// Export singleton instance
export const aiService = new AIService();
