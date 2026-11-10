export const environment = {
  production: true,
  allowGuestLogin: false,
  API_URL: '/api/gallery/',
  CATEGORIES: {
    MARVEL: 'marvel',
    NFL: 'nfl'
  },
  firebaseConfig: {
    apiKey: '__FIREBASE_API_KEY__',
    authDomain: '__FIREBASE_AUTH_DOMAIN__',
    projectId: '__FIREBASE_PROJECT_ID__',
    appId: '__FIREBASE_APP_ID__',
    measurementId: '__FIREBASE_MEASUREMENT_ID__'
  },
  analytics: {
    enabled: true
  },
  appCheck: {
    enabled: true,
    recaptchaSiteKey: '__RECAPTCHA_SITE_KEY__',
    isTokenAutoRefreshEnabled: true
  }
};
