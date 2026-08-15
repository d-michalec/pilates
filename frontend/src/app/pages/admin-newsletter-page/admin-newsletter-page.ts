import { Component, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import { AdminHeader } from '../../layout/admin-header/admin-header';
import { NewsletterAdminStatus, NewsletterService } from '../../core/newsletter.service';

@Component({
  selector: 'app-admin-newsletter-page',
  imports: [AdminHeader, ButtonModule, CardModule, MessageModule, TagModule],
  templateUrl: './admin-newsletter-page.html',
  styleUrl: './admin-newsletter-page.scss'
})
export class AdminNewsletterPage implements OnInit {
  protected readonly status = signal<NewsletterAdminStatus | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(private readonly newsletterService: NewsletterService) {}

  ngOnInit() {
    this.loadStatus();
  }

  protected loadStatus() {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.newsletterService
      .getAdminStatus()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (status) => this.status.set(status),
        error: () => this.errorMessage.set('Nie udało się pobrać statusu newslettera.')
      });
  }
}
