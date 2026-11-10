import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, retry, tap } from 'rxjs/operators';
import {
  PaginatedGalleryResponse,
  GalleryCardItem,
  GalleryCategory,
  Modes
} from '../shared/interfaces';
import { APP_MODES, ACTION, INIT_GALLERY_STATE } from '../shared/constants';
import { environment } from '../../environments/environment';
import { LoaderService } from './loader.service';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

@Injectable({
  providedIn: 'root'
})
export class ImagesFromServerService {
  private http = inject(HttpClient);
  private loader = inject(LoaderService);

  // Category state (Signals)
  private selectedCategory = signal<GalleryCategory>('marvel');
  readonly selectedCategorySignal = this.selectedCategory.asReadonly();

  // Mode and Play state
  private gameIsInPlay = signal<boolean>(false);
  readonly gameIsInPlaySignal = this.gameIsInPlay.asReadonly();

  // Gallery cards state
  private images = signal<PaginatedGalleryResponse>(INIT_GALLERY_STATE);
  readonly imagesSignal = this.images.asReadonly();

  // Search state
  private searchQuery = signal<string>('');
  readonly searchQuerySignal = this.searchQuery.asReadonly();

  // Current Trivia Mystery Card
  private currentChallenge = signal<GalleryCardItem | null>(null);
  readonly currentChallengeSignal = this.currentChallenge.asReadonly();

  // Circuit Breaker & Exponential Backoff state (Signals)
  private circuitState = signal<CircuitState>('CLOSED');
  readonly circuitStateSignal = this.circuitState.asReadonly();

  private retryAttempt = signal<number>(0);
  readonly retryAttemptSignal = this.retryAttempt.asReadonly();

  readonly isOffline = computed(() => this.circuitState() === 'OPEN');
  readonly isReconnecting = computed(() => this.circuitState() === 'HALF_OPEN');

  private readonly MAX_RETRIES = 3;

  private action = signal<string>(ACTION.init);
  private mode = signal<string>(APP_MODES.gallery);
  private currentPage = signal<number>(0);

  readonly PAGE_SIZE = 12;

  /**
   * Switch collection category (Marvel Heroes <-> NFL Players)
   */
  setCategory(category: GalleryCategory) {
    if (this.selectedCategory() === category) return;
    this.selectedCategory.set(category);
    this.searchQuery.set('');
    this.resetPlayground(ACTION.init, this.mode());
    this.resetGalleryState();
    this.getImages();
  }

  setParams(action: string, mode: Modes | string) {
    this.currentPage.update((page) => page + 1);
    this.action.set(action);
    this.mode.set(mode as string);
  }

  /**
   * Main image fetching method with Circuit Breaker and Exponential Backoff
   */
  public getImages() {
    this.loader.setLoaderTo(true);

    if (this.mode() === APP_MODES.play) {
      this.getRandomChallenge().subscribe({
        next: () => this.loader.setLoaderTo(false),
        error: () => this.loader.setLoaderTo(false)
      });
      return;
    }

    const offset = this.action() === ACTION.init ? 0 : this.currentPage() * this.PAGE_SIZE;
    const url = `${environment.API_URL}${this.selectedCategory()}?limit=${this.PAGE_SIZE}&offset=${offset}`;

    // Probe attempt (HALF_OPEN) tries once; CLOSED state uses 3 exponential backoff retries
    const retries = this.circuitState() === 'HALF_OPEN' ? 0 : this.MAX_RETRIES;

    this.http
      .get<PaginatedGalleryResponse>(url)
      .pipe(
        retry({
          count: retries,
          delay: (_error, count) => {
            this.retryAttempt.set(count);
            // Exponential backoff: 2^(count - 1) * 1000ms + random jitter up to 200ms
            const delayMs = Math.pow(2, count - 1) * 1000 + Math.floor(Math.random() * 200);
            return timer(delayMs);
          }
        }),
        catchError((err) => {
          console.warn('Gallery API connection failed. Tripping circuit breaker to OPEN:', err);
          this.circuitState.set('OPEN');
          this.retryAttempt.set(0);
          this.loader.setLoaderTo(false);
          return of(INIT_GALLERY_STATE);
        })
      )
      .subscribe((response: PaginatedGalleryResponse) => {
        if (this.circuitState() !== 'OPEN') {
          this.circuitState.set('CLOSED');
          this.retryAttempt.set(0);

          if (this.action() === ACTION.paginate && this.mode() === APP_MODES.gallery) {
            this.generateStatePostPagination(response);
          } else {
            this.images.set(response);
          }
        }
        this.loader.setLoaderTo(false);
      });
  }

