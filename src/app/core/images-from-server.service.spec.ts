import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ImagesFromServerService } from './images-from-server.service';
import { LoaderService } from './loader.service';
import { INIT_GALLERY_STATE } from '../shared/constants';

describe('ImagesFromServerService (Zoneless Signals & Circuit Breaker)', () => {
  let service: ImagesFromServerService;
  let mockHttpClient: any;
  let mockLoaderService: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(() => of(INIT_GALLERY_STATE)),
      post: vi.fn(() => of({}))
    };

    mockLoaderService = {
      loadingSignal: vi.fn(() => false),
      setLoaderTo: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ImagesFromServerService,
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: LoaderService, useValue: mockLoaderService }
      ]
    });

    service = TestBed.inject(ImagesFromServerService);
  });

  it('should initialize with default signals and CLOSED circuit breaker', () => {
    expect(service.selectedCategorySignal()).toBe('marvel');
    expect(service.gameIsInPlaySignal()).toBe(false);
    expect(service.imagesSignal()).toEqual(INIT_GALLERY_STATE);
    expect(service.searchQuerySignal()).toBe('');
    expect(service.currentChallengeSignal()).toBeNull();
    expect(service.circuitStateSignal()).toBe('CLOSED');
    expect(service.isOffline()).toBe(false);
    expect(service.isReconnecting()).toBe(false);
  });

  it('should update gameIsInPlaySignal when setGameIsInPlay is called', () => {
    service.setGameIsInPlay(true);
    expect(service.gameIsInPlaySignal()).toBe(true);

    service.setGameIsInPlay(false);
    expect(service.gameIsInPlaySignal()).toBe(false);
  });

  it('should update searchQuerySignal when searchCards is invoked', () => {
    service.searchCards('Iron Man');
    expect(service.searchQuerySignal()).toBe('Iron Man');
    expect(mockHttpClient.get).toHaveBeenCalled();
  });

  it('should reset signals when resetGalleryState is called', () => {
    service.resetGalleryState();
    expect(service.imagesSignal()).toEqual(INIT_GALLERY_STATE);
  });

  it('should trip circuit breaker to OPEN when HTTP requests fail', () => {
    vi.useFakeTimers();
    mockHttpClient.get.mockReturnValue(throwError(() => new Error('Connection refused')));
    service.getImages();

    // Fast-forward through exponential backoff timers (1s + 2s + 4s)
    vi.advanceTimersByTime(10000);

    expect(service.circuitStateSignal()).toBe('OPEN');
    expect(service.isOffline()).toBe(true);
    expect(service.isReconnecting()).toBe(false);
    expect(mockLoaderService.setLoaderTo).toHaveBeenCalledWith(false);
    vi.useRealTimers();
  });

  it('should transition circuit breaker to HALF_OPEN when retryConnection is called', () => {
    vi.useFakeTimers();
    mockHttpClient.get.mockReturnValue(throwError(() => new Error('Server down')));
    service.getImages();
    vi.advanceTimersByTime(10000);
    expect(service.circuitStateSignal()).toBe('OPEN');

    // Trigger user retry
    service.retryConnection();
    expect(service.circuitStateSignal()).toBe('OPEN'); // Tripped again after failed probe
    vi.useRealTimers();
  });

  it('should close circuit breaker when retryConnection succeeds', () => {
    vi.useFakeTimers();
    mockHttpClient.get.mockReturnValue(throwError(() => new Error('Server down')));
    service.getImages();
    vi.advanceTimersByTime(10000);
    expect(service.circuitStateSignal()).toBe('OPEN');

    // Simulate backend waking up
    const mockSuccessResponse = {
      ...INIT_GALLERY_STATE,
      data: {
        offset: 0,
        limit: 12,
        total: 1,
        count: 1,
        results: [{ id: '1', name: 'Iron Man' } as any]
      }
    };
    mockHttpClient.get.mockReturnValue(of(mockSuccessResponse));

    service.retryConnection();
    expect(service.circuitStateSignal()).toBe('CLOSED');
    expect(service.isOffline()).toBe(false);
    expect(service.imagesSignal()).toEqual(mockSuccessResponse);
    vi.useRealTimers();
  });
});
