#!/bin/bash
# Script to fix the broken EventsSportsView component

echo "Backing up broken file..."
mv "/Users/x/Downloads/Tokenization-main 2/src/components/EventsSports/EventsSportsView.jsx" "/Users/x/Downloads/Tokenization-main 2/src/components/EventsSports/EventsSportsView_BROKEN.jsx.backup"

echo "Installing clean working version..."
mv "/Users/x/Downloads/Tokenization-main 2/src/components/EventsSports/EventsSportsView_NEW.jsx" "/Users/x/Downloads/Tokenization-main 2/src/components/EventsSports/EventsSportsView.jsx"

echo "✅ DONE! The Events page is now fixed."
echo "Restart your dev server: npm run dev"
