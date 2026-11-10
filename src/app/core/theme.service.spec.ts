import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { ImagesFromServerService } from './images-from-server.service';
import { GalleryCategory } from '../shared/interfaces';

describe('ThemeService', () => {
  let mockCategorySignal: any;
  let mockImagesService: any;
  let service: ThemeService;

  beforeEach(() => {
    mockCategorySignal = signal<GalleryCategory>('marvel');
    mockImagesService = {
      selectedCategorySignal: mockCategorySignal.asReadonly(),
      setCategory: vi.fn((category: GalleryCategory) => {
        mockCategorySignal.set(category);
      })
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ImagesFromServerService, useValue: mockImagesService }
      ]
    });

    service = TestBed.inject(ThemeService);
  });

  it('should initialize with marvel theme by default', () => {
    expect(service.currentTheme()).toBe('marvel');
  });

  it('should delegate setTheme to imagesService.setCategory with fetch=false', () => {
    service.setTheme('nfl');
    expect(mockImagesService.setCategory).toHaveBeenCalledWith('nfl', false);
    expect(service.currentTheme()).toBe('nfl');
  });
});
