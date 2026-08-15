import { MediaAsset } from './landing-content';

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  questionEn: string | null;
  answerEn: string | null;
  sortOrder: number;
}

export interface FaqEntryInput {
  question: string;
  answer: string;
  questionEn: string;
  answerEn: string;
}

/** Tło sekcji "Co przygotowaliśmy" na landingu. */
export interface LandingOffer {
  imageAlt: string;
  image: MediaAsset | null;
}

export interface UpdateLandingOfferInput {
  imageAlt: string;
  image?: File | null;
  removeImage?: boolean;
}
