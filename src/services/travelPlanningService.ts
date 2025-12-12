/**
 * Luxury Travel Planning Service
 *
 * Comprehensive service for creating ultra-luxury travel itineraries
 * - Minimum budget: $20,000 USD
 * - Premium pricing only (no budget options)
 * - Real venue verification via Google Places
 * - Map generation via Mapbox
 * - Database storage for travel requests
 */

import { supabase } from '../lib/supabase';
import googlePlaces, { PlaceDetails } from './googlePlaces';
import mapboxService, { Coordinates, MapData } from './mapboxService';

// Luxury pricing standards
export const LUXURY_PRICING = {
  transportation: {
    privateChauffeured: { min: 500, max: 3000, unit: 'day' },
    privateJet: { min: 5000, max: 25000, unit: 'hour' },
    helicopter: { min: 3000, max: 15000, unit: 'charter' },
    luxuryYacht: { min: 5000, max: 150000, unit: 'day' },
    supercar: { min: 1500, max: 5000, unit: 'day' },
  },
  accommodation: {
    fiveStarSuite: { min: 1500, max: 25000, unit: 'night' },
    presidentialSuite: { min: 5000, max: 45000, unit: 'night' },
    privateVilla: { min: 3000, max: 80000, unit: 'night' },
    overwater: { min: 2000, max: 15000, unit: 'night' },
  },
  dining: {
    michelinOneStar: { min: 300, max: 500, unit: 'person' },
    michelinTwoStar: { min: 500, max: 800, unit: 'person' },
    michelinThreeStar: { min: 800, max: 1500, unit: 'person' },
    privateChef: { min: 1000, max: 3000, unit: 'meal' },
    fineDining: { min: 200, max: 600, unit: 'person' },
  },
  activities: {
    privateTour: { min: 1500, max: 3000, unit: 'day' },
    yachtCharter: { min: 5000, max: 700000, unit: 'day' },
    helicopterTour: { min: 3000, max: 8000, unit: 'tour' },
    spaWellness: { min: 500, max: 3000, unit: 'session' },
    uniqueExperience: { min: 2000, max: 50000, unit: 'experience' },
    privateMuseum: { min: 1000, max: 10000, unit: 'visit' },
    golfPremium: { min: 500, max: 2000, unit: 'round' },
    skiPrivate: { min: 1500, max: 5000, unit: 'day' },
  },
};

export const MINIMUM_BUDGET = 20000;

export interface TravelRequestInput {
  userId?: string;
  destination: string;
  departureLocation?: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children?: number;
  totalBudget: number;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  specialRequests?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: ItineraryActivity[];
}

export interface ItineraryActivity {
  time: string;
  type: 'accommodation' | 'dining' | 'activity' | 'transport' | 'experience' | 'spa';
  title: string;
  venue: string;
  address: string;
  coordinates: Coordinates;
  cost: number;
  duration_hours?: number;
  verified: boolean;
  google_place_id?: string;
  notes?: string;
}

export interface BudgetBreakdown {
  accommodation: number;
  transportation: number;
  dining: number;
  activities: number;
  miscellaneous: number;
  total: number;
  remaining: number;
}

