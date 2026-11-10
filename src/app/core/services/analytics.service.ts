import { Injectable, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { environment } from '../../../environments/environment';

export type AnalyticsCategory = 'marvel' | 'nfl';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private analytics = inject(Analytics, { optional: true });

  private shouldLog(): boolean {
    return Boolean(environment.production && environment.analytics?.enabled && this.analytics);
  }

  logThemeChanged(theme: AnalyticsCategory, source: 'landing_tab' | 'nav_pill'): void {
    if (!this.shouldLog()) return;
    logEvent(this.analytics!, 'theme_changed', { selected_theme: theme, source });
  }

  logSearchQuery(query: string, category: AnalyticsCategory): void {
    if (!this.shouldLog() || !query.trim()) return;
    logEvent(this.analytics!, 'search_gallery', {
      search_term: query.toLowerCase(),
      category
    });
  }

  logTriviaStarted(category: AnalyticsCategory): void {
    if (!this.shouldLog()) return;
    logEvent(this.analytics!, 'trivia_started', { category });
  }

  logTriviaGuess(
    characterName: string,
    isCorrect: boolean,
    category: AnalyticsCategory,
    attempts: number
  ): void {
    if (!this.shouldLog()) return;
    logEvent(this.analytics!, 'trivia_guess_submitted', {
      character_name: characterName,
      is_correct: isCorrect,
      category,
      attempts
    });
  }

  logTriviaSkipped(characterName: string, category: AnalyticsCategory): void {
    if (!this.shouldLog()) return;
    logEvent(this.analytics!, 'trivia_skipped', {
      character_name: characterName,
      category
    });
  }

  logTriviaCompleted(score: number, totalQuestions: number): void {
    if (!this.shouldLog()) return;
    logEvent(this.analytics!, 'trivia_completed', {
      final_score: score,
      total_questions: totalQuestions
    });
  }

  logAuthSuccess(method: 'google' | 'guest'): void {
    if (!this.shouldLog()) return;
    logEvent(this.analytics!, 'login', { method });
  }

  logLogout(): void {
    if (!this.shouldLog()) return;
    logEvent(this.analytics!, 'logout');
  }
}
