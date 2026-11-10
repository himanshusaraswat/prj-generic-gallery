import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GalleryComponent } from './gallery.component';
import { AuthService } from '../core/auth.service';
import { ImagesFromServerService } from '../core/images-from-server.service';
import { LoaderService } from '../core/loader.service';
import { AnalyticsService } from '../core/services/analytics.service';
import { APP_MODES, ACTION } from '../shared/constants';
import { signal } from '@angular/core';
import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext
} from '@angular/core';

describe('GalleryComponent (Mode Switching & Lifecycle Optimization)', () => {
  let mockAuthService: any;
  let mockImagesFromServer: any;
  let mockLoaderService: any;
  let mockAnalyticsService: any;

  beforeEach(() => {
    mockAuthService = {
      isAuthResolvedSignal: signal(true),
      currentUserSignal: signal({ uid: 'test-123' })
    };

    mockImagesFromServer = {
      imagesSignal: signal({
        count: 0,
        next: null,
        previous: null,
        results: [],
        data: { offset: 0, limit: 12, total: 0, count: 0, results: [] }
      }),
      gameIsInPlaySignal: signal(false),
      selectedCategorySignal: signal('marvel'),
      searchQuerySignal: signal(''),
      isOffline: signal(false),
      isReconnecting: signal(false),
      getImages: vi.fn(),
      setGameIsInPlay: vi.fn(),
      resetGalleryState: vi.fn(),
      resetPlayground: vi.fn(),
      setCategory: vi.fn(),
      searchCards: vi.fn(),
      clearSearch: vi.fn(),
      retryConnection: vi.fn(),
      setParams: vi.fn()
    };

    mockLoaderService = {
      loadingSignal: signal(false),
      setLoaderTo: vi.fn()
    };

    mockAnalyticsService = {
      logThemeChanged: vi.fn(),
      logSearchQuery: vi.fn(),
      logTriviaStarted: vi.fn()
    };
  });

  function createComponent(): GalleryComponent {
    const parent = TestBedParentMock();
    const injector = createEnvironmentInjector(
      [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ImagesFromServerService, useValue: mockImagesFromServer },
        { provide: LoaderService, useValue: mockLoaderService },
        { provide: AnalyticsService, useValue: mockAnalyticsService }
      ],
      parent
    );
    return runInInjectionContext(injector, () => new GalleryComponent());
  }

  function TestBedParentMock(): EnvironmentInjector {
    return {
      get: (token: any) => {
        if (token === AuthService) return mockAuthService;
        if (token === ImagesFromServerService) return mockImagesFromServer;
        if (token === LoaderService) return mockLoaderService;
        if (token === AnalyticsService) return mockAnalyticsService;
        return null;
      }
    } as unknown as EnvironmentInjector;
  }

  it('should initialize and fetch gallery cards on ngOnInit', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(mockImagesFromServer.getImages).toHaveBeenCalledTimes(1);
    expect(component.MODE).toBe(APP_MODES.gallery);
  });

  it('should NOT call getImages when entering play mode (preventing duplicate random calls & race conditions with GameModeComponent)', () => {
    const component = createComponent();
    component.ngOnInit();
    mockImagesFromServer.getImages.mockClear();

    // Toggle enter play mode
    component.setAppMode(true);

    expect(component.MODE).toBe(APP_MODES.play);
    expect(mockImagesFromServer.setGameIsInPlay).toHaveBeenCalledWith(true);
    expect(mockImagesFromServer.resetGalleryState).toHaveBeenCalled();
    expect(mockImagesFromServer.resetPlayground).toHaveBeenCalledWith(ACTION.init, APP_MODES.play);
    expect(mockAnalyticsService.logTriviaStarted).toHaveBeenCalledWith('marvel');

    // CRITICAL: getImages() must NOT be called here because GameModeComponent mounts and calls getRandomChallenge in ngOnInit
    expect(mockImagesFromServer.getImages).not.toHaveBeenCalled();
  });

  it('should call getImages and set loader when switching back to gallery mode', () => {
    const component = createComponent();
    component.setAppMode(true);
    mockImagesFromServer.getImages.mockClear();
    mockLoaderService.setLoaderTo.mockClear();

    // Toggle back to gallery mode
    component.setAppMode(false);

    expect(component.MODE).toBe(APP_MODES.gallery);
    expect(mockImagesFromServer.setGameIsInPlay).toHaveBeenCalledWith(false);
    expect(mockLoaderService.setLoaderTo).toHaveBeenCalledWith(true);
    expect(mockImagesFromServer.getImages).toHaveBeenCalledTimes(1);
  });

  it('should switch categories and log analytics', () => {
    const component = createComponent();
    component.switchCategory('nfl');

    expect(mockImagesFromServer.setCategory).toHaveBeenCalledWith('nfl', true);
    expect(mockAnalyticsService.logThemeChanged).toHaveBeenCalledWith('nfl', 'nav_pill');
  });

  it('should route search queries to imagesFromServer service', () => {
    const component = createComponent();
    const mockEvent = { target: { value: 'Spider-Man' } } as unknown as Event;
    component.onSearchInput(mockEvent);

    expect(mockImagesFromServer.searchCards).toHaveBeenCalledWith('Spider-Man');
    expect(mockAnalyticsService.logSearchQuery).toHaveBeenCalledWith('Spider-Man', 'marvel');
  });
});
