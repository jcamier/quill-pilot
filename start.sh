#!/bin/bash

# QuillPilot Startup Script
# Works for both developers and end users
# Usage: ./start.sh [web|desktop]

# Parse command line arguments
MODE=${1:-"menu"}

clear
echo "┌─────────────────────────────────┐"
echo "│        🖋️  QuillPilot           │"
echo "│   AI Writing Assistant         │"
echo "└─────────────────────────────────┘"
echo ""

# Function to show usage menu
show_menu() {
    echo "🚀 Choose how to run QuillPilot:"
    echo ""
    echo "1. 🌐 Web App (for developers - opens in browser)"
    echo "2. 🖥️  Desktop App (for regular use - native app)"
    echo "3. ❌ Cancel"
    echo ""
    read -p "Enter your choice (1-3): " choice
    case $choice in
        1) MODE="web" ;;
        2) MODE="desktop" ;;
        3) echo "Cancelled."; exit 0 ;;
        *) echo "Invalid choice. Please run again."; exit 1 ;;
    esac
}

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
if ! python3 -c "import fastapi, uvicorn, ollama, requests, pydantic" >/dev/null 2>&1; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
fi
cd ../..

echo ""
echo "🚀 Starting QuillPilot..."
echo ""
echo "This will start:"
echo "  • React development server (http://localhost:3000)"
echo "  • Python FastAPI backend (http://localhost:5001)"
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

# Show menu if no mode specified
if [ "$MODE" = "menu" ]; then
    show_menu
fi

# Validate mode
case $MODE in
    web|desktop) ;;
    *) echo "❌ Invalid mode: $MODE. Use: web or desktop"; exit 1 ;;
esac

echo "🎉 Ready to launch in $MODE mode! Press Ctrl+C to stop all services"
echo ""

# Start based on selected mode
case $MODE in
    "web")
        echo "🌐 Starting Web App..."
        echo "  • React development server (http://localhost:3000)"
        echo "  • Python FastAPI backend (http://localhost:5001)"
        echo "  • Opens in your default browser"
        echo ""
        npm run dev:web
        ;;
    "desktop")
        echo "🖥️  Starting Desktop App..."
        echo "  • React development server (background)"
        echo "  • Python FastAPI backend (http://localhost:5001)"
        echo "  • Electron desktop app"
        echo ""
        npm run dev:desktop
        ;;
esac