export interface TravelRequest {
  id: string;
  request_id: string;
  user_id: string | null;
  destination: string;
  departure_location: string | null;
  departure_date: string;
  return_date: string;
  adults: number;
  children: number;
  total_budget: number;
  estimated_cost: number | null;
  currency: string;
  budget_breakdown: BudgetBreakdown | null;
  itinerary_data: { days: ItineraryDay[] } | null;
  maps_data: MapData | null;
  verified_venues: PlaceDetails[];
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Validate budget meets minimum requirement
 */
export function validateBudget(budget: number): { valid: boolean; message: string } {
  if (budget < MINIMUM_BUDGET) {
    return {
      valid: false,
      message: `Our luxury travel planning service requires a minimum budget of $${MINIMUM_BUDGET.toLocaleString()} USD. Your budget of $${budget.toLocaleString()} doesn't meet this threshold. Our service focuses exclusively on ultra-luxury experiences with 5-star accommodations, Michelin-starred dining, and premium private transportation.`
    };
  }
  return { valid: true, message: 'Budget approved for luxury planning.' };
}

/**
 * Calculate number of nights from dates
 */
export function calculateNights(departureDate: string, returnDate: string): number {
  const start = new Date(departureDate);
  const end = new Date(returnDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRAVEL-${date}-${random}`;
}

/**
 * Calculate suggested budget allocation based on trip length
 */
export function calculateBudgetAllocation(
  totalBudget: number,
  nights: number,
  travelers: number
): BudgetBreakdown {
  // Luxury allocation percentages
  const allocations = {
    accommodation: 0.35,    // 35% for 5-star hotels
    transportation: 0.25,   // 25% for private transfers, jets, etc.
    dining: 0.20,           // 20% for Michelin dining
    activities: 0.15,       // 15% for experiences
    miscellaneous: 0.05,    // 5% buffer for tips, incidentals
  };

  const accommodation = Math.round(totalBudget * allocations.accommodation);
  const transportation = Math.round(totalBudget * allocations.transportation);
  const dining = Math.round(totalBudget * allocations.dining);
  const activities = Math.round(totalBudget * allocations.activities);
  const miscellaneous = Math.round(totalBudget * allocations.miscellaneous);
  const total = accommodation + transportation + dining + activities + miscellaneous;

  return {
    accommodation,
    transportation,
    dining,
    activities,
    miscellaneous,
    total,
    remaining: totalBudget - total,
  };
}

/**
 * Create a new travel request in the database
 */
export async function createTravelRequest(
  input: TravelRequestInput
): Promise<{ success: boolean; request?: TravelRequest; error?: string }> {
  // Validate budget
  const budgetValidation = validateBudget(input.totalBudget);
  if (!budgetValidation.valid) {
    return { success: false, error: budgetValidation.message };
  }

  const nights = calculateNights(input.departureDate, input.returnDate);
  const travelers = input.adults + (input.children || 0);
  const budgetBreakdown = calculateBudgetAllocation(input.totalBudget, nights, travelers);

  try {
    const { data, error } = await supabase
      .from('travel_requests')
      .insert({
        user_id: input.userId || null,
        destination: input.destination,
        departure_location: input.departureLocation || null,
        departure_date: input.departureDate,
        return_date: input.returnDate,
        adults: input.adults,
        children: input.children || 0,
        total_budget: input.totalBudget,
        currency: 'USD',
        budget_breakdown: budgetBreakdown,
        contact_name: input.contactName || null,
        contact_email: input.contactEmail || null,
        contact_phone: input.contactPhone || null,
        special_requests: input.specialRequests || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating travel request:', error);
      return { success: false, error: error.message };
    }

    return { success: true, request: data as TravelRequest };
  } catch (error: any) {
    console.error('Exception creating travel request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update travel request with itinerary and maps
 */
export async function updateTravelRequestItinerary(
  requestId: string,
  itinerary: { days: ItineraryDay[] },
  mapsData: MapData,
  verifiedVenues: PlaceDetails[],
  estimatedCost: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('travel_requests')
      .update({
        itinerary_data: itinerary,
        maps_data: mapsData,
        verified_venues: verifiedVenues,
        estimated_cost: estimatedCost,
        status: 'pending_review',
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating travel request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Exception updating travel request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get travel request by ID
 */
export async function getTravelRequest(
  requestId: string
): Promise<{ success: boolean; request?: TravelRequest; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('travel_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, request: data as TravelRequest };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get user's travel requests
 */
export async function getUserTravelRequests(
  userId: string
): Promise<{ success: boolean; requests?: TravelRequest[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('travel_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, requests: data as TravelRequest[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Submit travel request for review (final submission)
 */
export async function submitTravelRequest(
  requestId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status: 'pending_review',
    };

    let query = supabase
      .from('travel_requests')
      .update(updateData)
      .eq('id', requestId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    // Also create a user_request entry for admin notifications
    const { data: travelRequest } = await supabase
      .from('travel_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (travelRequest) {
      await supabase
        .from('user_requests')
        .insert({
          user_id: travelRequest.user_id,
          type: 'travel_request',
          status: 'pending',
          data: {
            travel_request_id: requestId,
            request_id: travelRequest.request_id,
            destination: travelRequest.destination,
            dates: `${travelRequest.departure_date} to ${travelRequest.return_date}`,
            travelers: travelRequest.adults + travelRequest.children,
            budget: travelRequest.total_budget,
            estimated_cost: travelRequest.estimated_cost,
          },
        });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Verify and enrich venue with Google Places data
 */
export async function verifyVenue(
  venueName: string,
  destination: string
): Promise<PlaceDetails | null> {
  return googlePlaces.verifyVenue(venueName, destination);
}

/**
 * Search for luxury hotels in destination
 */
export async function searchLuxuryHotels(
  destination: string,
  coordinates?: Coordinates
): Promise<PlaceDetails[]> {
  const results = await googlePlaces.searchLuxuryHotels(destination, coordinates);
  const detailed: PlaceDetails[] = [];

  // Get details for top 5 results
  for (const place of results.slice(0, 5)) {
    const details = await googlePlaces.getPlaceDetails(place.place_id);
    if (details) {
      detailed.push(details);
    }
  }

  return detailed;
}

/**
 * Search for fine dining restaurants
 */
export async function searchFineDining(
  destination: string,
  coordinates?: Coordinates
): Promise<PlaceDetails[]> {
  const results = await googlePlaces.searchFineDining(destination, coordinates);
  const detailed: PlaceDetails[] = [];

  for (const place of results.slice(0, 8)) {
    const details = await googlePlaces.getPlaceDetails(place.place_id);
    if (details) {
      detailed.push(details);
    }
  }

  return detailed;
}

/**
 * Generate maps for itinerary
 */
export async function generateMaps(
  days: ItineraryDay[]
): Promise<MapData> {
  const mapDays = days.map(day => ({
    day: day.day,
    date: day.date,
    venues: day.activities.map(activity => ({
      name: activity.venue,
      coordinates: activity.coordinates,
      type: activity.type,
    })),
  }));

  return mapboxService.generateItineraryMaps(mapDays);
}

/**
 * Get destination coordinates
 */
export async function getDestinationCoordinates(
  destination: string
): Promise<Coordinates | null> {
  return mapboxService.getDestinationCoordinates(destination);
}

/**
 * Calculate total itinerary cost
 */
export function calculateItineraryCost(days: ItineraryDay[]): number {
  let total = 0;
  for (const day of days) {
    for (const activity of day.activities) {
      total += activity.cost || 0;
    }
  }
  return total;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get pricing estimate for a service type
 */
export function getPricingEstimate(
  category: keyof typeof LUXURY_PRICING,
  type: string,
  quantity: number = 1
): { min: number; max: number; average: number } {
  const categoryPricing = LUXURY_PRICING[category];
  const pricing = (categoryPricing as any)[type];

  if (!pricing) {
    return { min: 0, max: 0, average: 0 };
  }

  return {
    min: pricing.min * quantity,
    max: pricing.max * quantity,
    average: Math.round((pricing.min + pricing.max) / 2) * quantity,
  };
}

export default {
  LUXURY_PRICING,
  MINIMUM_BUDGET,
  validateBudget,
  calculateNights,
  generateRequestId,
  calculateBudgetAllocation,
  createTravelRequest,
  updateTravelRequestItinerary,
  getTravelRequest,
  getUserTravelRequests,
  submitTravelRequest,
  verifyVenue,
  searchLuxuryHotels,
  searchFineDining,
  generateMaps,
  getDestinationCoordinates,
  calculateItineraryCost,
  formatCurrency,
  getPricingEstimate,
};
