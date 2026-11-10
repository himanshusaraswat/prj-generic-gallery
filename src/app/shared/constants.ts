import { PaginatedGalleryResponse } from './interfaces';

export const APP_MODES = {
  gallery: 'GALLERY',
  play: 'PLAY',
  inplay: 'INPLAY'
} as const;

export const ACTION = {
  init: 'INIT',
  paginate: 'PAGINATE'
} as const;

export const ROUTES = {
  GALLERY: 'gallery',
  FALLBACK: 'try-again',
  LOGIN: 'login'
} as const;

export const ACTION_ERROR = {
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  MAX_LIMIT: `You can borrow only $LIMIT books`,
  COPIES_ALLOWED: `You can borrow only $DISTINCT copy of`
} as const;

export const ALLOWED_IMAGE_FORMAT = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml'
] as const;

export const INIT_GALLERY_STATE: PaginatedGalleryResponse = {
  count: 0,
  next: null,
  previous: null,
  results: [],
  data: {
    offset: 0,
    limit: 12,
    total: 0,
    count: 0,
    results: []
  }
};
