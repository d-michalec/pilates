import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';
import { MediaAsset } from './landing-content';

export interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website: string;
}

export interface ContactResponse {
  id: string;
  status: 'NEW' | 'SENT' | 'FAILED';
}

/** Treść strony kontaktu redagowana z panelu - w praktyce samo zdjęcie. */
export interface ContactPageContent {
  imageAlt: string;
  imageAltEn: string | null;
  image: MediaAsset | null;
}

export interface UpdateContactPageInput {
  imageAlt: string;
  imageAltEn?: string;
  image?: File | null;
  removeImage?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl}/api`;
  }

  send(input: ContactRequest) {
    return this.http.post<ContactResponse>(`${this.apiUrl}/contact`, input);
  }

  getPage() {
    return this.http.get<ContactPageContent>(`${this.apiUrl}/contact-page`);
  }

  updatePage(input: UpdateContactPageInput) {
    const formData = new FormData();
    formData.append('imageAlt', input.imageAlt);
    formData.append('imageAltEn', input.imageAltEn ?? '');

    // Brak pola pliku oznacza dla backendu "zostaw dotychczasowe zdjęcie".
    if (input.image) {
      formData.append('image', input.image);
    }

    if (input.removeImage) {
      formData.append('removeImage', 'true');
    }

    return this.http.put<ContactPageContent>(`${this.apiUrl}/admin/contact-page`, formData);
  }
}
