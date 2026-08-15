import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';
import { CreatePilatesClassInput, PilatesClass, UpdatePilatesClassInput } from './pilates-class';

@Injectable({
  providedIn: 'root'
})
export class PilatesClassService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl}/api`;
  }

  list() {
    return this.http.get<PilatesClass[]>(`${this.apiUrl}/classes`);
  }

  create(input: CreatePilatesClassInput) {
    return this.http.post<PilatesClass>(`${this.apiUrl}/admin/classes`, this.toFormData(input));
  }

  update(id: string, input: UpdatePilatesClassInput) {
    const formData = this.toFormData(input);

    if (input.removeImage) {
      formData.append('removeImage', 'true');
    }

    return this.http.put<PilatesClass>(`${this.apiUrl}/admin/classes/${id}`, formData);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/admin/classes/${id}`);
  }

  /** Wysyłamy pełną listę w docelowej kolejności, nie pojedyncze przesunięcia. */
  reorder(orderedIds: string[]) {
    return this.http.patch<PilatesClass[]>(`${this.apiUrl}/admin/classes/order`, orderedIds);
  }

  private toFormData(input: CreatePilatesClassInput) {
    const formData = new FormData();
    formData.append('title', input.title);
    formData.append('levelLabel', input.levelLabel);
    formData.append('description', input.description);

    const signupUrl = input.signupUrl.trim();
    if (signupUrl) {
      formData.append('signupUrl', signupUrl);
    }

    // Puste tłumaczenie wysyłamy jako pusty ciąg - backend zamienia je na null.
    formData.append('titleEn', input.titleEn ?? '');
    formData.append('levelLabelEn', input.levelLabelEn ?? '');
    formData.append('descriptionEn', input.descriptionEn ?? '');

    // Brak pola pliku oznacza dla backendu "zostaw dotychczasowe zdjęcie".
    if (input.image) {
      formData.append('image', input.image);
    }

    return formData;
  }
}
