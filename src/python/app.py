from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from dotenv import load_dotenv
import ollama
from openai import OpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

class AIContentGenerator:
    def __init__(self):
        self.openai_client = None
        self.ollama_available = False
        self.setup_ai_clients()

    def setup_ai_clients(self):
        """Initialize AI clients based on available configurations"""
        # Setup OpenAI client if API key is available
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            self.openai_client = OpenAI(api_key=openai_key)

        # Check if Ollama is available
        try:
            ollama.list()
            self.ollama_available = True
        except:
            self.ollama_available = False

    def generate_content_openai(self, prompt, model="gpt-3.5-turbo", max_tokens=1000):
        """Generate content using OpenAI GPT models"""
        if not self.openai_client:
            raise ValueError("OpenAI client not configured")

        response = self.openai_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content

    def generate_content_ollama(self, prompt, model="llama3", max_tokens=1000):
        """Generate content using local Ollama models"""
        if not self.ollama_available:
            raise ValueError("Ollama not available")

        response = ollama.generate(
            model=model,
            prompt=prompt,
            options={'num_predict': max_tokens}
        )
        return response['response']

    def generate_blog_post(self, topic, style="informative", length="medium", ai_provider="ollama", model=None):
        """Generate a complete blog post based on topic and parameters"""

        # Define length parameters
        length_config = {
            "short": {"words": "300-500", "max_tokens": 600},
            "medium": {"words": "800-1200", "max_tokens": 1200},
            "long": {"words": "1500-2000", "max_tokens": 2000}
        }

        # Create prompt based on parameters
        prompt = f"""
Write a {style} blog post about "{topic}".
The post should be {length_config[length]['words']} words long.
Include:
- An engaging title
- A compelling introduction
- Well-structured main content with subheadings
- A conclusion that summarizes key points
- SEO-friendly content

Style: {style}
Topic: {topic}

Please format the response as JSON with the following structure:
{{
    "title": "Blog post title",
    "introduction": "Introduction paragraph",
    "content": "Main content with subheadings (use markdown formatting)",
    "conclusion": "Conclusion paragraph",
    "seo_keywords": ["keyword1", "keyword2", "keyword3"],
    "meta_description": "SEO meta description"
}}
"""

        try:
            if ai_provider == "openai":
                default_model = model or "gpt-3.5-turbo"
                content = self.generate_content_openai(prompt, default_model, length_config[length]['max_tokens'])
            else:  # ollama
                default_model = model or "llama3"
                content = self.generate_content_ollama(prompt, default_model, length_config[length]['max_tokens'])

            # Try to parse as JSON, fallback to plain text if needed
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return {
                    "title": f"Blog Post: {topic}",
                    "introduction": "AI-generated introduction",
                    "content": content,
                    "conclusion": "AI-generated conclusion",
                    "seo_keywords": [topic.lower()],
                    "meta_description": f"Learn about {topic} in this comprehensive blog post."
                }

        except Exception as e:
            raise Exception(f"Error generating content: {str(e)}")

# Initialize the content generator
content_generator = AIContentGenerator()

@app.route('/', methods=['GET', 'HEAD'])
def root():
    """Root endpoint for wait-on health checks"""
    return jsonify({
        "name": "QuillPilot AI Backend",
        "status": "running",
        "version": "1.0.0"
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "openai_available": content_generator.openai_client is not None,
        "ollama_available": content_generator.ollama_available
    })

@app.route('/api/models', methods=['GET'])
def get_available_models():
    """Get list of available AI models"""
    models = {
        "openai": [],
        "ollama": []
    }

    # Get OpenAI models if available
    if content_generator.openai_client:
        models["openai"] = ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo-preview"]

    # Get Ollama models if available
    if content_generator.ollama_available:
        try:
            ollama_models = ollama.list()
            models["ollama"] = [model['name'] for model in ollama_models.get('models', [])]
        except:
            models["ollama"] = ["llama2"]  # Default fallback

    return jsonify(models)

@app.route('/api/generate-blog', methods=['POST'])
def generate_blog():
    """Generate blog post content"""
    try:
        data = request.get_json()

        # Extract parameters
        topic = data.get('topic', '')
        style = data.get('style', 'informative')
        length = data.get('length', 'medium')
        ai_provider = data.get('ai_provider', 'ollama')
        model = data.get('model')

        if not topic:
            return jsonify({"error": "Topic is required"}), 400

        # Generate blog post
        blog_post = content_generator.generate_blog_post(
            topic=topic,
            style=style,
            length=length,
            ai_provider=ai_provider,
            model=model
        )

        return jsonify({
            "success": True,
            "blog_post": blog_post
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/generate-content', methods=['POST'])
def generate_content():
    """Generate custom content based on prompt"""
    try:
        data = request.get_json()

        prompt = data.get('prompt', '')
        ai_provider = data.get('ai_provider', 'ollama')
        model = data.get('model')
        max_tokens = data.get('max_tokens', 1000)

        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        # Generate content
        if ai_provider == "openai":
            default_model = model or "gpt-3.5-turbo"
            content = content_generator.generate_content_openai(prompt, default_model, max_tokens)
        else:  # ollama
            default_model = model or "llama2"
            content = content_generator.generate_content_ollama(prompt, default_model, max_tokens)

        return jsonify({
            "success": True,
            "content": content
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("Starting QuillPilot AI Backend...")
    print(f"OpenAI Available: {content_generator.openai_client is not None}")
    print(f"Ollama Available: {content_generator.ollama_available}")
    app.run(debug=True, port=5001)
