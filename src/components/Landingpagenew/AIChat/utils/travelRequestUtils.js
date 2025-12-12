/**
 * Travel Request Utilities for AI Chat
 *
 * Handles creating travel request cart items and formatting itineraries
 */

import { supabase } from '../../../../lib/supabase';

/**
 * Generate a unique travel request ID
 */
export function generateTravelRequestId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRAVEL-${date}-${random}`;
}

/**
 * Create a travel request cart item
 * @param {Object} params - Travel request parameters
 * @returns {Object} Cart item for travel request
 */
export function createTravelRequestCartItem({
  requestId,
  destination,
  departureDate,
  returnDate,
  adults,
  children = 0,
  totalBudget,
  estimatedCost,
  budgetBreakdown,
  itineraryData,
  mapsData,
  verifiedVenues = [],
  contactEmail,
  contactPhone,
  contactName,
  specialRequests
}) {
  const nights = calculateNights(departureDate, returnDate);

  return {
    id: requestId || generateTravelRequestId(),
    type: 'travel_request',
    name: `Luxury Trip to ${destination}`,
    title: `${nights}-Night Luxury Experience in ${destination}`,
    destination,
    departureDate,
    returnDate,
    nights,
    adults,
    children,
    travelers: adults + children,
    totalBudget,
    estimatedCost: estimatedCost || totalBudget,
    price: estimatedCost || totalBudget,
    currency: 'USD',
    budgetBreakdown,
    itineraryData,
    mapsData,
    verifiedVenues,
    contactEmail,
    contactPhone,
    contactName,
    specialRequests,
    // Cart display fields
    image: getDestinationImage(destination),
    subtitle: `${formatDate(departureDate)} - ${formatDate(returnDate)} | ${adults + children} ${adults + children > 1 ? 'Travelers' : 'Traveler'}`,
    description: `Complete luxury itinerary with 5-star accommodations, fine dining, and exclusive experiences`,
    isRequestOnly: true, // This item requires manual review
    requiresVerification: true,
    createdAt: new Date().toISOString()
  };
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(departureDate, returnDate) {
  const start = new Date(departureDate);
  const end = new Date(returnDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Get a placeholder image URL for destination
 */
export function getDestinationImage(destination) {
  const destinationImages = {
    'santorini': 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
    'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    'monaco': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    'amalfi': 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=800',
    'swiss': 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800',
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'
  };

  const lowerDest = destination.toLowerCase();
  for (const [key, url] of Object.entries(destinationImages)) {
    if (lowerDest.includes(key)) {
      return url;
    }
  }
  return destinationImages.default;
}

/**
 * Save travel request to database
 */
export async function saveTravelRequestToDatabase(cartItem, userId) {
  try {
    const { data, error } = await supabase
      .from('travel_requests')
      .insert({
        user_id: userId || null,
        request_id: cartItem.id,
        destination: cartItem.destination,
        departure_date: cartItem.departureDate,
        return_date: cartItem.returnDate,
        adults: cartItem.adults,
        children: cartItem.children || 0,
        total_budget: cartItem.totalBudget,
        estimated_cost: cartItem.estimatedCost,
        currency: 'USD',
        budget_breakdown: cartItem.budgetBreakdown || {},
        itinerary_data: cartItem.itineraryData || {},
        maps_data: cartItem.mapsData || {},
        verified_venues: cartItem.verifiedVenues || [],
        contact_name: cartItem.contactName,
        contact_email: cartItem.contactEmail,
        contact_phone: cartItem.contactPhone,
        special_requests: cartItem.specialRequests,
        status: 'pending_review'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving travel request:', error);
      return { success: false, error: error.message };
    }

    // Also create a user_request entry for admin notifications
    await supabase.from('user_requests').insert({
      user_id: userId,
      type: 'travel_request',
      status: 'pending',
      data: {
        travel_request_id: data.id,
        request_id: cartItem.id,
        destination: cartItem.destination,
        dates: `${cartItem.departureDate} to ${cartItem.returnDate}`,
        nights: cartItem.nights,
        travelers: cartItem.travelers,
        budget: cartItem.totalBudget,
        estimated_cost: cartItem.estimatedCost,
        itinerary_summary: summarizeItinerary(cartItem.itineraryData)
      }
    });

    return { success: true, data };
  } catch (error) {
    console.error('Exception saving travel request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a brief summary of the itinerary
 */
function summarizeItinerary(itineraryData) {
  if (!itineraryData || !itineraryData.days) {
    return 'Custom luxury itinerary';
  }

  const days = itineraryData.days;
  const activities = days.reduce((acc, day) => acc + (day.activities?.length || 0), 0);
  const hotels = new Set(
    days.flatMap(d => d.activities?.filter(a => a.type === 'accommodation').map(a => a.venue) || [])
  );
  const restaurants = days.flatMap(d => d.activities?.filter(a => a.type === 'dining') || []).length;

  return `${days.length} days, ${hotels.size} hotel(s), ${restaurants} dining reservations, ${activities} total activities`;
}

/**
 * Format itinerary for display in cart
 */
export function formatItineraryForCart(itineraryData) {
  if (!itineraryData || !itineraryData.days) {
    return [];
  }

  return itineraryData.days.map(day => ({
    day: day.day,
    date: day.date,
    highlights: day.activities?.map(a => ({
      time: a.time,
      title: a.title || a.venue,
      type: a.type,
      cost: a.cost
    })) || []
  }));
}

/**
 * Validate travel request budget
 */
export function validateTravelBudget(budget) {
  const MINIMUM_BUDGET = 20000;

  if (typeof budget !== 'number' || isNaN(budget)) {
    return {
      valid: false,
      message: 'Please provide a valid budget amount.'
    };
  }

  if (budget < MINIMUM_BUDGET) {
    return {
      valid: false,
      message: `Our luxury travel planning service requires a minimum budget of $${MINIMUM_BUDGET.toLocaleString()} USD. This ensures 5-star accommodations, Michelin-starred dining, and premium private transportation throughout your journey.`
    };
  }

  return {
    valid: true,
    message: 'Budget approved for luxury travel planning.'
  };
}

/**
 * Get travel request from cart items
 */
export function getTravelRequestsFromCart(cartItems) {
  return cartItems.filter(item => item.type === 'travel_request');
}

/**
 * Check if cart has travel requests
 */
export function hasActiveTravelRequests(cartItems) {
  return cartItems.some(item => item.type === 'travel_request');
}

export default {
  generateTravelRequestId,
  createTravelRequestCartItem,
  calculateNights,
  formatDate,
  formatCurrency,
  getDestinationImage,
  saveTravelRequestToDatabase,
  formatItineraryForCart,
  validateTravelBudget,
  getTravelRequestsFromCart,
  hasActiveTravelRequests
};
