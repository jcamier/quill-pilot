#!/bin/bash

# QuillPilot Desktop Launcher
# This file can be double-clicked to start QuillPilot

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Change to the project directory
cd "$DIR"

# Start QuillPilot in desktop mode (since this is likely what users want when double-clicking)
./start.sh desktop

# Keep terminal open if there's an error
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ QuillPilot failed to start. Please check the error messages above."
    read -p "Press any key to exit..."
fi
