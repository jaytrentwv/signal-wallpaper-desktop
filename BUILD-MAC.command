#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "Installing dependencies..."
npm install
echo "Building SIGNAL Wallpaper for macOS..."
npm run dist:mac
echo
echo "Build complete. Check the dist folder."
