import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';

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
}
