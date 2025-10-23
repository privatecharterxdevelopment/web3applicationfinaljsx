#!/bin/bash

# Script to update all page titles to use PageHeader component
# Run this to standardize all titles across the app

echo "🔍 Finding all pages with titles that need updating..."
echo ""

# Files to update with their titles
declare -A FILES_TO_UPDATE=(
  # Web3 Pages
  ["src/components/Landingpagenew/TokenSwap.jsx"]="Token Swap"
  ["src/components/Landingpagenew/STOUTLDashboard.jsx"]="My Tokenized Assets"

  # RWS Pages
  ["src/components/Landingpagenew/CharterAJet.jsx"]="Charter a Private Jet"
  ["src/components/Landingpagenew/ReferralPage.jsx"]="Bring a Jet-Setter"

  # Dashboard Pages
  ["src/components/Landingpagenew/ProfileOverview.jsx"]="Profile Overview"

  # Other
  ["src/components/Landingpagenew/AIChat.jsx"]="Travel Concierge"
  ["src/components/Landingpagenew/Subscriptionplans.jsx"]="Subscription Plans"
)

echo "📋 Files to update:"
for file in "${!FILES_TO_UPDATE[@]}"; do
  echo "  - $file: ${FILES_TO_UPDATE[$file]}"
done

echo ""
echo "✅ Manual update required for each file"
echo "📝 Import: import PageHeader from './PageHeader';"
echo "📝 Replace title HTML with: <PageHeader title=\"...\" subtitle=\"...\" />"
