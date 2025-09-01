from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import requests
import json
from dotenv import load_dotenv
import ollama
from openai import OpenAI

# Load environment variables
load_dotenv()

# Pydantic models for request validation
class BlogGenerationRequest(BaseModel):
    topic: str
    style: str = "informative"
    length: str = "medium"
    ai_provider: str = "ollama"
    model: Optional[str] = None

class ContentGenerationRequest(BaseModel):
    prompt: str
    ai_provider: str = "ollama"
    model: Optional[str] = None
    max_tokens: int = 1000

# Response models
class HealthResponse(BaseModel):
    status: str
    openai_available: bool
    ollama_available: bool

class ModelsResponse(BaseModel):
    openai: List[str]
    ollama: List[str]

class BlogPostResponse(BaseModel):
    success: bool
    blog_post: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ContentResponse(BaseModel):
    success: bool
    content: Optional[str] = None
    error: Optional[str] = None

class RootResponse(BaseModel):
    name: str
    status: str
    version: str

# Initialize FastAPI app
app = FastAPI(
    title="QuillPilot AI Backend",
    description="AI-powered writing assistant backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    async def generate_content_openai(self, prompt: str, model: str = "gpt-3.5-turbo", max_tokens: int = 1000) -> str:
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

    async def generate_content_ollama(self, prompt: str, model: str = "llama3", max_tokens: int = 1000) -> str:
        """Generate content using local Ollama models"""
        if not self.ollama_available:
            raise ValueError("Ollama not available")

        response = ollama.generate(
            model=model,
            prompt=prompt,
            options={'num_predict': max_tokens}
        )
        return response['response']

    async def generate_blog_post(self, topic: str, style: str = "informative", length: str = "medium",
                                ai_provider: str = "ollama", model: Optional[str] = None) -> Dict[str, Any]:
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
                content = await self.generate_content_openai(prompt, default_model, length_config[length]['max_tokens'])
            else:  # ollama
                default_model = model or "llama3"
                content = await self.generate_content_ollama(prompt, default_model, length_config[length]['max_tokens'])

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

# Routes
@app.get("/", response_model=RootResponse)
@app.head("/")
async def root():
    """Root endpoint for wait-on health checks"""
    return RootResponse(
        name="QuillPilot AI Backend",
        status="running",
        version="1.0.0"
    )

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        openai_available=content_generator.openai_client is not None,
        ollama_available=content_generator.ollama_available
    )

@app.get("/api/models", response_model=ModelsResponse)
async def get_available_models():
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

    return ModelsResponse(**models)

@app.post("/api/generate-blog", response_model=BlogPostResponse)
async def generate_blog(request: BlogGenerationRequest):
    """Generate blog post content"""
    try:
        if not request.topic:
            raise HTTPException(status_code=400, detail="Topic is required")

        # Generate blog post
        blog_post = await content_generator.generate_blog_post(
            topic=request.topic,
            style=request.style,
            length=request.length,
            ai_provider=request.ai_provider,
            model=request.model
        )

        return BlogPostResponse(
            success=True,
            blog_post=blog_post
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-content", response_model=ContentResponse)
async def generate_content(request: ContentGenerationRequest):
    """Generate custom content based on prompt"""
    try:
        if not request.prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")

        # Generate content
        if request.ai_provider == "openai":
            default_model = request.model or "gpt-3.5-turbo"
            content = await content_generator.generate_content_openai(
                request.prompt, default_model, request.max_tokens
            )
        else:  # ollama
            default_model = request.model or "llama2"
            content = await content_generator.generate_content_ollama(
                request.prompt, default_model, request.max_tokens
            )

        return ContentResponse(
            success=True,
            content=content
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    print("Starting QuillPilot AI Backend...")
    print(f"OpenAI Available: {content_generator.openai_client is not None}")
    print(f"Ollama Available: {content_generator.ollama_available}")
    uvicorn.run(app, host="0.0.0.0", port=5001, reload=True)