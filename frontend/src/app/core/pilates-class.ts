import { MediaAsset } from './landing-content';

export interface PilatesClass {
  id: string;
  title: string;
  levelLabel: string;
  description: string;
  signupUrl: string | null;
  titleEn: string | null;
  levelLabelEn: string | null;
  descriptionEn: string | null;
  sortOrder: number;
  image: MediaAsset | null;
}

export interface CreatePilatesClassInput {
  title: string;
  levelLabel: string;
  description: string;
  signupUrl: string;
  /** Pola opcjonalne - brak tłumaczenia jest normalnym stanem. */
  titleEn?: string;
  levelLabelEn?: string;
  descriptionEn?: string;
  image?: File | null;
}

export interface UpdatePilatesClassInput extends CreatePilatesClassInput {
  /** Zdjęcie zajęć jest opcjonalne, więc usunięcie go wymaga jawnej flagi. */
  removeImage?: boolean;
}
