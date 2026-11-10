import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  authState,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import { traceUntilFirst } from '@angular/fire/performance';
import { Router } from '@angular/router';
import { ACTION, APP_MODES, ROUTES } from '../shared/constants';
import { ImagesFromServerService } from './images-from-server.service';
import { AnalyticsService } from './services/analytics.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private imagesFromServerService = inject(ImagesFromServerService);
  private analytics = inject(AnalyticsService);

  // Modern Signal State (Single source of truth)
  private currentUser = signal<User | null>(null);
  readonly currentUserSignal = this.currentUser.asReadonly();

  // Observable bridge for Angular Functional Route Guards
  public loggedIn$ = toObservable(this.currentUser);

  // Tracks whether Firebase has completed its initial local IndexedDB check
  private isAuthResolved = signal<boolean>(false);
  readonly isAuthResolvedSignal = this.isAuthResolved.asReadonly();
  public isAuthResolved$ = toObservable(this.isAuthResolved);

  private unauthorized = signal<boolean>(false);
  readonly unauthorizedSignal = this.unauthorized.asReadonly();

  constructor() {
    if (this.auth) {
      authState(this.auth)
        .pipe(traceUntilFirst('auth'))
        .subscribe((user) => {
          this.currentUser.set(user);
          this.isAuthResolved.set(true);
        });
    } else {
      this.isAuthResolved.set(true);
    }
  }

  /**
   * Helper for route guards to wait for Firebase to restore session on page reload
   */
  public waitForInitialAuthState(): Observable<User | null> {
    if (this.isAuthResolved()) {
      return of(this.currentUser());
    }
    return this.isAuthResolved$.pipe(
      filter((resolved): resolved is boolean => Boolean(resolved)),
      map((): User | null => this.currentUser()),
      first()
    );
  }

  /**
   * Official Firebase Google Sign-In with Popup
   */
  public async login() {
    try {
      const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
      if (result.user) {
        this.currentUser.set(result.user);
        this.isAuthResolved.set(true);
        this.analytics.logAuthSuccess('google');
        this.router.navigate([ROUTES.GALLERY]);
      }
    } catch (error) {
      this.handleAuthErrors(error);
    }
  }

  /**
   * Guest / Demo Mode Authentication
   */
  public loginAsGuest() {
    const guestUser = {
      uid: 'guest-fan-1',
      displayName: 'Fan Club Member',
      email: 'guest@generic-gallery.local',
      photoURL: ''
    } as unknown as User;
    this.currentUser.set(guestUser);
    this.isAuthResolved.set(true);
    this.analytics.logAuthSuccess('guest');
    this.router.navigate([ROUTES.GALLERY]);
  }

  public async logout(storageUnauthorized: boolean = false) {
    if (this.auth) {
      try {
        await signOut(this.auth);
      } catch (e) {
        console.warn('SignOut warning:', e);
      }
    }
    this.currentUser.set(null);
    this.analytics.logLogout();
    this.imagesFromServerService.resetGalleryState();
    this.imagesFromServerService.resetPlayground(ACTION.init, APP_MODES.gallery);

    if (storageUnauthorized) {
      this.setUnauthorizedState(true);
      this.router.navigate([ROUTES.FALLBACK]);
    } else {
      this.setUnauthorizedState(false);
      this.router.navigate(['/']);
    }
  }

  public setUnauthorizedState(isUnauthorized: boolean) {
    this.unauthorized.set(isUnauthorized);
  }

  handleAuthErrors(error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      console.warn('Firebase Auth error:', (error as { code: string }).code);
    } else {
      console.warn('Firebase Auth error:', error);
    }
  }
}
