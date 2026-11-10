import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import {
  provideAnalytics,
  getAnalytics,
  ScreenTrackingService,
  UserTrackingService
} from '@angular/fire/analytics';
import {
  provideAppCheck,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  CustomProvider
} from '@angular/fire/app-check';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { environment } from '../environments/environment';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { appCheckInterceptor } from './core/interceptors/app-check.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptors([appCheckInterceptor])),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    ...(environment.production && environment.analytics?.enabled
      ? [provideAnalytics(() => getAnalytics()), ScreenTrackingService, UserTrackingService]
      : []),
    provideAppCheck(() => {
      if (environment.production && environment.appCheck?.enabled) {
        return initializeAppCheck(undefined, {
          provider: new ReCaptchaEnterpriseProvider(environment.appCheck.recaptchaSiteKey),
          isTokenAutoRefreshEnabled: environment.appCheck.isTokenAutoRefreshEnabled
        });
      } else {
        (
          self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }
        ).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        return initializeAppCheck(undefined, {
          provider: new CustomProvider({
            getToken: () =>
              Promise.resolve({
                token: 'dev-debug-token',
                expireTimeMillis: Date.now() + 3600000
              })
          }),
          isTokenAutoRefreshEnabled: false
        });
      }
    }),
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2500 } }
  ]
};
