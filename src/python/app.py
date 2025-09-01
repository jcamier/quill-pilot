from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import os
import requests
import json
import time
import asyncio
from collections import defaultdict
from datetime import datetime, timedelta
from dotenv import load_dotenv
import ollama
from openai import OpenAI

# Load environment variables
load_dotenv()

# Simple in-memory rate limiter
class SimpleRateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int = 10, window_minutes: int = 1) -> bool:
        now = datetime.now()
        window_start = now - timedelta(minutes=window_minutes)

        # Clean old requests
        self.requests[key] = [req_time for req_time in self.requests[key] if req_time > window_start]

        # Check if under limit
        if len(self.requests[key]) < max_requests:
            self.requests[key].append(now)
            return True
        return False

# Global rate limiter instance
rate_limiter = SimpleRateLimiter()

# Rate limiting helper
def check_rate_limit(request: Request, max_requests: int = 5, window_minutes: int = 1):
    client_ip = request.client.host
    if not rate_limiter.is_allowed(client_ip, max_requests, window_minutes):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Max {max_requests} requests per {window_minutes} minute(s)",
            headers={"Retry-After": str(window_minutes * 60)}
        )

# Pydantic models for request validation
class BlogGenerationRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=200, description="Blog topic (3-200 characters)")
    style: str = Field("informative", description="Writing style")
    length: str = Field("medium", description="Content length")
    ai_provider: str = Field("ollama", description="AI provider to use")
    model: Optional[str] = Field(None, description="Specific model to use")
    stream: bool = Field(False, description="Enable streaming response")

    @validator('style')
    def validate_style(cls, v):
        allowed_styles = ['informative', 'creative', 'technical', 'casual', 'professional', 'academic']
        if v not in allowed_styles:
            raise ValueError(f'Style must be one of: {", ".join(allowed_styles)}')
        return v

    @validator('length')
    def validate_length(cls, v):
        if v not in ['short', 'medium', 'long']:
            raise ValueError('Length must be: short, medium, or long')
        return v

    @validator('ai_provider')
    def validate_ai_provider(cls, v):
        if v not in ['openai', 'ollama']:
            raise ValueError('AI provider must be: openai or ollama')
        return v

class ContentGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=2000, description="Content generation prompt")
    ai_provider: str = Field("ollama", description="AI provider to use")
    model: Optional[str] = Field(None, description="Specific model to use")
    max_tokens: int = Field(1000, ge=50, le=4000, description="Maximum tokens to generate")
    stream: bool = Field(False, description="Enable streaming response")

    @validator('ai_provider')
    def validate_ai_provider(cls, v):
        if v not in ['openai', 'ollama']:
            raise ValueError('AI provider must be: openai or ollama')
        return v

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

