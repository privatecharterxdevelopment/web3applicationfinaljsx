import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.privatecharterx.app',
  appName: 'PrivateCharterX',
  webDir: 'dist',

  // Server configuration for development
  server: {
    // For live reload during development (uncomment when testing)
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,

    // Allow navigation to external URLs (for OAuth, payment gateways, etc.)
    allowNavigation: [
      'https://*.supabase.co',
      'https://*.stripe.com',
      'https://*.mapbox.com',
      'https://opensea.io',
      'https://*.walletconnect.com',
      'https://*.reown.com'
    ]
  },

  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    preferredContentMode: 'mobile',
    // Handle status bar
    scrollEnabled: true
  },

  // Android specific configuration
  android: {
    backgroundColor: '#ffffff',
    // Allow mixed content for WebView
    allowMixedContent: true,
    // Capture input in WebView
    captureInput: true
  },

  // Plugins configuration
  plugins: {
    // Splash screen settings
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },

    // Status bar settings
    StatusBar: {
      style: 'light',
      backgroundColor: '#000000'
    },

    // Keyboard settings
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
