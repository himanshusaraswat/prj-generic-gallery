import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { ImagesFromServerService } from '../core/images-from-server.service';
import { AnalyticsService } from '../core/services/analytics.service';
import { FormsModule } from '@angular/forms';
import { GalleryCategory, Modes } from '../shared/interfaces';
import { ACTION, APP_MODES } from '../shared/constants';
import { UserMenuComponent } from '../toolbar/user-menu/user-menu.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { LoaderService } from '../core/loader.service';
import { LoaderComponent } from '../loader/loader.component';
import { GameModeComponent } from '../game-mode/game-mode.component';
import { CardItemComponent } from './card-item/card-item.component';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UserMenuComponent,
    MatSlideToggle,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    InfiniteScrollDirective,
    LoaderComponent,
    GameModeComponent,
    CardItemComponent
  ]
})
export class GalleryComponent implements OnInit {
  auth = inject(AuthService);
  imagesFromServer = inject(ImagesFromServerService);
  loaderService = inject(LoaderService);
  private analytics = inject(AnalyticsService);
  loading = this.loaderService.loadingSignal;

  enterPlayMode = false;
  MODE: Modes | string = APP_MODES.gallery;

  images = this.imagesFromServer.imagesSignal;
  gameIsInPlay = this.imagesFromServer.gameIsInPlaySignal;
  selectedCategory = this.imagesFromServer.selectedCategorySignal;
  searchQuery = this.imagesFromServer.searchQuerySignal;
  isOffline = this.imagesFromServer.isOffline;
  isReconnecting = this.imagesFromServer.isReconnecting;

  ngOnInit(): void {
    this.imagesFromServer.getImages();
  }

  retryConnection() {
    this.imagesFromServer.retryConnection();
  }

  switchCategory(category: GalleryCategory) {
    this.imagesFromServer.setCategory(category);
    this.analytics.logThemeChanged(category, 'nav_pill');
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.imagesFromServer.searchCards(input.value);
    this.analytics.logSearchQuery(input.value, this.selectedCategory());
  }

  clearSearch() {
    this.imagesFromServer.clearSearch();
  }

  setAppMode(play: boolean) {
    this.loaderService.setLoaderTo(true);
    this.MODE = play ? APP_MODES.play : APP_MODES.gallery;
    this.imagesFromServer.setGameIsInPlay(play);
    this.imagesFromServer.resetGalleryState();
    this.imagesFromServer.resetPlayground(ACTION.init, this.MODE);
    this.imagesFromServer.getImages();

    if (play) {
      this.analytics.logTriviaStarted(this.selectedCategory());
    }
  }

  doPagination() {
    if (this.loading() || this.searchQuery()) return;
    this.imagesFromServer.setParams(ACTION.paginate, this.MODE);
    this.imagesFromServer.getImages();
  }
}
