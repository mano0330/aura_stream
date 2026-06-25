import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurastream.app',
  appName: 'Aura Stream',
  webDir: 'out',
  server: {
    // Production: load from the live Vercel frontend
    url: 'https://aura-stream-mano0330s-projects.vercel.app',
    cleartext: false,
    allowNavigation: [
      'aura-stream-mano0330s-projects.vercel.app',
      'aurastream-mano0330s-projects.vercel.app',
      '*.youtube.com',
      '*.googleapis.com',
      '*.unsplash.com',
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#07070a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
