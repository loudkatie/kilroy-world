export type Circle = 'community' | 'verified';

export interface Place {
  place_id: string;
  place_name: string;
  address?: string;
}

export interface Kilroy {
  id: string;
  place_id: string;
  image_url: string;
  caption: string;
  circle: Circle;
  created_at: number;
}

export interface PlaceMetadata {
  place_id: string;
  place_name: string;
  address?: string;
  created_at: number;
}
