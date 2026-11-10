import { Injectable, inject, effect } from '@angular/core';
import { ImagesFromServerService } from './images-from-server.service';
import { GalleryCategory } from '../shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private imagesService = inject(ImagesFromServerService);
  readonly currentTheme = this.imagesService.selectedCategorySignal;

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
      }
    });
  }

  setTheme(category: GalleryCategory) {
    this.imagesService.setCategory(category);
  }
}
