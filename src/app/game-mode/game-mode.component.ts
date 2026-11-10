import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard,
  MatCardHeader,
  MatCardAvatar,
  MatCardImage,
  MatCardContent,
  MatCardActions
} from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { LoaderComponent } from '../loader/loader.component';
import { ImagesFromServerService } from '../core/images-from-server.service';
import { LoaderService } from '../core/loader.service';
import { AnalyticsService } from '../core/services/analytics.service';
import { GalleryCardItem } from '../shared/interfaces';
import confetti from 'canvas-confetti';

interface TriviaGuessModel {
  name: string;
}

@Component({
  selector: 'app-game-mode',
  templateUrl: './game-mode.component.html',
  styleUrl: './game-mode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardAvatar,
    MatCardImage,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatCardActions,
    MatButton,
    LoaderComponent,
    FormField,
    FormsModule
  ]
})
export class GameModeComponent implements OnInit {
  loaderService = inject(LoaderService);
  loading = this.loaderService.loadingSignal;
  imagesFromServer = inject(ImagesFromServerService);
  private analytics = inject(AnalyticsService);

  shake = signal<boolean>(false);
  isVerifying = signal<boolean>(false);
  feedback = signal<string | null>(null);
  feedbackSuccess = signal<boolean>(false);
  guessAttempts = signal<number>(0);

  selectedCategory = this.imagesFromServer.selectedCategorySignal;
  images = this.imagesFromServer.imagesSignal;

  currentCard = computed<GalleryCardItem | null>(() => {
    return this.imagesFromServer.currentChallengeSignal() || this.images().data.results[0] || null;
  });

  // Signal Forms: Single source of truth writable model signal
  readonly guessModel = signal<TriviaGuessModel>({ name: '' });

  // Signal Forms: FieldTree with declarative schema rules
  readonly guessForm = form(this.guessModel, (path) => {
    required(path.name, { message: 'Please enter a guess' });
  });

  ngOnInit(): void {
    if (!this.currentCard()) {
      this.doPagination();
    }
  }

  getImageUrl(item: GalleryCardItem | null | undefined): string {
    if (!item) return 'assets/infinity.svg';
    if (item.image) return item.image;
    if (item.thumbnail?.path) {
      const ext = item.thumbnail.extension || 'jpg';
      return `${item.thumbnail.path}.${ext}`;
    }
    return 'assets/infinity.svg';
  }

  doPagination() {
    this.imagesFromServer.setGameIsInPlay(true);
    this.loaderService.setLoaderTo(true);
    this.feedback.set(null);
    this.guessAttempts.set(0);
    this.guessModel.set({ name: '' });
    this.guessForm().reset();

    this.imagesFromServer.getRandomChallenge().subscribe({
      next: () => this.loaderService.setLoaderTo(false),
      error: () => this.loaderService.setLoaderTo(false)
    });
  }

  onSkip() {
    const card = this.currentCard();
    if (card) {
      this.analytics.logTriviaSkipped(card.name, this.selectedCategory());
    }
    this.doPagination();
  }

  onSubmit() {
    const card = this.currentCard();
    if (!card || this.guessForm().invalid() || this.isVerifying()) return;

    const rawGuess = this.guessModel().name.trim();
    if (!rawGuess) return;

    this.guessAttempts.update((count) => count + 1);
    this.isVerifying.set(true);

    this.imagesFromServer.verifyGuess(card.id, rawGuess).subscribe({
      next: (isCorrect) => {
        this.isVerifying.set(false);
        this.analytics.logTriviaGuess(
          card.name,
          isCorrect,
          this.selectedCategory(),
          this.guessAttempts()
        );

        if (isCorrect) {
          // Confetti celebration
          try {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch (e) {
            console.warn('Confetti trigger', e);
          }

          this.feedbackSuccess.set(true);
          this.feedback.set(`🎉 Correct! It's ${card.name}!`);

          // Auto-advance to next mystery card
          setTimeout(() => {
            this.doPagination();
          }, 1500);
        } else {
          // Error shake animation & cues
          this.shake.set(true);
          this.feedbackSuccess.set(false);
          this.feedback.set('❌ Incorrect guess. Try again!');

          setTimeout(() => {
            this.shake.set(false);
          }, 800);
        }
      },
      error: () => {
        this.isVerifying.set(false);
        this.shake.set(true);
        this.feedbackSuccess.set(false);
        this.feedback.set('⚠️ Verification check failed. Please retry.');
        setTimeout(() => this.shake.set(false), 800);
      }
    });
  }
}
