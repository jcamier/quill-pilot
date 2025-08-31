#!/bin/bash

# QuillPilot Startup Script
# Works for both developers and end users

clear
echo "┌─────────────────────────────────┐"
echo "│        🖋️  QuillPilot           │"
echo "│   AI Writing Assistant         │"
echo "└─────────────────────────────────┘"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install from https://nodejs.org/"
    exit 1
fi

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install from https://python.org/"
    exit 1
fi

echo "✅ Prerequisites met!"
echo ""

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Check if Python dependencies are installed
echo "📦 Checking Python dependencies..."
cd src/python
if ! python3 -c "import flask, ollama, requests" >/dev/null 2>&1; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
fi
cd ../..

echo ""
echo "🚀 Starting QuillPilot..."
echo ""
echo "This will start:"
echo "  • React development server (http://localhost:3000)"
echo "  • Python Flask backend (http://localhost:5001)"
echo "  • Electron desktop app"
echo ""

# Check for conflicting processes
if port_in_use 3000; then
    echo "⚠️  Port 3000 is already in use. Stopping existing React server..."
    pkill -f "react-scripts" 2>/dev/null || true
    sleep 2
fi

if port_in_use 5001; then
    echo "⚠️  Port 5001 is already in use. Stopping existing Python server..."
    pkill -f "python3.*app.py" 2>/dev/null || true
    sleep 2
fi

echo "💡 Your AI models available:"
if command_exists ollama; then
    echo "  • Ollama (Local): $(ollama list 2>/dev/null | grep -c "latest" || echo "0") models"
else
    echo "  • Ollama: Not installed (install from https://ollama.ai for local AI)"
fi
echo "  • OpenAI: Add API key in settings for cloud AI"
echo ""

echo "🎉 Ready to launch! Press Ctrl+C to stop all services"
echo ""

# Start in development mode
npm run dev
