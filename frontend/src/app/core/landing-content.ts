export interface MediaAsset {
  id: string;
  category: string;
  originalFileName: string;
  url: string;
  thumbnailUrl: string | null;
  contentType: string;
  sizeBytes: number;
  thumbnailContentType: string | null;
  thumbnailSizeBytes: number | null;
}

export interface LandingContent {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  imageAlt: string;
  titleEn: string | null;
  eyebrowEn: string | null;
  descriptionEn: string | null;
  ctaLabelEn: string | null;
  imageAltEn: string | null;
  heroImage: MediaAsset | null;
}

export interface LandingGalleryImage {
  id: string;
  sortOrder: number;
  image: MediaAsset;
}

/*
 * Bez `title`: główny napis hero zastąpiło logo - plik PNG wgrany razem
 * z kodem. Nie da się go już zmienić z panelu, więc pole zniknęło z formularza.
 * W odpowiedzi API (`LandingContent`) kolumna zostaje, żeby nie ruszać bazy.
 */
export interface UpdateLandingHeroInput {
  ctaLabel: string;
  ctaUrl: string;
  imageAlt: string;
  /** Pola opcjonalne - brak tłumaczenia jest normalnym stanem. */
  ctaLabelEn?: string;
  imageAltEn?: string;
  heroImage?: File | null;
}
