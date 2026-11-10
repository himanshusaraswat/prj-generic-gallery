import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { appCheckInterceptor } from './app-check.interceptor';
import { AppCheck } from '@angular/fire/app-check';
import { of } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetToken = vi.fn();
vi.mock('@angular/fire/app-check', () => ({
  getToken: (...args: any[]) => mockGetToken(...args),
  AppCheck: class {}
}));

describe('appCheckInterceptor', () => {
  const mockAppCheck = {} as AppCheck;

  beforeEach(() => {
    mockGetToken.mockReset();
  });

  it('should attach X-Firebase-AppCheck header to /api/ requests when token is available', async () => {
    mockGetToken.mockResolvedValue({
      token: 'test-app-check-token',
      expireTimeMillis: Date.now() + 3600000
    });

    TestBed.configureTestingModule({
      providers: [{ provide: AppCheck, useValue: mockAppCheck }]
    });

    const req = new HttpRequest('GET', '/api/gallery/marvel');
    await new Promise<void>((resolve) => {
      TestBed.runInInjectionContext(() => {
        appCheckInterceptor(req, (reqTransformed) => {
          expect(reqTransformed.headers.get('X-Firebase-AppCheck')).toBe('test-app-check-token');
          resolve();
          return of(new HttpResponse({ status: 200 }));
        }).subscribe();
      });
    });
  });

  it('should NOT attach header to external CDN requests', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AppCheck, useValue: mockAppCheck }]
    });

    const req = new HttpRequest(
      'GET',
      'https://a.espncdn.com/i/headshots/nfl/players/full/1234.png'
    );
    await new Promise<void>((resolve) => {
      TestBed.runInInjectionContext(() => {
        appCheckInterceptor(req, (reqTransformed) => {
          expect(reqTransformed.headers.has('X-Firebase-AppCheck')).toBe(false);
          expect(mockGetToken).not.toHaveBeenCalled();
          resolve();
          return of(new HttpResponse({ status: 200 }));
        }).subscribe();
      });
    });
  });

  it('should pass request unmodified if AppCheck is not provided', async () => {
    TestBed.configureTestingModule({
      providers: []
    });

    const req = new HttpRequest('GET', '/api/gallery/marvel');
    await new Promise<void>((resolve) => {
      TestBed.runInInjectionContext(() => {
        appCheckInterceptor(req, (reqTransformed) => {
          expect(reqTransformed.headers.has('X-Firebase-AppCheck')).toBe(false);
          resolve();
          return of(new HttpResponse({ status: 200 }));
        }).subscribe();
      });
    });
  });

  it('should gracefully pass request if getToken fails', async () => {
    mockGetToken.mockRejectedValue(new Error('Network error'));

    TestBed.configureTestingModule({
      providers: [{ provide: AppCheck, useValue: mockAppCheck }]
    });

    const req = new HttpRequest('GET', '/api/gallery/marvel');
    await new Promise<void>((resolve) => {
      TestBed.runInInjectionContext(() => {
        appCheckInterceptor(req, (reqTransformed) => {
          expect(reqTransformed.headers.has('X-Firebase-AppCheck')).toBe(false);
          resolve();
          return of(new HttpResponse({ status: 200 }));
        }).subscribe();
      });
    });
  });
});
