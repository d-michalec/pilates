import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';
import { LegalDocument, LegalDocumentInput, LegalDocumentSummary } from './legal-document';

@Injectable({
  providedIn: 'root'
})
export class LegalService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl}/api`;
  }

  list() {
    return this.http.get<LegalDocumentSummary[]>(`${this.apiUrl}/legal`);
  }

  get(docKey: string) {
    return this.http.get<LegalDocument>(`${this.apiUrl}/legal/${docKey}`);
  }

  /** Dokument zapisuje się jako całość - nagłówek razem z pełną listą sekcji. */
  update(docKey: string, input: LegalDocumentInput) {
    return this.http.put<LegalDocument>(`${this.apiUrl}/admin/legal/${docKey}`, input);
  }
}
