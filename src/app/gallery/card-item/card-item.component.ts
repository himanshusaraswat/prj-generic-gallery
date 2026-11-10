import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import {
  MatCard,
  MatCardHeader,
  MatCardAvatar,
  MatCardTitle,
  MatCardImage
} from '@angular/material/card';
import { GalleryCardItem, GalleryCategory } from '../../shared/interfaces';

@Component({
  selector: 'app-card-item',
  templateUrl: './card-item.component.html',
  styleUrls: ['./card-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardImage, TitleCasePipe]
})
export class CardItemComponent {
  /**
   * Required card item via Signal input
   */
  item = input.required<GalleryCardItem>();

  /**
   * Current collection category for avatar styling
   */
  category = input<GalleryCategory>('marvel');

  /**
   * Priority flag: true for top-of-fold cards for LCP optimization
   */
  priority = input<boolean>(false);

  /**
   * Computed image URL resolving full path with fallback
   */
  imageUrl = computed<string>(() => {
    const card = this.item();
    if (!card) return 'assets/infinity.svg';
    if (card.image) return card.image;
    if (card.thumbnail?.path) {
      const ext = card.thumbnail.extension || 'jpg';
      return `${card.thumbnail.path}.${ext}`;
    }
    return 'assets/infinity.svg';
  });

  /**
   * Computed display name
   */
  displayName = computed<string>(() => {
    const card = this.item();
    return card?.name || card?.Name || '';
  });
}
