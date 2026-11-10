import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppCheck, getToken } from '@angular/fire/app-check';
import { from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const appCheckInterceptor: HttpInterceptorFn = (req, next) => {
  const appCheck = inject(AppCheck, { optional: true });

  // Only attach to backend API requests; never leak tokens to external CDNs
  const isBackendApi =
    req.url.startsWith('/api/') ||
    req.url.startsWith(environment.API_URL) ||
    req.url.includes('/gallery/');

  const isExternalCdn =
    req.url.includes('espncdn.com') ||
    req.url.includes('jsdelivr.net') ||
    req.url.includes('googleapis.com');

  if (!appCheck || !isBackendApi || isExternalCdn) {
    return next(req);
  }

  return from(getToken(appCheck, /* forceRefresh */ false).catch(() => null)).pipe(
    switchMap((tokenResult) => {
      if (tokenResult?.token) {
        const cloned = req.clone({
          setHeaders: {
            'X-Firebase-AppCheck': tokenResult.token
          }
        });
        return next(cloned);
      }
      return next(req);
    }),
    catchError(() => next(req))
  );
};
