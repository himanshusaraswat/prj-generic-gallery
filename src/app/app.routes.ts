import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './core/auth.service';
import { map } from 'rxjs/operators';
import { FallbackComponent } from './fallback/fallback.component';
import { GalleryComponent } from './gallery/gallery.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { ROUTES } from './shared/constants';

export const galleryAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If already resolved and authenticated, allow immediately
  if (auth.isAuthResolvedSignal()) {
    if (auth.currentUserSignal()) return true;
    return router.createUrlTree([ROUTES.LOGIN]);
  }

  // Otherwise, wait for Firebase to restore session on cold boot/refresh
  return auth.waitForInitialAuthState().pipe(
    map((user) => {
      if (user) return true;
      return router.createUrlTree([ROUTES.LOGIN]);
    })
  );
};

export const loginAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthResolvedSignal()) {
    if (!auth.currentUserSignal()) return true;
    return router.createUrlTree([ROUTES.GALLERY]);
  }

  return auth.waitForInitialAuthState().pipe(
    map((user) => {
      if (!user) return true;
      return router.createUrlTree([ROUTES.GALLERY]);
    })
  );
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: ROUTES.LOGIN,
    pathMatch: 'full'
  },
  {
    path: ROUTES.LOGIN,
    component: SignInComponent,
    canActivate: [loginAuthGuard]
  },
  {
    path: ROUTES.GALLERY,
    component: GalleryComponent,
    canActivate: [galleryAuthGuard]
  },
  {
    path: ROUTES.FALLBACK,
    component: FallbackComponent
  },
  {
    path: '**',
    redirectTo: ROUTES.FALLBACK,
    pathMatch: 'full'
  }
];
