import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';
import {
  BarContent,
  BarOpeningDay,
  SaunaContent,
  SaunaSessionItem,
  SiteSettings,
  UpdateBarInput,
  UpdateSaunaInput
} from './venue';

/** Sauna, bar i ustawienia globalne - trzy małe zasoby o tym samym wzorcu obsługi. */
@Injectable({
  providedIn: 'root'
})
export class VenueService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl}/api`;
  }

  getSauna() {
    return this.http.get<SaunaContent>(`${this.apiUrl}/sauna`);
  }

  updateSauna(input: UpdateSaunaInput) {
    const formData = new FormData();
    formData.append('description', input.description);
    formData.append('ctaLabel', input.ctaLabel);
    formData.append('ctaUrl', input.ctaUrl);
    formData.append('imageAlt', input.imageAlt);
    formData.append('descriptionEn', input.descriptionEn);
    formData.append('ctaLabelEn', input.ctaLabelEn);
    formData.append('imageAltEn', input.imageAltEn);

    // Brak pola pliku oznacza dla backendu "zostaw dotychczasowe zdjęcie".
    if (input.image) {
      formData.append('image', input.image);
    }

    return this.http.put<SaunaContent>(`${this.apiUrl}/admin/sauna`, formData);
  }

  listSaunaSessions() {
    return this.http.get<SaunaSessionItem[]>(`${this.apiUrl}/admin/sauna/sessions`);
  }

  addSaunaSession(dayOfWeek: number, time: string) {
    const formData = new FormData();
    formData.append('dayOfWeek', dayOfWeek.toString());
    formData.append('time', time);

    return this.http.post<SaunaSessionItem[]>(`${this.apiUrl}/admin/sauna/sessions`, formData);
  }

  deleteSaunaSession(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/admin/sauna/sessions/${id}`);
  }

  getBar() {
    return this.http.get<BarContent>(`${this.apiUrl}/bar`);
  }

  updateBar(input: UpdateBarInput) {
    const formData = new FormData();
    formData.append('description', input.description);
    formData.append('imageAlt', input.imageAlt);
    formData.append('descriptionEn', input.descriptionEn);
    formData.append('imageAltEn', input.imageAltEn);

    if (input.image) {
      formData.append('image', input.image);
    }

    return this.http.put<BarContent>(`${this.apiUrl}/admin/bar`, formData);
  }

  /** Wysyłamy wszystkie siedem dni naraz, żeby nie zostawić tabeli w stanie pośrednim. */
  updateBarOpeningHours(days: BarOpeningDay[]) {
    return this.http.put<BarContent>(`${this.apiUrl}/admin/bar/hours`, days);
  }

  getSettings() {
    return this.http.get<SiteSettings>(`${this.apiUrl}/settings`);
  }

  updateSettings(settings: SiteSettings) {
    return this.http.put<SiteSettings>(`${this.apiUrl}/admin/settings`, settings);
  }
}
