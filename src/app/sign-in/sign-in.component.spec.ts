import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignInComponent } from './sign-in.component';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';
import { AnalyticsService } from '../core/services/analytics.service';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext
} from '@angular/core';

describe('SignInComponent (Zoneless Reactive Auth & Showcase)', () => {
  let mockAuthService: {
    login: ReturnType<typeof vi.fn>;
    loginAsGuest: ReturnType<typeof vi.fn>;
  };
  let mockThemeService: {
    setTheme: ReturnType<typeof vi.fn>;
    currentTheme: ReturnType<typeof signal>;
  };
  let mockAnalyticsService: {
    logThemeChanged: ReturnType<typeof vi.fn>;
    logTriviaGuess: ReturnType<typeof vi.fn>;
  };
  let mockRoute: {
    snapshot: { queryParamMap: { get: ReturnType<typeof vi.fn> } };
  };

  beforeEach(() => {
    mockAuthService = {
      login: vi.fn(),
      loginAsGuest: vi.fn()
    };
    mockThemeService = {
      setTheme: vi.fn(),
      currentTheme: signal('marvel')
    };
    mockAnalyticsService = {
      logThemeChanged: vi.fn(),
      logTriviaGuess: vi.fn()
    };
    mockRoute = {
      snapshot: {
        queryParamMap: {
          get: vi.fn().mockReturnValue(null)
        }
      }
    };
  });

  function createComponent(): SignInComponent {
    const parent = TestBedParentMock();
    const injector = createEnvironmentInjector(
      [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: ActivatedRoute, useValue: mockRoute }
      ],
      parent
    );
    return runInInjectionContext(injector, () => new SignInComponent());
  }

  function TestBedParentMock(): EnvironmentInjector {
    return {
      get: (token: any) => {
        if (token === AuthService) return mockAuthService;
        if (token === ThemeService) return mockThemeService;
        if (token === AnalyticsService) return mockAnalyticsService;
        if (token === ActivatedRoute) return mockRoute;
        return null;
      }
    } as unknown as EnvironmentInjector;
  }

  it('should initialize with marvel tab active and trivia unselected', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('marvel');
    expect(mockThemeService.setTheme).toHaveBeenCalledWith('marvel');
    expect(component.selectedTriviaAnswer()).toBeNull();
  });

  it('should switch showcase tabs and synchronize with ThemeService', () => {
    const component = createComponent();
    component.setTab('nfl');
    expect(component.activeTab()).toBe('nfl');
    expect(mockThemeService.setTheme).toHaveBeenCalledWith('nfl');

    component.setTab('trivia');
    expect(component.activeTab()).toBe('trivia');
  });

  it('should handle trivia interactive answer selection', () => {
    const component = createComponent();
    component.setTab('trivia');
    component.selectTrivia('tony');
    expect(component.selectedTriviaAnswer()).toBe('tony');

    component.selectTrivia('steve');
    expect(component.selectedTriviaAnswer()).toBe('steve');
  });

  it('should trigger loginAsGuest when isTestAuth is true', () => {
    mockRoute.snapshot.queryParamMap.get.mockReturnValue('true');
    const component = createComponent();
    expect(component.isTestAuth).toBe(true);
    expect(mockAuthService.loginAsGuest).toHaveBeenCalledTimes(1);
  });
});
