#!/bin/bash

# QuillPilot Startup Script
echo "🖋️  Starting QuillPilot..."

# Check if Python dependencies are installed
echo "📦 Checking Python dependencies..."
if [ ! -d "src/python/venv" ]; then
    echo "Creating Python virtual environment..."
    cd src/python
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../..
else
    echo "Activating Python virtual environment..."
    source src/python/venv/bin/activate
fi

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "🚀 Starting QuillPilot in development mode..."
echo ""
echo "This will start:"
echo "  • React development server (http://localhost:3000)"
echo "  • Python Flask backend (http://localhost:5000)"
echo "  • Electron desktop app"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start in development mode
npm run dev
