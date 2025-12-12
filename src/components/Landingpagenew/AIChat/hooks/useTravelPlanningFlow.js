/**
 * Travel Planning Flow Hook
 *
 * Manages sequential question flow for luxury travel planning.
 * Asks one question at a time and stores answers in memory
 * to create personalized travel itineraries.
 */

import { useState, useCallback, useRef } from 'react';
import { MINIMUM_BUDGET } from '../../../../services/travelPlanningService';

// Travel planning question steps
export const TRAVEL_PLANNING_STEPS = {
  IDLE: 'idle',
  DESTINATION: 'destination',
  DATES: 'dates',
  TRAVELERS: 'travelers',
  BUDGET: 'budget',
  PREFERENCES: 'preferences',
  GENERATING: 'generating',
  COMPLETE: 'complete'
};

// Question templates for each step
const STEP_QUESTIONS = {
  [TRAVEL_PLANNING_STEPS.DESTINATION]: {
    question: "Let's plan your luxury getaway! Where would you like to travel to?",
    subtext: "Enter a city, country, or region (e.g., Santorini, Maldives, Swiss Alps)",
    validate: (value) => {
      if (!value || value.trim().length < 2) {
        return { valid: false, message: 'Please enter a valid destination.' };
      }
      return { valid: true };
    }
  },
  [TRAVEL_PLANNING_STEPS.DATES]: {
    question: "When would you like to travel?",
    subtext: "Enter your departure and return dates",
    validate: (value) => {
      // Basic validation - expects format with dates
      if (!value || value.trim().length < 5) {
        return { valid: false, message: 'Please provide your travel dates.' };
      }
      return { valid: true };
    }
  },
  [TRAVEL_PLANNING_STEPS.TRAVELERS]: {
    question: "How many travelers will be joining this trip?",
    subtext: "Include adults and children",
    validate: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 20) {
        return { valid: false, message: 'Please enter a valid number of travelers (1-20).' };
      }
      return { valid: true };
    }
  },
  [TRAVEL_PLANNING_STEPS.BUDGET]: {
    question: `What's your total budget for this luxury experience?`,
    subtext: `Our luxury travel planning requires a minimum budget of $${MINIMUM_BUDGET.toLocaleString()} USD for 5-star accommodations, Michelin dining, and premium experiences.`,
    validate: (value) => {
      // Extract number from string (handles "$50,000", "50000", "50k", etc.)
      const cleanValue = value.replace(/[$,\s]/g, '').toLowerCase();
      let budget = parseFloat(cleanValue);

      // Handle "k" suffix (e.g., "50k" = 50000)
      if (cleanValue.endsWith('k')) {
        budget = parseFloat(cleanValue.slice(0, -1)) * 1000;
      }

      if (isNaN(budget)) {
        return { valid: false, message: 'Please enter a valid budget amount.' };
      }

      if (budget < MINIMUM_BUDGET) {
        return {
          valid: false,
          message: `Our luxury service requires a minimum budget of $${MINIMUM_BUDGET.toLocaleString()} USD. Your budget of $${budget.toLocaleString()} doesn't meet this threshold.`
        };
      }

      return { valid: true, parsedValue: budget };
    }
  },
  [TRAVEL_PLANNING_STEPS.PREFERENCES]: {
    question: "Any special preferences or experiences you'd like to include?",
    subtext: "Examples: spa treatments, wine tasting, helicopter tours, yacht excursions, Michelin restaurants, adventure activities",
    validate: () => ({ valid: true }) // Optional field
  }
};

// Step order for sequential flow
const STEP_ORDER = [
  TRAVEL_PLANNING_STEPS.DESTINATION,
  TRAVEL_PLANNING_STEPS.DATES,
  TRAVEL_PLANNING_STEPS.TRAVELERS,
  TRAVEL_PLANNING_STEPS.BUDGET,
  TRAVEL_PLANNING_STEPS.PREFERENCES
];

