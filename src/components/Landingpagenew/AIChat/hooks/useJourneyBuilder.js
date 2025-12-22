/**
 * useJourneyBuilder Hook
 * Manages multi-leg journey building for jets and yachts
 */

import { useState, useCallback } from 'react';

// Default multi-leg chat data structure
const DEFAULT_MULTI_LEG_DATA = {
  legs: [],
  currentLegIndex: 0,
  passengers: null,
  pets: false,
  luggage: null,
  specialRequests: ''
};

export const useJourneyBuilder = () => {
  // Jet Journey Builder
  const [showJourneyBuilder, setShowJourneyBuilder] = useState(false);
  const [journeyBuilderJet, setJourneyBuilderJet] = useState(null);
  const [showTransferOffer, setShowTransferOffer] = useState(false);
  const [lastAddedJourney, setLastAddedJourney] = useState(null);

  // Yacht Journey Builder
  const [showYachtJourneyBuilder, setShowYachtJourneyBuilder] = useState(false);
  const [journeyBuilderYacht, setJourneyBuilderYacht] = useState(null);

  // Multi-leg route info
  const [multiLegRouteInfo, setMultiLegRouteInfo] = useState(null);
  const [multiLegChatMode, setMultiLegChatMode] = useState(false);
  const [multiLegChatData, setMultiLegChatData] = useState(DEFAULT_MULTI_LEG_DATA);

  // Multi-leg route stops array
  const [multiLegRoute, setMultiLegRoute] = useState([]);
  // Array of stops: [{city, code, date, time, stopDuration}]

  // Pending leg awaiting confirmation
  const [pendingLegData, setPendingLegData] = useState(null);

  // Open jet journey builder
  const openJetJourneyBuilder = useCallback((jet) => {
    setJourneyBuilderJet(jet);
    setShowJourneyBuilder(true);
  }, []);

  // Close jet journey builder
  const closeJetJourneyBuilder = useCallback(() => {
    setShowJourneyBuilder(false);
    setJourneyBuilderJet(null);
  }, []);

  // Open yacht journey builder
  const openYachtJourneyBuilder = useCallback((yacht) => {
    setJourneyBuilderYacht(yacht);
    setShowYachtJourneyBuilder(true);
  }, []);

  // Close yacht journey builder
  const closeYachtJourneyBuilder = useCallback(() => {
    setShowYachtJourneyBuilder(false);
    setJourneyBuilderYacht(null);
  }, []);

  // Add leg to multi-leg route
  const addLegToRoute = useCallback((leg) => {
    setMultiLegRoute(prev => [...prev, leg]);
  }, []);

  // Remove leg from multi-leg route
  const removeLegFromRoute = useCallback((index) => {
    setMultiLegRoute(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Update leg in multi-leg route
  const updateLegInRoute = useCallback((index, updates) => {
    setMultiLegRoute(prev => prev.map((leg, i) =>
      i === index ? { ...leg, ...updates } : leg
    ));
  }, []);

  // Clear multi-leg route
  const clearMultiLegRoute = useCallback(() => {
    setMultiLegRoute([]);
    setMultiLegChatData(DEFAULT_MULTI_LEG_DATA);
    setMultiLegChatMode(false);
    setPendingLegData(null);
  }, []);

  // Start multi-leg chat mode
  const startMultiLegChatMode = useCallback(() => {
    setMultiLegChatMode(true);
    setMultiLegChatData({
      ...DEFAULT_MULTI_LEG_DATA,
      currentLegIndex: 0
    });
  }, []);

  // End multi-leg chat mode
  const endMultiLegChatMode = useCallback(() => {
    setMultiLegChatMode(false);
  }, []);

  // Update multi-leg chat data
  const updateMultiLegChatData = useCallback((updates) => {
    setMultiLegChatData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Add leg to multi-leg chat data
  const addLegToMultiLegChat = useCallback((leg) => {
    setMultiLegChatData(prev => ({
      ...prev,
      legs: [...prev.legs, leg],
      currentLegIndex: prev.legs.length
    }));
  }, []);

  // Set pending leg data (awaiting confirmation)
  const setPendingLeg = useCallback((legData) => {
    setPendingLegData(legData);
  }, []);

  // Confirm pending leg
  const confirmPendingLeg = useCallback(() => {
    if (pendingLegData) {
      addLegToRoute(pendingLegData);
      setPendingLegData(null);
    }
  }, [pendingLegData, addLegToRoute]);

  // Cancel pending leg
  const cancelPendingLeg = useCallback(() => {
    setPendingLegData(null);
  }, []);

  // Show transfer offer after journey added
  const showTransferOfferForJourney = useCallback((journey) => {
    setLastAddedJourney(journey);
    setShowTransferOffer(true);
  }, []);

  // Dismiss transfer offer
  const dismissTransferOffer = useCallback(() => {
    setShowTransferOffer(false);
    setLastAddedJourney(null);
  }, []);

  // Calculate total legs
  const totalLegs = multiLegRoute.length;

  // Check if route is valid (at least 2 stops)
  const isRouteValid = multiLegRoute.length >= 2;

  // Get route summary
  const getRouteSummary = useCallback(() => {
    if (multiLegRoute.length === 0) return null;

    const origin = multiLegRoute[0];
    const destination = multiLegRoute[multiLegRoute.length - 1];
    const stops = multiLegRoute.slice(1, -1);

    return {
      origin: origin.city || origin.code,
      destination: destination.city || destination.code,
      stops: stops.map(s => s.city || s.code),
      totalLegs: multiLegRoute.length - 1
    };
  }, [multiLegRoute]);

  return {
    // Jet Journey Builder
    showJourneyBuilder,
    setShowJourneyBuilder,
    journeyBuilderJet,
    setJourneyBuilderJet,
    openJetJourneyBuilder,
    closeJetJourneyBuilder,

    // Yacht Journey Builder
    showYachtJourneyBuilder,
    setShowYachtJourneyBuilder,
    journeyBuilderYacht,
    setJourneyBuilderYacht,
    openYachtJourneyBuilder,
    closeYachtJourneyBuilder,

    // Transfer Offer
    showTransferOffer,
    setShowTransferOffer,
    lastAddedJourney,
    setLastAddedJourney,
    showTransferOfferForJourney,
    dismissTransferOffer,

    // Multi-leg Route Info
    multiLegRouteInfo,
    setMultiLegRouteInfo,

    // Multi-leg Chat Mode
    multiLegChatMode,
    setMultiLegChatMode,
    multiLegChatData,
    setMultiLegChatData,
    startMultiLegChatMode,
    endMultiLegChatMode,
    updateMultiLegChatData,
    addLegToMultiLegChat,

    // Multi-leg Route Stops
    multiLegRoute,
    setMultiLegRoute,
    addLegToRoute,
    removeLegFromRoute,
    updateLegInRoute,
    clearMultiLegRoute,

    // Pending Leg
    pendingLegData,
    setPendingLegData,
    setPendingLeg,
    confirmPendingLeg,
    cancelPendingLeg,

    // Computed
    totalLegs,
    isRouteValid,
    getRouteSummary
  };
};

export default useJourneyBuilder;