  /**
   * User-triggered probe to test if backend has awakened (transitions Circuit to HALF_OPEN)
   */
  public retryConnection() {
    this.circuitState.set('HALF_OPEN');
    this.retryAttempt.set(0);
    this.loader.setLoaderTo(true);
    this.getImages();
  }

  /**
   * Reset circuit to closed state (useful for tests and resets)
   */
  public resetCircuit() {
    this.circuitState.set('CLOSED');
    this.retryAttempt.set(0);
  }

  /**
   * Live search items by keyword connecting to Fastify /gallery/:category/search
   */
  public searchCards(query: string) {
    const trimmed = query.trim();
    this.searchQuery.set(trimmed);

    if (!trimmed) {
      this.resetPlayground(ACTION.init, this.mode());
      this.getImages();
      return;
    }

    this.loader.setLoaderTo(true);
    const url = `${environment.API_URL}${this.selectedCategory()}/search?q=${encodeURIComponent(
      trimmed
    )}&limit=${this.PAGE_SIZE}&offset=0`;

    this.http
      .get<PaginatedGalleryResponse>(url)
      .pipe(
        catchError((err) => {
          console.error('Failed to search gallery items from live server:', err);
          return of(INIT_GALLERY_STATE);
        })
      )
      .subscribe((response: PaginatedGalleryResponse) => {
        this.images.set(response);
        this.loader.setLoaderTo(false);
      });
  }

  public clearSearch() {
    this.searchCards('');
  }

  /**
   * Fetch a random mystery card from backend for Trivia Challenge mode
   */
  public getRandomChallenge(): Observable<GalleryCardItem | null> {
    const url = `${environment.API_URL}${this.selectedCategory()}/random`;
    return this.http.get<GalleryCardItem>(url).pipe(
      tap((card) => {
        this.currentChallenge.set(card);
        // Also update imagesSignal so existing template bindings work seamlessly
        this.images.set({
          count: 1,
          next: null,
          previous: null,
          results: [card],
          data: {
            offset: 0,
            limit: 1,
            total: 1,
            count: 1,
            results: [card]
          }
        });
      }),
      catchError((err) => {
        console.error('Failed to fetch random card from live server:', err);
        return of(null);
      })
    );
  }

  /**
   * Verify character guess against live microservice validation endpoint
   */
  public verifyGuess(id: string | number, guess: string): Observable<boolean> {
    const url = `${environment.API_URL}${this.selectedCategory()}/verify?id=${encodeURIComponent(
      String(id)
    )}&name=${encodeURIComponent(guess.trim())}`;

    return this.http.get<boolean>(url).pipe(
      map((res) => res === true),
      catchError((err) => {
        console.warn('Guess verification rejected or not found:', err);
        return of(false);
      })
    );
  }

  resetPlayground(action: string, mode: string) {
    this.currentPage.set(0);
    this.action.set(action);
    this.mode.set(mode);
  }

  resetGalleryState() {
    this.images.set({ ...INIT_GALLERY_STATE });
    this.currentChallenge.set(null);
  }

  private generateStatePostPagination(response: PaginatedGalleryResponse) {
    const prevResults = this.images().data?.results || [];
    const newResults = response.data?.results || response.results || [];

    // Filter out duplicates by id
    const existingIds = new Set(prevResults.map((item) => String(item.id)));
    const uniqueNew = newResults.filter((item) => !existingIds.has(String(item.id)));
    const merged = [...prevResults, ...uniqueNew];

    this.images.set({
      ...response,
      results: merged,
      data: {
        ...response.data,
        results: merged,
        count: merged.length
      }
    });
  }

  setGameIsInPlay(inPlay: boolean) {
    this.gameIsInPlay.set(inPlay);
  }
}
