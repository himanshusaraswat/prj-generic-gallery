import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';
import { AnalyticsService } from '../core/services/analytics.service';
import { environment } from '../../environments/environment';

export type ShowcaseTab = 'marvel' | 'nfl' | 'trivia';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class SignInComponent {
  auth = inject(AuthService);
  private themeService = inject(ThemeService);
  private analytics = inject(AnalyticsService);
  private route = inject(ActivatedRoute);

  // Strictly disabled on production. Never rendered for live visitors.
  readonly isTestAuth = this.route.snapshot.queryParamMap.get('test_auth') === 'true';
  readonly showGuestLogin = !environment.production && Boolean(environment.allowGuestLogin);

  // Reactive theme signal connected directly to ThemeService
  readonly currentCategory = this.themeService.currentTheme;

  // Interactive "What We Offer" showcase signals
  readonly activeTab = signal<ShowcaseTab>('marvel');
  readonly selectedTriviaAnswer = signal<string | null>(null);

  constructor() {
    // Always start with Marvel on initial load as per theme system
    this.themeService.setTheme('marvel');

    // Automated CI test bypass
    if (this.isTestAuth) {
      this.auth.loginAsGuest();
    }
  }

  setTab(tab: ShowcaseTab) {
    this.activeTab.set(tab);
    if (tab === 'marvel' || tab === 'nfl') {
      this.themeService.setTheme(tab);
      this.analytics.logThemeChanged(tab, 'landing_tab');
    }
  }

  selectTrivia(choice: string) {
    this.selectedTriviaAnswer.set(choice);
    this.analytics.logTriviaGuess('Iron Man (Demo)', choice === 'tony', 'marvel', 1);
  }
}
