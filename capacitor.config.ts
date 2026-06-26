import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ae.uaetrail.app',
  appName: 'UAE Trail',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#EEF6F3',
      showSpinner: false
    }
  }
};

export default config;
