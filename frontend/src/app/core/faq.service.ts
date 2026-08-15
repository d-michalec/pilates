import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';
import { FaqEntry, FaqEntryInput } from './faq';

@Injectable({
  providedIn: 'root'
})
export class FaqService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl}/api`;
  }

  list() {
    return this.http.get<FaqEntry[]>(`${this.apiUrl}/faq`);
  }

  create(input: FaqEntryInput) {
    return this.http.post<FaqEntry>(`${this.apiUrl}/admin/faq`, input);
  }

  update(id: string, input: FaqEntryInput) {
    return this.http.put<FaqEntry>(`${this.apiUrl}/admin/faq/${id}`, input);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/admin/faq/${id}`);
  }

  /** Wysyłamy pełną listę w docelowej kolejności, nie pojedyncze przesunięcia. */
  reorder(orderedIds: string[]) {
    return this.http.patch<FaqEntry[]>(`${this.apiUrl}/admin/faq/order`, orderedIds);
  }
}
