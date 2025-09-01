# 🖋️ QuillPilot

**AI-Powered Writing Assistant for Content Creators**

QuillPilot is a desktop application that helps writers and content creators produce high-quality blog content using AI assistance. It runs completely on your computer and supports both local AI models (like Llama3 via Ollama) and cloud-based AI services (OpenAI).

## 🎯 Quick Start for Writers

**Just want to start writing?**

1. **Double-click** `QuillPilot.command` in your QuillPilot folder
2. The app will guide you through any setup needed
3. Start creating amazing blog content with AI assistance!

*For detailed setup instructions, see the [Setup Guide](#setup-guide) below.*

## ✨ Features

- **AI-Powered Content Generation**: Generate blog posts, improve writing, and get content ideas
- **Multiple AI Providers**: Support for both Ollama (local) and OpenAI (cloud)
- **Rich Text Editor**: Markdown-based editor with live preview
- **Blog Templates**: Pre-built templates for different content types
- **SEO Optimization**: Automatic keyword extraction and meta description generation
- **File Management**: Save, load, and export content in multiple formats
- **Desktop Integration**: Native desktop app with menu integration

## 🎨 Using QuillPilot (For Writers)

### Creating Your First Blog Post
1. **Click "New Blog Post"** in the app
2. **Add a title** for your blog post
3. **Choose your approach**:
   - Write manually and use AI to help improve
   - Let AI generate a complete blog post from a topic
   - Use templates (How-to guides, Lists, Reviews, etc.)

### Using AI Features
1. **Click the magic wand icon** (🪄) to open AI Assistant
2. **Choose your AI**:
   - **Ollama (Local)** - Free, private, runs on your computer
   - **OpenAI** - Requires API key, very powerful
3. **Pick a model** (like llama3 for local AI)
4. **Type what you want** and click Generate!

### AI Writing Templates
- **How-To Guide** - Step-by-step instructions
- **Listicle** - "10 Best..." or "5 Ways to..." posts
- **Product Review** - Balanced reviews with pros/cons
- **Opinion Piece** - Your thoughts and arguments
- **News Article** - Factual reporting style

### Writing Workflow Tips
1. **Start with AI**: Generate a first draft or outline
2. **Edit and personalize**: Add your voice and experiences
3. **Use AI for improvement**: Select text and ask AI to improve it
4. **SEO optimization**: AI automatically suggests keywords
5. **Export when done**: Save as Markdown or HTML

## 🚀 Setup Guide

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Ollama** (optional, for local AI) - [Download here](https://ollama.ai)
- **OpenAI API Key** (optional, for cloud AI)

### Installation

**For Writers (Simple):**
1. Get the QuillPilot folder
2. Double-click `QuillPilot.command`
3. Follow any setup prompts - the app will guide you!

**For Developers:**
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd QuillPilot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd src/python && pip install -r requirements.txt
   ```

3. **Configure environment** (optional):
   ```bash
   # Copy the environment template
   cp src/python/env_example.txt src/python/.env

   # Edit .env and add your OpenAI API key if you want to use OpenAI
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Setting Up AI Providers

#### Option 1: Ollama (Local AI) - Recommended for Privacy

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)

2. **Pull a model** (choose one):
   ```bash
   # General purpose model (recommended)
   ollama pull llama3

   # Code-focused model
   ollama pull codellama

   # Fast and efficient model
   ollama pull mistral
   ```

3. **Start Ollama service**:
   ```bash
   ollama serve
   ```

#### Option 2: OpenAI (Cloud AI)

1. **Get an API key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)

2. **Add your API key**: Use the AI Settings panel in the app or add it to your `.env` file

### Starting QuillPilot

**Easy Launch (Recommended):**
```bash
# Interactive menu - choose web or desktop mode
./start.sh
```

When you run `./start.sh`, you'll see a simple menu:
```
🚀 Choose how to run QuillPilot:

1. 🌐 Web App (for developers - opens in browser)
2. 🖥️  Desktop App (for regular use - native app)
3. ❌ Cancel

Enter your choice (1-3):
```

**Direct Launch:**
```bash
./start.sh web       # Web app (opens in browser)
./start.sh desktop   # Desktop app (native app)
```

**Double-Click Launch:**
- **Double-click `QuillPilot.command`** → Automatically launches desktop app

**For Developers:**
```bash
# Individual services (for development)
npm run dev:web      # Web app + backend only
npm run dev:desktop  # Desktop app + backend
npm run dev:python   # Backend API only
```

### Launch Modes Explained

#### 🌐 Web App Mode (`./start.sh web`)
- **Best for**: Developers, debugging, browser DevTools
- **Opens**: Browser tab at http://localhost:3000
- **Includes**: React dev server + FastAPI backend
- **Use when**: You want to inspect elements, debug, or prefer browser

#### 🖥️ Desktop App Mode (`./start.sh desktop`)
- **Best for**: Regular writing, clean interface, native feel
- **Opens**: Native desktop application
- **Includes**: Background React server + FastAPI backend + Electron
- **Use when**: You want a distraction-free writing environment

