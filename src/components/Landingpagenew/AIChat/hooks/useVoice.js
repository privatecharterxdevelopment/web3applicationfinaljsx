/**
 * useVoice Hook
 * Manages voice input/output, speech recognition, and text-to-speech
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export const useVoice = (onVoiceInput, setToast) => {
  // Voice mode state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastInputMethod, setLastInputMethod] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (event.results[event.results.length - 1].isFinal) {
          console.log('🎤 Voice input:', transcript);
          setLastInputMethod('voice');
          if (onVoiceInput) {
            onVoiceInput(transcript);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Auto-restart if no speech detected
          setTimeout(() => {
            if (recognitionRef.current && isVoiceMode) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Ignore if already started
              }
            }
          }, 1000);
        }
      };

      recognitionRef.current.onend = () => {
        // Auto-restart if voice mode is still active
        if (isVoiceMode) {
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Ignore if already started
              }
            }
          }, 500);
        }
      };
    }

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      window.speechSynthesis?.cancel();
    };
  }, [isVoiceMode, onVoiceInput]);

  // Toggle Voice Mode
  const toggleVoiceMode = useCallback(() => {
    if (!recognitionRef.current) {
      setToast?.({ message: 'Voice recognition not supported in this browser', type: 'error' });
      return;
    }

    setIsVoiceMode(prev => {
      const newMode = !prev;

      if (newMode) {
        // Start voice mode
        try {
          recognitionRef.current.start();
          setIsListening(true);
          setToast?.({ message: 'Voice mode activated - speak naturally', type: 'info' });
        } catch (err) {
          console.error('Failed to start speech recognition:', err);
        }
      } else {
        // Stop voice mode
        try {
          recognitionRef.current.stop();
          setIsListening(false);
          setToast?.({ message: 'Voice mode deactivated', type: 'info' });
        } catch (err) {
          console.error('Failed to stop speech recognition:', err);
        }
      }

      return newMode;
    });
  }, [setToast]);

  // Text-to-Speech for AI responses
  const speakResponse = useCallback((text) => {
    if (isVoiceMuted || !isVoiceMode) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isVoiceMuted, isVoiceMode]);

  // Toggle Voice Mute
  const toggleVoiceMute = useCallback(() => {
    setIsVoiceMuted(prev => {
      const newMuted = !prev;
      if (newMuted) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return newMuted;
    });
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  }, []);

  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Process audio blob if needed
        console.log('Recording stopped, blob size:', audioBlob.size);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setToast?.({ message: 'Failed to access microphone', type: 'error' });
    }
  }, [setToast]);

  // Stop recording audio
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [isRecording]);

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Check if voice is supported
  const isVoiceSupported = Boolean(
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
    'speechSynthesis' in window
  );

  return {
    // State
    isVoiceMode,
    isVoiceMuted,
    isListening,
    isSpeaking,
    isRecording,
    voiceEnabled,
    lastInputMethod,
    isVoiceSupported,

    // Setters
    setVoiceEnabled,
    setLastInputMethod,

    // Actions
    toggleVoiceMode,
    toggleVoiceMute,
    speakResponse,
    stopSpeaking,
    startRecording,
    stopRecording,
    initAudioContext,

    // Refs (for external access if needed)
    recognitionRef,
    audioContextRef
  };
};

export default useVoice;
