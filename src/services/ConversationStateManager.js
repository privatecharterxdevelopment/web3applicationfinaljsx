// Minimal conversation state manager used by AIChat.jsx
export default class ConversationStateManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      currentService: null,
      awaitingInfo: null,
      collectedInfo: {},
      questionIndex: 0
    };
  }

  setService(service) {
    this.state.currentService = service;
    this.state.collectedInfo = {};
    this.state.questionIndex = 0;
  }

  addInfo(key, value) {
    this.state.collectedInfo[key] = value;
  }

  // Define required fields per service type
  getRequiredFields() {
    if (this.state.currentService === 'yacht_inquiry') {
      return [
        { key: 'destination', question: 'Where would you like to cruise? (e.g., Mediterranean, Caribbean, Greek Islands, French Riviera)' },
        { key: 'dates', question: 'When are you planning your charter? Please share your preferred dates and duration (e.g., "July 15-22" or "1 week in August").' },
        { key: 'guests', question: 'How many guests will be joining? (Yacht capacity typically ranges from 6-12 guests for private charters)' },
        { key: 'budget', question: 'What\'s your approximate daily budget? (Yacht charters range from €5,000/day for sailing yachts to €100,000+/day for superyachts)' },
        { key: 'yacht_type', question: 'Do you have a preference for yacht type?\n• **Motor Yacht** - Speed & luxury amenities\n• **Sailing Yacht** - Classic experience\n• **Catamaran** - Stability & space\n• **Superyacht** (40m+) - Ultimate luxury\n\nOr just tell me "no preference" and I\'ll find the best options.' },
        { key: 'crew_preferences', question: 'Any specific crew requirements?\n• **Captain only** (you handle sailing)\n• **Captain + Chef** (most popular)\n• **Full crew** (captain, chef, steward/ess, deckhands)\n\nAlso, any dietary requirements or cuisine preferences for the chef?' },
        { key: 'activities', question: 'What activities interest you?\n• Water toys (jet skis, paddleboards, snorkeling gear)\n• Scuba diving equipment\n• Fishing gear\n• Tender for shore excursions\n\nAny specific amenities you\'d like on board?' },
        { key: 'special_requests', question: 'Any special occasions or additional requests? (Birthday celebration, anniversary, specific ports to visit, helicopter landing capability, etc.)\n\nIf nothing specific, just say "none" and I\'ll prepare your quote.' }
      ];
    }
    // Default flow for flights/helicopters
    return [
      { key: 'from', question: 'From which city?' },
      { key: 'to', question: 'To which city?' },
      { key: 'passengers', question: 'How many passengers?' }
    ];
  }

  getNextQuestion() {
    const fields = this.getRequiredFields();
    const info = this.state.collectedInfo;

    for (const field of fields) {
      if (!info[field.key]) {
        return field;
      }
    }
    return { key: null, question: null };
  }

  isComplete() {
    const fields = this.getRequiredFields();
    const info = this.state.collectedInfo;

    // For yacht inquiry, we need all fields
    if (this.state.currentService === 'yacht_inquiry') {
      return fields.every(field => !!info[field.key]);
    }

    // Default: from, to, passengers
    return !!(info.from && info.to && info.passengers);
  }

  // Get yacht inquiry summary for display
  getYachtInquirySummary() {
    const info = this.state.collectedInfo;
    return {
      destination: info.destination || 'Not specified',
      dates: info.dates || 'Not specified',
      guests: info.guests || 'Not specified',
      budget: info.budget || 'Not specified',
      yachtType: info.yacht_type || 'No preference',
      crewPreferences: info.crew_preferences || 'Standard crew',
      activities: info.activities || 'Standard amenities',
      specialRequests: info.special_requests || 'None'
    };
  }
}