// Price Calculator Utilities
// Centralized price calculation logic

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} from - { lat, lng }
 * @param {Object} to - { lat, lng }
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(from, to) {
  if (!from?.lat || !to?.lat) return 0;

  const R = 6371; // Earth's radius in km
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLon = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate item price with estimated flight time for jets/helicopters
 * @param {Object} item - Cart item
 * @returns {number} Calculated price
 */
export function calculateItemPrice(item) {
  if (!item) return 0;

  // If item has a fixed price (empty legs, adventures, cars), use it directly
  if (item.price && item.type !== 'jet' && item.type !== 'helicopter' && item.type !== 'aircraft') {
    return item.price;
  }

  // For jets/helicopters with hourly rate, calculate based on estimated flight time
  const hourlyRate = item.hourly_rate || item.price_per_hour || item.pricePerHour || item.rate || item.hourly_rate_eur;
  const speed = item.speed || item.speed_kmh || 800; // Default 800 km/h for jets

  if (hourlyRate && (item.origin || item.from_city || item.from) && (item.destination || item.to_city || item.to)) {
    // Try to get coordinates from item
    const origin = item.origin_coords || item.origin ||
      (item.from_lat && item.from_lng ? { lat: item.from_lat, lng: item.from_lng } : null) ||
      (item.originLat && item.originLng ? { lat: item.originLat, lng: item.originLng } : null);

    const destination = item.destination_coords || item.destination ||
      (item.to_lat && item.to_lng ? { lat: item.to_lat, lng: item.to_lng } : null) ||
      (item.destLat && item.destLng ? { lat: item.destLat, lng: item.destLng } : null);

    if (origin?.lat && destination?.lat) {
      const distance = calculateDistance(origin, destination);
      const flightHours = Math.max(1, distance / speed); // Minimum 1 hour
      return Math.round(flightHours * hourlyRate);
    }

    // Fallback: Use estimated hours if provided
    if (item.estimated_hours || item.flightHours) {
      const hours = item.estimated_hours || item.flightHours;
      return Math.round(hours * hourlyRate);
    }

    // Fallback: Show 1 hour price (minimum booking)
    return hourlyRate;
  }

  // Fallback to item price or 0
  return item.price || item.price_usd || item.basePrice || item.estimated_price || 0;
}

/**
 * Get normalized price from item with multiple price fields
 * @param {Object} item - Item with various price fields
 * @returns {number} Normalized price
 */
export function getNormalizedPrice(item) {
  if (!item) return 0;

  // Try calculated price first
  const calculatedPrice = calculateItemPrice(item);
  if (calculatedPrice > 0) return calculatedPrice;

  // Fallback chain
  return item.price_usd ||
         item.price ||
         item.basePrice ||
         item.discounted_price ||
         item.estimated_price ||
         item.totalWithFee ||
         0;
}

/**
 * Calculate cart total
 * @param {Array} cartItems - Array of cart items
 * @param {Object} options - { userHasNFT, usedNFTBenefitThisYear, nftBenefitChecker }
 * @returns {number} Total price
 */
export function calculateCartTotal(cartItems, options = {}) {
  const { userHasNFT, usedNFTBenefitThisYear, nftBenefitChecker } = options;

  return cartItems.reduce((sum, item) => {
    // Check for NFT benefit eligibility
    if (nftBenefitChecker && nftBenefitChecker(item, userHasNFT, usedNFTBenefitThisYear)) {
      return sum;
    }
    return sum + calculateItemPrice(item);
  }, 0);
}

/**
 * Format price for display
 * @param {number} price - Price value
 * @param {string} currency - Currency code (default 'USD')
 * @param {boolean} showEstimate - Whether to prefix with ~
 * @returns {string} Formatted price string
 */
export function formatPrice(price, currency = 'USD', showEstimate = false) {
  if (price === null || price === undefined) return 'Price on request';

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);

  return showEstimate ? `~${formatted}` : formatted;
}

/**
 * Calculate VAT amount
 * @param {number} baseAmount - Base amount
 * @param {number} vatRate - VAT rate (default 0.081 = 8.1%)
 * @returns {number} VAT amount
 */
export function calculateVAT(baseAmount, vatRate = 0.081) {
  return baseAmount * vatRate;
}

/**
 * Calculate total with VAT
 * @param {number} baseAmount - Base amount
 * @param {number} vatRate - VAT rate
 * @returns {Object} { baseAmount, vatAmount, totalAmount }
 */
export function calculateTotalWithVAT(baseAmount, vatRate = 0.081) {
  const vatAmount = calculateVAT(baseAmount, vatRate);
  return {
    baseAmount,
    vatAmount,
    totalAmount: baseAmount + vatAmount
  };
}

/**
 * Calculate crypto conversion
 * @param {number} usdAmount - Amount in USD
 * @returns {Object} Crypto equivalents
 */
export function calculateCryptoConversions(usdAmount) {
  // These are approximate rates - in production, use a price API
  const rates = {
    BTC: 43250,
    ETH: 2280,
    PVCX: 0.85
  };

  return {
    USDT: usdAmount,
    USDC: usdAmount,
    BTC: usdAmount / rates.BTC,
    ETH: usdAmount / rates.ETH,
    PVCX: usdAmount / rates.PVCX
  };
}

/**
 * Format crypto amount
 * @param {number} amount - Crypto amount
 * @param {string} currency - Crypto currency
 * @returns {string} Formatted amount
 */
export function formatCryptoAmount(amount, currency) {
  const decimals = {
    BTC: 6,
    ETH: 4,
    USDT: 2,
    USDC: 2,
    PVCX: 0
  };

  return amount.toFixed(decimals[currency] || 2);
}
