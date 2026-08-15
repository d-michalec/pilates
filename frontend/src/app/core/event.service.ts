import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';
import { CreateStudioEventInput, StudioEvent, UpdateStudioEventInput } from './studio-event';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl}/api`;
  }

  list() {
    return this.http.get<StudioEvent[]>(`${this.apiUrl}/events`);
  }

  get(id: string) {
    return this.http.get<StudioEvent>(`${this.apiUrl}/events/${id}`);
  }

  create(input: CreateStudioEventInput) {
    const formData = this.toFormData(input);
    formData.append('image', input.image);

    return this.http.post<StudioEvent>(`${this.apiUrl}/admin/events`, formData);
  }

  update(id: string, input: UpdateStudioEventInput) {
    const formData = this.toFormData(input);

    // Brak pola pliku oznacza dla backendu "zostaw dotychczasowe zdjęcie".
    if (input.image) {
      formData.append('image', input.image);
    }

    if (input.removeHostImage) {
      formData.append('removeHostImage', 'true');
    }

    return this.http.put<StudioEvent>(`${this.apiUrl}/admin/events/${id}`, formData);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/admin/events/${id}`);
  }

  private toFormData(input: UpdateStudioEventInput) {
    const formData = new FormData();
    formData.append('title', input.title);
    formData.append('hostName', input.hostName);
    formData.append('shortDescription', input.shortDescription);
    formData.append('description', input.description);
    formData.append('eventStartAt', input.eventStartAt);

    this.appendOptional(formData, 'hostDescription', input.hostDescription);
    this.appendOptional(formData, 'durationMinutes', input.durationMinutes?.toString() ?? '');
    this.appendOptional(formData, 'location', input.location);
    this.appendOptional(formData, 'capacity', input.capacity?.toString() ?? '');
    this.appendOptional(formData, 'price', input.price);
    this.appendOptional(formData, 'signupUrl', input.signupUrl);

    // Puste tłumaczenie wysyłamy jako pusty ciąg - backend zamienia je na null.
    formData.append('titleEn', input.titleEn ?? '');
    formData.append('shortDescriptionEn', input.shortDescriptionEn ?? '');
    formData.append('descriptionEn', input.descriptionEn ?? '');
    formData.append('hostDescriptionEn', input.hostDescriptionEn ?? '');
    formData.append('locationEn', input.locationEn ?? '');
    formData.append('priceEn', input.priceEn ?? '');

    if (input.hostImage) {
      formData.append('hostImage', input.hostImage);
    }

    return formData;
  }

  private appendOptional(formData: FormData, key: string, value: string) {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      formData.append(key, trimmedValue);
    }
  }
}
