# QuillPilot 🖋️

> AI-powered writing assistant for content creators

QuillPilot is a desktop application built with Electron, React, and Python that helps writers and content creators produce high-quality blog content using AI assistance. It supports both local AI models (via Ollama) and cloud-based AI services (OpenAI).

## ✨ Features

- **AI-Powered Content Generation**: Generate blog posts, improve writing, and get content ideas
- **Multiple AI Providers**: Support for both Ollama (local) and OpenAI (cloud)
- **Rich Text Editor**: Markdown-based editor with live preview
- **Blog Templates**: Pre-built templates for different content types
- **SEO Optimization**: Automatic keyword extraction and meta description generation
- **File Management**: Save, load, and export content in multiple formats
- **Desktop Integration**: Native desktop app with menu integration

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Ollama** (optional, for local AI) - [Download here](https://ollama.ai)
- **OpenAI API Key** (optional, for cloud AI)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd QuillPilot
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Set up Python backend**:
   ```bash
   cd src/python
   pip install -r requirements.txt
   ```

4. **Configure environment** (optional):
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

### Running the Application

#### Development Mode

```bash
# Start all services in development mode
npm run dev
```

This will:
- Start the React development server (port 3000)
- Start the Python backend (port 5000)
- Launch the Electron app

#### Production Mode

```bash
# Build the React app
npm run build

# Start the Electron app
npm start
```

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
│       ├── app.py          # Flask API server
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
- **Backend**: Python Flask API for AI integration
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

- `GET /api/health` - Check service status
- `GET /api/models` - Get available AI models
- `POST /api/generate-blog` - Generate a complete blog post
- `POST /api/generate-content` - Generate custom content

### Frontend Services

- `aiService.generateBlogPost()` - Generate structured blog content
- `aiService.generateContent()` - Generate custom text
- `aiService.getBlogTemplates()` - Get available templates

## 🐛 Troubleshooting

### Common Issues

**AI Service Not Available**
- Ensure Ollama is running: `ollama serve`
- Check your OpenAI API key is valid
- Verify Python backend is running on port 5000

**Electron App Won't Start**
- Run `npm install` to ensure all dependencies are installed
- Check that React build exists: `npm run build`

**Python Backend Issues**
- Install Python dependencies: `pip install -r src/python/requirements.txt`
- Check Python version is 3.8 or higher

### Performance Tips

- **Local AI**: Use smaller models like `mistral` for faster responses
- **Cloud AI**: Use `gpt-3.5-turbo` for cost-effective generation
- **Memory**: Close unused posts in the editor to save memory

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