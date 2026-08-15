import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';
import { LandingOffer, UpdateLandingOfferInput } from './faq';
import { LandingContent, LandingGalleryImage, UpdateLandingHeroInput } from './landing-content';

@Injectable({
  providedIn: 'root'
})
export class LandingService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl}/api`;
  }

  get() {
    return this.http.get<LandingContent>(`${this.apiUrl}/landing`);
  }

  updateHero(input: UpdateLandingHeroInput) {
    const formData = new FormData();
    formData.append('title', input.title);
    formData.append('ctaLabel', input.ctaLabel);
    formData.append('ctaUrl', input.ctaUrl);
    formData.append('imageAlt', input.imageAlt);
    formData.append('titleEn', input.titleEn ?? '');
    formData.append('ctaLabelEn', input.ctaLabelEn ?? '');
    formData.append('imageAltEn', input.imageAltEn ?? '');

    if (input.heroImage) {
      formData.append('heroImage', input.heroImage);
    }

    return this.http.put<LandingContent>(`${this.apiUrl}/admin/landing/hero`, formData);
  }

  listGallery() {
    return this.http.get<LandingGalleryImage[]>(`${this.apiUrl}/landing/gallery`);
  }

  uploadGallery(images: File[]) {
    const formData = new FormData();
    for (const image of images) {
      formData.append('images', image);
    }

    return this.http.post<LandingGalleryImage[]>(`${this.apiUrl}/admin/landing/gallery`, formData);
  }

  getOffer() {
    return this.http.get<LandingOffer>(`${this.apiUrl}/landing/offer`);
  }

  updateOffer(input: UpdateLandingOfferInput) {
    const formData = new FormData();
    formData.append('imageAlt', input.imageAlt);

    if (input.image) {
      formData.append('image', input.image);
    }

    if (input.removeImage) {
      formData.append('removeImage', 'true');
    }

    return this.http.put<LandingOffer>(`${this.apiUrl}/admin/landing/offer`, formData);
  }

  deleteGalleryImage(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/admin/landing/gallery/${id}`);
  }

  /** Wysyłamy pełną listę w docelowej kolejności, nie pojedyncze przesunięcia. */
  reorderGallery(orderedIds: string[]) {
    return this.http.patch<LandingGalleryImage[]>(`${this.apiUrl}/admin/landing/gallery/order`, orderedIds);
  }
}
