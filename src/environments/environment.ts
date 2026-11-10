export const environment = {
  production: false,
  allowGuestLogin: true,
  useEmulators: true,
  API_URL: 'http://localhost:3000/gallery/',
  CATEGORIES: {
    MARVEL: 'marvel',
    NFL: 'nfl'
  },
  firebaseConfig: {
    apiKey: 'AIzaSyDUqQUZ6YjJWVtverwrbDamkjivXv_XDaQ',
    authDomain: 'meraki-public.firebaseapp.com',
    projectId: 'meraki-public',
    appId: '1:961243721322:web:4faf3668705a732f746413',
    measurementId: 'G-4DD1K1PELT'
  },
  analytics: {
    enabled: false
  },
  appCheck: {
    enabled: false,
    recaptchaSiteKey: 'debug',
    isTokenAutoRefreshEnabled: false
  }
};