**What happens when you start:**
- FastAPI backend starts (http://localhost:5001) with AI endpoints
- React development server starts (background or browser)
- Your Ollama models are detected and ready to use
- OpenAI integration available if API key is configured

## 🏗️ Architecture

```
QuillPilot/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.js     # Main dashboard
│   │   ├── BlogEditor.js    # Content editor
│   │   ├── Sidebar.js       # Navigation sidebar
│   │   └── AISettings.js    # AI configuration
│   ├── services/
│   │   └── aiService.js     # AI integration service
│   └── python/             # Python backend
│       ├── app.py          # FastAPI server with streaming
│       └── requirements.txt # Python dependencies
├── public/
│   ├── electron.js         # Electron main process
│   └── preload.js          # Electron preload script
└── package.json           # Node.js dependencies
```

## 🎯 Usage Guide

### Creating Your First Blog Post

1. **Launch QuillPilot** and ensure at least one AI service is configured
2. **Click "New Blog Post"** or use `Cmd/Ctrl + N`
3. **Choose a writing approach**:
   - Start with a title and let AI generate content
   - Use a template (How-to, Listicle, Review, etc.)
   - Write manually with AI assistance

### AI-Powered Features

#### Content Generation
- **Full Blog Posts**: Provide a topic and get a complete structured blog post
- **Custom Content**: Generate specific sections or improvements
- **Templates**: Use pre-built templates for common blog formats

#### Writing Enhancement
- **SEO Optimization**: Automatic keyword extraction and meta descriptions
- **Style Variations**: Generate content in different styles (informative, persuasive, technical)
- **Length Control**: Generate short, medium, or long-form content

### File Operations

- **Save**: `Cmd/Ctrl + S` - Save your work
- **Export**: Export as Markdown or HTML
- **Auto-save**: Your work is automatically saved as you type

## ⚙️ Configuration

### AI Provider Settings

Access AI settings through the sidebar or menu:

- **Provider Selection**: Choose between Ollama and OpenAI
- **Model Selection**: Pick specific models for different tasks
- **Generation Parameters**: Adjust style, length, and other options

### Customization

- **Templates**: Modify existing templates or create new ones in `src/services/aiService.js`
- **Styles**: Customize the UI by editing Tailwind classes
- **Shortcuts**: Modify keyboard shortcuts in `public/electron.js`

## 🔧 Development

### Project Structure

- **Frontend**: React with Tailwind CSS for the user interface
- **Backend**: Python FastAPI with streaming support for AI integration
- **Desktop**: Electron for native desktop functionality

### Adding New Features

1. **AI Features**: Extend `src/services/aiService.js`
2. **UI Components**: Add React components in `src/components/`
3. **Backend APIs**: Add endpoints in `src/python/app.py`

### Building for Distribution

```bash
# Build the application for distribution
npm run build:electron
```

## 📝 API Reference

### AI Service Endpoints

- `GET /api/health` - Check service status and AI availability
- `GET /api/models` - Get available AI models (OpenAI + Ollama)
- `POST /api/generate-blog` - Generate a complete blog post
- `POST /api/generate-content` - Generate custom content
- `POST /api/generate-blog-stream` - Stream blog generation in real-time
- `POST /api/generate-content-stream` - Stream content generation in real-time
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

### Frontend Services

- `aiService.generateBlogPost()` - Generate structured blog content
- `aiService.generateContent()` - Generate custom text
- `aiService.getBlogTemplates()` - Get available templates

## 🆘 Troubleshooting

### For Writers

**"AI services not available"**
- Make sure Ollama is running: open Terminal and type `ollama serve`
- Or add your OpenAI API key in Settings

**"QuillPilot won't start"**
- Make sure Node.js and Python are installed
- Try double-clicking the `QuillPilot.command` file
- Check that all prerequisites are installed

**"Can't find my blog posts"**
- Your posts are saved locally in the app
- Use File > Export to save them as files

### For Developers

**AI Service Not Available**
- Ensure Ollama is running: `ollama serve`
- Check your OpenAI API key is valid
- Verify FastAPI backend is running on port 5001 (not 5000 due to macOS AirPlay)

**Electron App Won't Start**
- Run `npm install` to ensure all dependencies are installed
- Check that React build exists: `npm run build`
- Try `./start.sh` instead of `npm run dev`

**Python Backend Issues**
- Install Python dependencies: `pip install -r src/python/requirements.txt`
- Check Python version is 3.8 or higher
- Port 5000 conflict: We use port 5001 to avoid macOS AirPlay
- Test backend directly: Visit http://localhost:5001/docs for API documentation

**Port Conflicts**
- Stop existing processes: `pkill -f "react-scripts|python3.*app.py"`
- The startup script handles this automatically

### Performance Tips

- **Local AI**: Use smaller models like `mistral` for faster responses
- **Cloud AI**: Use `gpt-3.5-turbo` for cost-effective generation
- **Memory**: Close unused posts in the editor to save memory
- **Best Models**: `llama3` for quality, `mistral` for speed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) for local AI capabilities
- [OpenAI](https://openai.com) for cloud AI services
- [Electron](https://electronjs.org) for desktop framework
- [React](https://reactjs.org) for the user interface
- [Tailwind CSS](https://tailwindcss.com) for styling

---

**Happy Writing with QuillPilot! 🚀**