// src/lib/humeClient.js
// Hume.ai EVI Client - Complete Implementation

export class HumeEVIClient {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.ws = null;
    this.isConnected = false;
    this.emotionCallbacks = [];
    this.messageCallbacks = [];
    this.audioCallbacks = [];
    this.currentAudio = null; // Track current playing audio
    this.conversationContext = {
      userMood: 'neutral',
      urgencyLevel: 0,
      engagementLevel: 0,
      frustrationLevel: 0
    };
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // Check if API keys are valid
        if (!this.apiKey || !this.secretKey) {
          console.warn('🎭 Hume API keys not configured, skipping connection');
          resolve(); // Resolve without connecting
          return;
        }

        console.log('🎭 Connecting to Hume EVI WebSocket...');

        // Hume EVI WebSocket URL with authentication
        // Format: wss://api.hume.ai/v0/assistant/chat?apiKey=YOUR_KEY
        const wsUrl = `wss://api.hume.ai/v0/evi/chat?apiKey=${this.apiKey}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Hume EVI Connected - Voice AI Ready!');
          this.isConnected = true;

          // Send initial configuration
          this.ws.send(JSON.stringify({
            type: 'session_settings',
            voice: {
              provider: 'HUME_AI',
              voice_id: 'ITO', // High-quality, natural voice
              speed: 1.0,
              emotion_detection: true
            },
            language: {
              model: 'LanguageModelConfigPresetName.GPT_4O',
              enable_emotion: true
            }
          }));

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('🎭 Hume message:', data.type);

            // Handle different message types
            if (data.type === 'user_message' || data.type === 'assistant_message') {
              // Text transcript
              this.messageCallbacks.forEach(cb => cb(data));
            }

            if (data.type === 'audio_output') {
              // AI voice response (base64 audio)
              this.audioCallbacks.forEach(cb => cb(data.data));
            }

            if (data.type === 'user_interruption') {
              console.log('🎭 User interrupted AI');
            }

            if (data.type === 'emotion_features') {
              // Emotion detection from user's voice
              this.updateContext(data.emotions);
              this.emotionCallbacks.forEach(cb => cb(data.emotions));
            }
          } catch (err) {
            console.error('Error parsing Hume message:', err);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Hume.ai WebSocket error:', error);
          this.isConnected = false;
          // Don't reject - allow app to continue without Hume
          resolve();
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          console.log('🎭 Hume.ai disconnected');
        };

      } catch (error) {
        console.error('❌ Failed to initialize Hume.ai:', error);
        // Resolve instead of reject to allow app to continue
        resolve();
      }
    });
  }

  updateContext(emotions) {
    if (!emotions || emotions.length === 0) return;
    
    if (emotions.some(e => ['stress', 'anxiety', 'impatience'].includes(e.name) && e.score > 0.6)) {
      this.conversationContext.urgencyLevel = Math.min(this.conversationContext.urgencyLevel + 0.2, 1);
    } else {
      this.conversationContext.urgencyLevel = Math.max(this.conversationContext.urgencyLevel - 0.1, 0);
    }
    
    if (emotions.some(e => ['anger', 'frustration'].includes(e.name) && e.score > 0.5)) {
      this.conversationContext.frustrationLevel = Math.min(this.conversationContext.frustrationLevel + 0.3, 1);
    } else {
      this.conversationContext.frustrationLevel = Math.max(this.conversationContext.frustrationLevel - 0.1, 0);
    }
    
    if (emotions.some(e => ['excitement', 'joy'].includes(e.name) && e.score > 0.5)) {
      this.conversationContext.engagementLevel = Math.min(this.conversationContext.engagementLevel + 0.2, 1);
    } else {
      this.conversationContext.engagementLevel = Math.max(this.conversationContext.engagementLevel - 0.1, 0);
    }
  }

  getEmpatheticPrefix() {
    const { urgencyLevel, frustrationLevel, engagementLevel } = this.conversationContext;
    
    if (frustrationLevel > 0.6) {
      return ["I hear you – let me help you quickly.", "Got it, I'm on it right away."][Math.floor(Math.random() * 2)];
    }
    if (urgencyLevel > 0.7) {
      return ["I sense the urgency – working on it now!", "On it! Moving fast for you."][Math.floor(Math.random() * 2)];
    }
    if (engagementLevel > 0.7) {
      return ["Love the enthusiasm! Let's make it happen!", "Yes! Let's do this!"][Math.floor(Math.random() * 2)];
    }
    return null;
  }

  onEmotion(callback) { 
    this.emotionCallbacks.push(callback); 
  }
  
  onMessage(callback) { 
    this.messageCallbacks.push(callback); 
  }
  
  onAudio(callback) { 
    this.audioCallbacks.push(callback); 
  }

  async sendAudio(audioBlob) {
    if (!this.isConnected) {
      console.warn('🎭 Hume.ai not connected - cannot send audio');
      return;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64Audio = reader.result.split(',')[1];

          // Send audio input to Hume EVI
          this.ws.send(JSON.stringify({
            type: 'audio_input',
            data: base64Audio
          }));

          console.log('🎤 Audio sent to Hume AI');
          resolve();
        } catch (err) {
          console.error('Error sending audio:', err);
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  async sendText(text) {
    if (!this.isConnected) {
      console.warn('🎭 Hume.ai not connected - cannot send text');
      return;
    }

    try {
      // Send text message and request voice response
      this.ws.send(JSON.stringify({
        type: 'user_message',
        message: {
          role: 'user',
          content: text
        }
      }));

      console.log('💬 Text sent to Hume AI:', text);
    } catch (err) {
      console.error('Error sending text:', err);
    }
  }

  // Play audio response from Hume AI
  async playAudioResponse(base64Audio) {
    try {
      // STOP ANY PREVIOUS AUDIO BEFORE PLAYING NEW ONE
      if (this.currentAudio) {
        console.log('🔇 Stopping previous Hume audio');
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      }

      // Convert base64 to audio blob
      const audioData = atob(base64Audio);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      const audioBlob = new Blob([audioArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      // Clean up when audio ends
      audio.onended = () => {
        console.log('🔇 Hume audio finished');
        URL.revokeObjectURL(audioUrl);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      };

      // Clean up on error
      audio.onerror = () => {
        console.error('🔇 Hume audio error');
        URL.revokeObjectURL(audioUrl);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      };

      // Store reference and play
      this.currentAudio = audio;
      await audio.play();

      console.log('🔊 Playing Hume AI voice response');

      return audio;
    } catch (err) {
      console.error('Error playing audio:', err);
      this.currentAudio = null;
    }
  }

  // Stop current audio playback
  stopAudio() {
    if (this.currentAudio) {
      console.log('🔇 Stopping Hume audio playback');
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }
}

export default HumeEVIClient;