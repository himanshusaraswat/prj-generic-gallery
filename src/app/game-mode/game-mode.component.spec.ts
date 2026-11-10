import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GameModeComponent } from './game-mode.component';
import { ImagesFromServerService } from '../core/images-from-server.service';
import { LoaderService } from '../core/loader.service';
import { AnalyticsService } from '../core/services/analytics.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

// Mock canvas-confetti to prevent JSDOM unhandled timer exceptions on headless CI
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

describe('GameModeComponent (Encapsulated Challenge & Lifecycle)', () => {
  let mockImagesFromServer: any;
  let mockLoaderService: any;
  let mockAnalyticsService: any;

  const mockCard = {
    id: 101,
    name: 'Iron Man',
    image: 'https://example.com/iron-man.jpg',
    category: 'marvel'
  };

  beforeEach(() => {
    mockImagesFromServer = {
      selectedCategorySignal: signal('marvel'),
      imagesSignal: signal({
        count: 0,
        next: null,
        previous: null,
        results: [],
        data: { offset: 0, limit: 12, total: 0, count: 0, results: [] }
      }),
      currentChallengeSignal: signal(null),
      setGameIsInPlay: vi.fn(),
      getRandomChallenge: vi.fn(() => of(mockCard)),
      verifyGuess: vi.fn(() => of(true))
    };

    mockLoaderService = {
      loadingSignal: signal(false),
      setLoaderTo: vi.fn()
    };

    mockAnalyticsService = {
      logTriviaStarted: vi.fn(),
      logTriviaSkipped: vi.fn(),
      logTriviaGuess: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ImagesFromServerService, useValue: mockImagesFromServer },
        { provide: LoaderService, useValue: mockLoaderService },
        { provide: AnalyticsService, useValue: mockAnalyticsService }
      ]
    });
  });

  function createComponent(): GameModeComponent {
    return TestBed.runInInjectionContext(() => new GameModeComponent());
  }

  it('should initialize and fetch random challenge via doPagination on ngOnInit when no card exists', () => {
    const component = createComponent();
    expect(component.currentCard()).toBeNull();

    component.ngOnInit();

    expect(mockImagesFromServer.setGameIsInPlay).toHaveBeenCalledWith(true);
    expect(mockLoaderService.setLoaderTo).toHaveBeenCalledWith(true);
    expect(mockImagesFromServer.getRandomChallenge).toHaveBeenCalledTimes(1);
  });

  it('should NOT call doPagination on ngOnInit if a card already exists', () => {
    mockImagesFromServer.currentChallengeSignal = signal(mockCard);
    const component = createComponent();
    expect(component.currentCard()).toEqual(mockCard);

    component.ngOnInit();

    expect(mockImagesFromServer.getRandomChallenge).not.toHaveBeenCalled();
  });

  it('should reset guess model and call doPagination on skip', () => {
    mockImagesFromServer.currentChallengeSignal = signal(mockCard);
    const component = createComponent();
    component.guessModel.set({ name: 'Captain America' });

    component.onSkip();

    expect(mockAnalyticsService.logTriviaSkipped).toHaveBeenCalledWith('Iron Man', 'marvel');
    expect(mockImagesFromServer.getRandomChallenge).toHaveBeenCalledTimes(1);
    expect(component.guessModel().name).toBe('');
    expect(component.feedback()).toBeNull();
  });

  it('should handle correct guess submission with feedback and celebration', () => {
    mockImagesFromServer.currentChallengeSignal = signal(mockCard);
    mockImagesFromServer.verifyGuess = vi.fn(() => of(true));
    const component = createComponent();

    component.guessModel.set({ name: 'Iron Man' });
    component.onSubmit();

    expect(mockImagesFromServer.verifyGuess).toHaveBeenCalledWith(101, 'Iron Man');
    expect(mockAnalyticsService.logTriviaGuess).toHaveBeenCalledWith('Iron Man', true, 'marvel', 1);
    expect(component.feedbackSuccess()).toBe(true);
    expect(component.feedback()).toContain('Correct');
  });

  it('should handle incorrect guess submission with error cues', () => {
    mockImagesFromServer.currentChallengeSignal = signal(mockCard);
    mockImagesFromServer.verifyGuess = vi.fn(() => of(false));
    const component = createComponent();

    component.guessModel.set({ name: 'Hulk' });
    component.onSubmit();

    expect(mockImagesFromServer.verifyGuess).toHaveBeenCalledWith(101, 'Hulk');
    expect(mockAnalyticsService.logTriviaGuess).toHaveBeenCalledWith(
      'Iron Man',
      false,
      'marvel',
      1
    );
    expect(component.feedbackSuccess()).toBe(false);
    expect(component.feedback()).toContain('Incorrect');
    expect(component.shake()).toBe(true);
  });
});
