import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from './auth.service';
import { ImagesFromServerService } from './images-from-server.service';
import { AnalyticsService } from './services/analytics.service';
import { ROUTES } from '../shared/constants';

describe('AuthService (Zoneless Signals & Auth State)', () => {
  let service: AuthService;
  let mockRouter: any;
  let mockImagesService: any;
  let mockAuth: any;
  let mockAnalyticsService: any;

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn()
    };

    mockImagesService = {
      resetGalleryState: vi.fn(),
      resetPlayground: vi.fn()
    };

    mockAnalyticsService = {
      logAuthSuccess: vi.fn(),
      logLogout: vi.fn()
    };

    mockAuth = null; // Test fallback without real Firebase connection

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: ImagesFromServerService, useValue: mockImagesService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: Auth, useValue: mockAuth }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('should initialize with null user by default', () => {
    expect(service.currentUserSignal()).toBeNull();
    expect(service.isAuthResolvedSignal()).toBe(true);
    expect(service.unauthorizedSignal()).toBe(false);
  });

  it('should sign in as guest user and navigate to gallery', () => {
    service.loginAsGuest();

    const user = service.currentUserSignal();
    expect(user).not.toBeNull();
    expect(user?.displayName).toBe('Fan Club Member');
    expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.GALLERY]);
  });

  it('should clear user state upon logout and navigate to root', async () => {
    service.loginAsGuest();
    expect(service.currentUserSignal()).not.toBeNull();

    await service.logout(false);

    expect(service.currentUserSignal()).toBeNull();
    expect(mockImagesService.resetGalleryState).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should set unauthorized state upon forced logout', async () => {
    await service.logout(true);

    expect(service.unauthorizedSignal()).toBe(true);
    expect(mockRouter.navigate).toHaveBeenCalledWith([ROUTES.FALLBACK]);
  });
});
