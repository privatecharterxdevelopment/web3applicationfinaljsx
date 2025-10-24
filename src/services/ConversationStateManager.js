// Minimal conversation state manager used by AIChat.jsx
export default class ConversationStateManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      currentService: null,
      awaitingInfo: null,
      collectedInfo: {}
    };
  }

  setService(service) {
    this.state.currentService = service;
    this.state.collectedInfo = {};
  }

  addInfo(key, value) {
    this.state.collectedInfo[key] = value;
  }

  getNextQuestion() {
    // Very basic flow: from -> to -> passengers
    if (!this.state.collectedInfo.from) return { key: 'from', question: 'From which city?' };
    if (!this.state.collectedInfo.to) return { key: 'to', question: 'To which city?' };
    if (!this.state.collectedInfo.passengers) return { key: 'passengers', question: 'How many passengers?' };
    return { key: null, question: null };
  }

  isComplete() {
    const i = this.state.collectedInfo;
    return !!(i.from && i.to && i.passengers);
  }
}