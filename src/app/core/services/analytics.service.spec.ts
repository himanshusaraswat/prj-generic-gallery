import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';
import { Analytics } from '@angular/fire/analytics';
import { environment } from '../../../environments/environment';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLogEvent = vi.fn();
vi.mock('@angular/fire/analytics', () => ({
  logEvent: (...args: any[]) => mockLogEvent(...args),
  Analytics: class {}
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const mockAnalytics = {} as Analytics;

  beforeEach(() => {
    mockLogEvent.mockClear();
    environment.production = true;
    environment.analytics = { enabled: true };

    TestBed.configureTestingModule({
      providers: [AnalyticsService, { provide: Analytics, useValue: mockAnalytics }]
    });
    service = TestBed.inject(AnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should log theme_changed event with correct parameters in production', () => {
    service.logThemeChanged('nfl', 'landing_tab');
    expect(mockLogEvent).toHaveBeenCalledWith(mockAnalytics, 'theme_changed', {
      selected_theme: 'nfl',
      source: 'landing_tab'
    });
  });

  it('should not log when environment is not production or analytics disabled', () => {
    environment.production = false;
    service.logThemeChanged('marvel', 'nav_pill');
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('should log search_gallery event when query is not empty', () => {
    service.logSearchQuery('Iron Man', 'marvel');
    expect(mockLogEvent).toHaveBeenCalledWith(mockAnalytics, 'search_gallery', {
      search_term: 'iron man',
      category: 'marvel'
    });
  });

  it('should not log search_gallery event if query is empty or whitespace', () => {
    service.logSearchQuery('   ', 'marvel');
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('should log trivia_started event', () => {
    service.logTriviaStarted('marvel');
    expect(mockLogEvent).toHaveBeenCalledWith(mockAnalytics, 'trivia_started', {
      category: 'marvel'
    });
  });

  it('should log trivia_guess_submitted event', () => {
    service.logTriviaGuess('Thor', true, 'marvel', 1);
    expect(mockLogEvent).toHaveBeenCalledWith(mockAnalytics, 'trivia_guess_submitted', {
      character_name: 'Thor',
      is_correct: true,
      category: 'marvel',
      attempts: 1
    });
  });

  it('should log trivia_skipped event', () => {
    service.logTriviaSkipped('Hulk', 'marvel');
    expect(mockLogEvent).toHaveBeenCalledWith(mockAnalytics, 'trivia_skipped', {
      character_name: 'Hulk',
      category: 'marvel'
    });
  });

  it('should log trivia_completed event', () => {
    service.logTriviaCompleted(8, 10);
    expect(mockLogEvent).toHaveBeenCalledWith(mockAnalytics, 'trivia_completed', {
      final_score: 8,
      total_questions: 10
    });
  });

  it('should log login event on auth success', () => {
    service.logAuthSuccess('google');
    expect(mockLogEvent).toHaveBeenCalledWith(mockAnalytics, 'login', {
      method: 'google'
    });
  });

  it('should log logout event', () => {
    service.logLogout();
    expect(mockLogEvent).toHaveBeenCalledWith(mockAnalytics, 'logout');
  });
});
