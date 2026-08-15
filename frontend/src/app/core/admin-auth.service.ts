import { HttpClient } from '@angular/common/http';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from './api-url';

const STORAGE_KEY = 'baba-admin-auth';

interface AdminSessionResponse {
  username: string;
}

/**
 * Panel uwierzytelnia się nagłówkiem Basic. Dane trzymamy w sessionStorage, a nie
 * localStorage - znikają po zamknięciu karty, co jest rozsądniejsze dla panelu
 * używanego z laptopa, do którego ktoś jeszcze może mieć dostęp.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  readonly username = signal<string | null>(null);

  private credentials: string | null = null;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    this.restoreFromStorage();
  }

  get authorizationHeader() {
    return this.credentials ? `Basic ${this.credentials}` : null;
  }

  isLoggedIn() {
    return this.credentials !== null;
  }

  logIn(username: string, password: string): Observable<AdminSessionResponse> {
    // Ustawiamy dane przed żądaniem, żeby interceptor dołożył nagłówek do tej próby.
    this.credentials = this.encode(username, password);

    return this.http.get<AdminSessionResponse>(`${this.apiBaseUrl}/api/admin/session`).pipe(
      tap({
        next: (session) => {
          this.username.set(session.username);
          this.persist();
        },
        error: () => this.clear()
      })
    );
  }

  verify(): Observable<AdminSessionResponse> {
    return this.http.get<AdminSessionResponse>(`${this.apiBaseUrl}/api/admin/session`).pipe(
      tap({
        next: (session) => this.username.set(session.username),
        error: () => this.clear()
      })
    );
  }

  logOut() {
    this.clear();
  }

  private clear() {
    this.credentials = null;
    this.username.set(null);
    this.storage?.removeItem(STORAGE_KEY);
  }

  private persist() {
    if (this.credentials) {
      this.storage?.setItem(STORAGE_KEY, this.credentials);
    }
  }

  private restoreFromStorage() {
    const stored = this.storage?.getItem(STORAGE_KEY);
    if (stored) {
      this.credentials = stored;
    }
  }

  private encode(username: string, password: string) {
    // btoa nie radzi sobie ze znakami spoza Latin-1, a hasło może mieć polskie znaki.
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    return btoa(String.fromCharCode(...bytes));
  }

  private get storage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      return this.document.defaultView?.sessionStorage ?? null;
    } catch {
      // Przeglądarka może blokować storage przy zaostrzonych ustawieniach prywatności.
      return null;
    }
  }
}
