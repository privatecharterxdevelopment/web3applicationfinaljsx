interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

declare module '@humeai/voice-react' {
  export interface VoiceStatus {
    value: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
    error?: Error;
  }

  export interface VoiceMessage {
    type: 'user_message' | 'assistant_message' | 'system_message';
    message: {
      role: 'user' | 'assistant' | 'system';
      content: string;
    };
    models: {
      prosody?: {
        scores: Record<string, number>;
      };
    };
  }

  export interface VoiceHook {
    status: VoiceStatus;
    connect: () => Promise<void>;
    disconnect: () => void;
    isMuted: boolean;
    mute: () => void;
    unmute: () => void;
    micFft: number[];
    messages: VoiceMessage[];
  }

  export interface VoiceProviderProps {
    apiKey: string;
    apiSecret: string;
    children: React.ReactNode;
  }

  export function useVoice(options?: {
    apiKey?: string;
    apiSecret?: string;
    onError?: (error: Error) => void;
  }): VoiceHook;

  export function VoiceProvider(props: VoiceProviderProps): JSX.Element;
}