# Performance monitoring middleware
@app.middleware("http")
async def add_performance_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 4))
    response.headers["X-Server"] = "QuillPilot FastAPI"
    return response

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

    async def generate_content_openai(self, prompt: str, model: str = "gpt-3.5-turbo", max_tokens: int = 1000, stream: bool = False):
        """Generate content using OpenAI GPT models"""
        if not self.openai_client:
            raise ValueError("OpenAI client not configured")

        if stream:
            return self.openai_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.7,
                stream=True
            )
        else:
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content

    async def generate_content_ollama(self, prompt: str, model: str = "llama3", max_tokens: int = 1000, stream: bool = False):
        """Generate content using local Ollama models"""
        if not self.ollama_available:
            raise ValueError("Ollama not available")

        response = ollama.generate(
            model=model,
            prompt=prompt,
            options={'num_predict': max_tokens},
            stream=stream
        )

        if stream:
            return response
        else:
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
async def generate_blog(blog_request: BlogGenerationRequest, request: Request):
    """Generate blog post content"""
    # Rate limiting: 3 blog generations per minute
    check_rate_limit(request, max_requests=3, window_minutes=1)

    try:
        if not blog_request.topic:
            raise HTTPException(status_code=400, detail="Topic is required")

        # Generate blog post
        blog_post = await content_generator.generate_blog_post(
            topic=blog_request.topic,
            style=blog_request.style,
            length=blog_request.length,
            ai_provider=blog_request.ai_provider,
            model=blog_request.model
        )

        return BlogPostResponse(
            success=True,
            blog_post=blog_post
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-content", response_model=ContentResponse)
async def generate_content(content_request: ContentGenerationRequest, request: Request):
    """Generate custom content based on prompt"""
    # Rate limiting: 5 content generations per minute
    check_rate_limit(request, max_requests=5, window_minutes=1)

    try:
        if not content_request.prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")

        # Generate content
        if content_request.ai_provider == "openai":
            default_model = content_request.model or "gpt-3.5-turbo"
            content = await content_generator.generate_content_openai(
                content_request.prompt, default_model, content_request.max_tokens
            )
        else:  # ollama
            default_model = content_request.model or "llama2"
            content = await content_generator.generate_content_ollama(
                content_request.prompt, default_model, content_request.max_tokens
            )

        return ContentResponse(
            success=True,
            content=content
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-content-stream")
async def generate_content_stream(content_request: ContentGenerationRequest, request: Request):
    """Generate custom content with streaming response"""
    # Rate limiting: 3 streaming requests per minute
    check_rate_limit(request, max_requests=3, window_minutes=1)

    try:
        if not content_request.prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")

        async def generate_stream():
            try:
                if content_request.ai_provider == "openai":
                    default_model = content_request.model or "gpt-3.5-turbo"
                    stream = await content_generator.generate_content_openai(
                        content_request.prompt, default_model, content_request.max_tokens, stream=True
                    )

                    for chunk in stream:
                        if chunk.choices[0].delta.content is not None:
                            content = chunk.choices[0].delta.content
                            yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"
                            await asyncio.sleep(0.01)  # Small delay for better UX

                    yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"

                else:  # ollama
                    default_model = content_request.model or "llama2"
                    stream = await content_generator.generate_content_ollama(
                        content_request.prompt, default_model, content_request.max_tokens, stream=True
                    )

                    for chunk in stream:
                        if chunk.get('response'):
                            content = chunk['response']
                            yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"
                            await asyncio.sleep(0.01)

                    yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-blog-stream")
async def generate_blog_stream(blog_request: BlogGenerationRequest, request: Request):
    """Generate blog post with streaming response"""
    # Rate limiting: 2 blog streaming requests per minute
    check_rate_limit(request, max_requests=2, window_minutes=1)

    try:
        if not blog_request.topic:
            raise HTTPException(status_code=400, detail="Topic is required")

        # Define length parameters
        length_config = {
            "short": {"words": "300-500", "max_tokens": 600},
            "medium": {"words": "800-1200", "max_tokens": 1200},
            "long": {"words": "1500-2000", "max_tokens": 2000}
        }

        # Create prompt based on parameters
        prompt = f"""
Write a {blog_request.style} blog post about "{blog_request.topic}".
The post should be {length_config[blog_request.length]['words']} words long.
Include:
- An engaging title
- A compelling introduction
- Well-structured main content with subheadings
- A conclusion that summarizes key points
- SEO-friendly content

Style: {blog_request.style}
Topic: {blog_request.topic}

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

        async def generate_blog_stream():
            try:
                if blog_request.ai_provider == "openai":
                    default_model = blog_request.model or "gpt-3.5-turbo"
                    stream = await content_generator.generate_content_openai(
                        prompt, default_model, length_config[blog_request.length]['max_tokens'], stream=True
                    )

                    for chunk in stream:
                        if chunk.choices[0].delta.content is not None:
                            content = chunk.choices[0].delta.content
                            yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"
                            await asyncio.sleep(0.01)

                    yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"

                else:  # ollama
                    default_model = blog_request.model or "llama3"
                    stream = await content_generator.generate_content_ollama(
                        prompt, default_model, length_config[blog_request.length]['max_tokens'], stream=True
                    )

                    for chunk in stream:
                        if chunk.get('response'):
                            content = chunk['response']
                            yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"
                            await asyncio.sleep(0.01)

                    yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

        return StreamingResponse(
            generate_blog_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    print("Starting QuillPilot AI Backend...")
    print(f"OpenAI Available: {content_generator.openai_client is not None}")
    print(f"Ollama Available: {content_generator.ollama_available}")
    uvicorn.run(app, host="0.0.0.0", port=5001, reload=True)