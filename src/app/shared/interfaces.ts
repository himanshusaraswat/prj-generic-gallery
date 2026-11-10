export type Modes = 'INPLAY | GALLERY' | 'PLAY';
export type GalleryCategory = 'marvel' | 'nfl';

export interface GalleryThumbnail {
  path?: string;
  extension?: string;
}

export interface GalleryCardItem {
  id: string | number;
  name: string;
  Name?: string;
  image?: string;
  thumbnail?: GalleryThumbnail;
  alterEgo?: string;
  team?: string;
  category?: string;
  description?: string;
}

export interface PaginatedGalleryData {
  offset: number;
  limit: number;
  total: number;
  count: number;
  results: GalleryCardItem[];
}

export interface PaginatedGalleryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GalleryCardItem[];
  data: PaginatedGalleryData;
}

// Backward-compatibility aliases for smooth transition
export type Character = GalleryCardItem;
export type MarvelApiResponse = PaginatedGalleryResponse;
export type CharacterDataContainer = PaginatedGalleryData;
