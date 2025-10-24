// Minimal Concierge used by AIChat.jsx
export default class SpheraWeb3Concierge {
  extractContext(conversationHistory = []) {
    // Look for hints in the last few messages
    const text = conversationHistory.map(m => m.content?.toLowerCase?.() || '').join(' ');
    const pax = parseInt(text.match(/(\d+)\s+(?:pax|passengers?|people|person)/)?.[1]) || null;
    
    // Look for "from X to Y" or just "to Y" patterns
    const fromMatch = text.match(/\bfrom\s+([a-z\s]+?)(?:\s+to|\s+for|,|$)/i);
    const toMatch = text.match(/\bto\s+([a-z\s]+?)(?:\s+for|,|$)/i);
    const routeMatch = text.match(/\b([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+for|,|$)/i);
    
    let from = null, to = null;
    
    if (fromMatch) from = fromMatch[1].trim();
    else if (routeMatch) from = routeMatch[1].trim();
    
    if (toMatch) to = toMatch[1].trim();
    else if (routeMatch) to = routeMatch[2].trim();
    
    return { passengers: pax, from, to };
  }

  isActualBookingRequest(message) {
    const m = (message || '').toLowerCase();
    
    // Check for booking patterns including routes and passenger numbers
    const hasRoute = /\b\w+\s+to\s+\w+/.test(m);
    const hasPassengers = /\b\d+\s*(?:passenger|person|people|pax)?\b/.test(m) || /\bfor\s+\d+/.test(m);
    
    // Service-specific detection with different criteria:
    
    // 1. Private Jets - needs route + passengers for direct search
    if (/(private\s*jet|\bjet\b)/.test(m) && !m.includes('empty')) {
      return hasRoute && hasPassengers;
    }
    
    // 2. Empty Legs - needs route OR direct intent (show, find, list)
    if (/empty\s*leg/.test(m)) {
      return hasRoute || /show|find|get|list|available|any/.test(m);
    }
    
    // 3. Helicopters - needs route + passengers (short distance focus)
    if (/\b(heli|helicopter)\b/.test(m)) {
      return hasRoute && hasPassengers;
    }
    
    // 4. Yachts - never direct search, always conversation
    if (/yacht|boat/.test(m)) {
      return false; // Always go through conversation for budget/requirements
    }
    
    // 5. Luxury Cars - simple service, can search directly with location
    if (/luxury\s*car|chauffeur|driver|\bcars?\b/.test(m)) {
      return /\bin\s+\w+/.test(m) || /airport|transfer|service/.test(m);
    }
    
    // Fallback for general booking terms
    return /(book|charter|flight)/.test(m) && (hasRoute || hasPassengers);
  }

  isEligibleForNFTBenefit(item, userHasNFT, usedNFTBenefitThisYear) {
    if (!userHasNFT || usedNFTBenefitThisYear) return false;
    const price = item?.price || 0;
    return price > 0 && price <= 1500; // simple rule
  }
}