export function useTravelPlanningFlow() {
  // Current step in the planning flow
  const [currentStep, setCurrentStep] = useState(TRAVEL_PLANNING_STEPS.IDLE);

  // Collected travel requirements
  const [travelRequirements, setTravelRequirements] = useState({
    destination: null,
    departureDate: null,
    returnDate: null,
    adults: 1,
    children: 0,
    totalBudget: null,
    preferences: null,
    specialRequests: null
  });

  // Validation errors
  const [validationError, setValidationError] = useState(null);

  // Flow active state
  const [isFlowActive, setIsFlowActive] = useState(false);

  // Ref for tracking if we're in flow mode
  const flowActiveRef = useRef(false);

  /**
   * Start the travel planning flow
   */
  const startTravelPlanning = useCallback(() => {
    setIsFlowActive(true);
    flowActiveRef.current = true;
    setCurrentStep(TRAVEL_PLANNING_STEPS.DESTINATION);
    setTravelRequirements({
      destination: null,
      departureDate: null,
      returnDate: null,
      adults: 1,
      children: 0,
      totalBudget: null,
      preferences: null,
      specialRequests: null
    });
    setValidationError(null);

    // Return the first question
    return STEP_QUESTIONS[TRAVEL_PLANNING_STEPS.DESTINATION];
  }, []);

  /**
   * Process user answer and move to next step
   */
  const processAnswer = useCallback((userInput) => {
    if (!flowActiveRef.current || currentStep === TRAVEL_PLANNING_STEPS.IDLE) {
      return { shouldContinueFlow: false };
    }

    const stepConfig = STEP_QUESTIONS[currentStep];
    if (!stepConfig) {
      return { shouldContinueFlow: false };
    }

    // Validate the answer
    const validation = stepConfig.validate(userInput);
    if (!validation.valid) {
      setValidationError(validation.message);
      return {
        shouldContinueFlow: true,
        error: validation.message,
        currentStep,
        question: stepConfig
      };
    }

    setValidationError(null);

    // Store the answer based on current step
    const updatedRequirements = { ...travelRequirements };

    switch (currentStep) {
      case TRAVEL_PLANNING_STEPS.DESTINATION:
        updatedRequirements.destination = userInput.trim();
        break;

      case TRAVEL_PLANNING_STEPS.DATES:
        // Parse dates from user input (AI will help with this)
        // For now, store raw input - AI will parse it
        updatedRequirements.rawDates = userInput.trim();
        // Try to extract dates
        const dateMatch = userInput.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g);
        if (dateMatch && dateMatch.length >= 2) {
          updatedRequirements.departureDate = dateMatch[0];
          updatedRequirements.returnDate = dateMatch[1];
        }
        break;

      case TRAVEL_PLANNING_STEPS.TRAVELERS:
        // Parse travelers
        const travelers = parseInt(userInput);
        updatedRequirements.adults = travelers;
        // Check for children mention
        const childMatch = userInput.toLowerCase().match(/(\d+)\s*child/);
        if (childMatch) {
          updatedRequirements.children = parseInt(childMatch[1]);
          updatedRequirements.adults = travelers - updatedRequirements.children;
        }
        break;

      case TRAVEL_PLANNING_STEPS.BUDGET:
        updatedRequirements.totalBudget = validation.parsedValue;
        break;

      case TRAVEL_PLANNING_STEPS.PREFERENCES:
        updatedRequirements.preferences = userInput.trim();
        updatedRequirements.specialRequests = userInput.trim();
        break;
    }

    setTravelRequirements(updatedRequirements);

    // Find next step
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < STEP_ORDER.length) {
      // Move to next step
      const nextStep = STEP_ORDER[nextIndex];
      setCurrentStep(nextStep);

      return {
        shouldContinueFlow: true,
        currentStep: nextStep,
        question: STEP_QUESTIONS[nextStep],
        collectedData: updatedRequirements
      };
    } else {
      // All questions answered - ready to generate
      setCurrentStep(TRAVEL_PLANNING_STEPS.GENERATING);
      setIsFlowActive(false);
      flowActiveRef.current = false;

      return {
        shouldContinueFlow: false,
        isComplete: true,
        currentStep: TRAVEL_PLANNING_STEPS.GENERATING,
        collectedData: updatedRequirements
      };
    }
  }, [currentStep, travelRequirements]);

  /**
   * Cancel the planning flow
   */
  const cancelFlow = useCallback(() => {
    setIsFlowActive(false);
    flowActiveRef.current = false;
    setCurrentStep(TRAVEL_PLANNING_STEPS.IDLE);
    setValidationError(null);
  }, []);

  /**
   * Reset the flow for a new planning session
   */
  const resetFlow = useCallback(() => {
    setIsFlowActive(false);
    flowActiveRef.current = false;
    setCurrentStep(TRAVEL_PLANNING_STEPS.IDLE);
    setTravelRequirements({
      destination: null,
      departureDate: null,
      returnDate: null,
      adults: 1,
      children: 0,
      totalBudget: null,
      preferences: null,
      specialRequests: null
    });
    setValidationError(null);
  }, []);

  /**
   * Mark generation as complete
   */
  const completeGeneration = useCallback(() => {
    setCurrentStep(TRAVEL_PLANNING_STEPS.COMPLETE);
  }, []);

  /**
   * Check if a message triggers travel planning
   */
  const detectsTravelPlanningIntent = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    const travelKeywords = [
      'plan a trip',
      'plan trip',
      'plan my trip',
      'travel to',
      'vacation to',
      'holiday to',
      'luxury trip',
      'plan a vacation',
      'plan a holiday',
      'help me plan',
      'itinerary for',
      'trip itinerary',
      'travel itinerary',
      'week in',
      'days in',
      'nights in',
      'getaway to'
    ];

    return travelKeywords.some(keyword => lowerMessage.includes(keyword));
  }, []);

  /**
   * Get current question to display
   */
  const getCurrentQuestion = useCallback(() => {
    if (!isFlowActive || currentStep === TRAVEL_PLANNING_STEPS.IDLE) {
      return null;
    }
    return STEP_QUESTIONS[currentStep];
  }, [isFlowActive, currentStep]);

  /**
   * Get progress percentage
   */
  const getProgress = useCallback(() => {
    if (currentStep === TRAVEL_PLANNING_STEPS.IDLE) return 0;
    if (currentStep === TRAVEL_PLANNING_STEPS.GENERATING || currentStep === TRAVEL_PLANNING_STEPS.COMPLETE) return 100;

    const currentIndex = STEP_ORDER.indexOf(currentStep);
    return Math.round(((currentIndex + 1) / STEP_ORDER.length) * 100);
  }, [currentStep]);

  return {
    // State
    currentStep,
    travelRequirements,
    isFlowActive,
    validationError,

    // Actions
    startTravelPlanning,
    processAnswer,
    cancelFlow,
    resetFlow,
    completeGeneration,

    // Helpers
    detectsTravelPlanningIntent,
    getCurrentQuestion,
    getProgress,

    // Constants
    STEPS: TRAVEL_PLANNING_STEPS,
    MINIMUM_BUDGET
  };
}

export default useTravelPlanningFlow;
