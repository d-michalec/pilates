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

export interface UpdateLandingHeroInput {
  title: string;
  ctaLabel: string;
  ctaUrl: string;
  imageAlt: string;
  /** Pola opcjonalne - brak tłumaczenia jest normalnym stanem. */
  titleEn?: string;
  ctaLabelEn?: string;
  imageAltEn?: string;
  heroImage?: File | null;
}
