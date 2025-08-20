# QuillPilot Quick Start Guide 🚀

Get up and running with QuillPilot in minutes!

## 🎯 Quick Setup (3 steps)

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd src/python
pip install -r requirements.txt
cd ../..
```

### 2. Set Up AI (Choose One)

#### Option A: Ollama (Local, Free) 🏠
```bash
# Install Ollama from https://ollama.ai
# Then pull a model:
ollama pull llama2

# Start the service:
ollama serve
```

#### Option B: OpenAI (Cloud, Requires API Key) ☁️
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it in the app's AI Settings panel

### 3. Launch QuillPilot

```bash
# Easy way (using startup script):
./start.sh

# Or manually:
npm run dev
```

## 🎉 You're Ready!

QuillPilot will open automatically. You can now:

1. **Create a new blog post** using the "New Blog Post" button
2. **Configure AI settings** in the sidebar if needed
3. **Start writing** with AI assistance!

## 💡 First Steps

### Create Your First AI-Generated Blog Post

1. Click **"New Blog Post"**
2. Click the **AI Assistant** button (🪄) in the editor
3. Type a topic like: `"How to start a blog in 2024"`
4. Select **"Blog Post"** template
5. Click **"Generate"**
6. Watch as AI creates a complete blog post!

### Manual Writing with AI Help

1. Start typing your blog post title and content
2. Select text you want to improve
3. Use AI to enhance, expand, or rewrite sections
4. Save your work with `Cmd/Ctrl + S`

## 🔧 Troubleshooting

**"No AI services available"**
- Make sure Ollama is running: `ollama serve`
- OR configure your OpenAI API key in Settings

**"Python backend not running"**
- Check that Python dependencies are installed
- Restart with: `npm run dev`

**Need help?**
- Check the full [README.md](README.md) for detailed documentation
- Look at the AI Settings panel for service status

---

**Happy writing! 🖋️✨**
