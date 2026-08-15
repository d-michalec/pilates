import { MediaAsset } from './landing-content';

export interface StudioEvent {
  id: string;
  title: string;
  hostName: string;
  shortDescription: string;
  description: string;
  hostDescription: string | null;
  eventStartAt: string;
  durationMinutes: number | null;
  location: string | null;
  capacity: number | null;
  price: string | null;
  signupUrl: string | null;
  titleEn: string | null;
  shortDescriptionEn: string | null;
  descriptionEn: string | null;
  hostDescriptionEn: string | null;
  locationEn: string | null;
  priceEn: string | null;
  image: MediaAsset;
  hostImage: MediaAsset | null;
}

export interface UpdateStudioEventInput extends Omit<CreateStudioEventInput, 'image'> {
  /** Zdjęcie wydarzenia jest obowiązkowe, więc przy edycji można je tylko podmienić. */
  image?: File | null;
  /** Zdjęcie prowadzącego jest opcjonalne, dlatego jego usunięcie wymaga jawnej flagi. */
  removeHostImage?: boolean;
}

export interface CreateStudioEventInput {
  /** Pola angielskie są opcjonalne - brak tłumaczenia jest normalnym stanem. */
  titleEn?: string;
  shortDescriptionEn?: string;
  descriptionEn?: string;
  hostDescriptionEn?: string;
  locationEn?: string;
  priceEn?: string;
  title: string;
  hostName: string;
  shortDescription: string;
  description: string;
  hostDescription: string;
  eventStartAt: string;
  durationMinutes: number | null;
  location: string;
  capacity: number | null;
  price: string;
  signupUrl: string;
  image: File;
  hostImage?: File | null;
}
