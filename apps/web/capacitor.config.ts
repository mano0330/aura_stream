import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurastream.app',
  appName: 'Aura Stream',
  // For dev: point at your local Next.js server
  // For production: set webDir to 'out' after running 'next build'
  webDir: 'out',
  server: {
    // During development, load from the live Next.js dev server
    // Comment this out for production APK builds
    url: 'https://web-delta-jade-88.vercel.app',
    cleartext: true, // Allow HTTP on Android
    allowNavigation: ['web-delta-jade-88.vercel.app', '*.youtube.com', '*.googleapis.com'],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
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
