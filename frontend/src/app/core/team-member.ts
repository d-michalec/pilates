import { MediaAsset } from './landing-content';

export interface TeamMember {
  id: string;
  fullName: string;
  description: string;
  descriptionEn: string | null;
  sortOrder: number;
  image: MediaAsset;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberInput {
  fullName: string;
  description: string;
  /** Pole opcjonalne - brak tłumaczenia jest normalnym stanem. */
  descriptionEn?: string;
  photo: File;
}

export interface UpdateTeamMemberInput {
  fullName: string;
  description: string;
  descriptionEn?: string;
  /** Pominięcie pliku zachowuje dotychczasowe zdjęcie. */
  photo?: File | null;
}
