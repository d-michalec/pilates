import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';

export interface NewsletterSubscribeRequest {
  email: string;
  name: string;
  consentAccepted: boolean;
  website: string;
}

export interface NewsletterSubscribeResponse {
  id: string | null;
  status: 'LOCAL_ONLY' | 'GETRESPONSE_ACCEPTED' | 'FAILED' | 'ACCEPTED';
}

export interface NewsletterAdminStatus {
  getResponseConfigured: boolean;
  getResponseAdminUrl: string;
  totalSubscriptions: number;
  localOnlySubscriptions: number;
  acceptedByGetResponse: number;
  failedSubscriptions: number;
  rejectedByGetResponse: number;
  unsubscribed: number;
  lastFailureReason: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl}/api`;
  }

  subscribe(input: NewsletterSubscribeRequest) {
    return this.http.post<NewsletterSubscribeResponse>(`${this.apiUrl}/newsletter/subscribe`, input);
  }

  unsubscribe(token: string) {
    return this.http.post<void>(`${this.apiUrl}/newsletter/unsubscribe`, { token });
  }

  getAdminStatus() {
    return this.http.get<NewsletterAdminStatus>(`${this.apiUrl}/admin/newsletter/status`);
  }
}
