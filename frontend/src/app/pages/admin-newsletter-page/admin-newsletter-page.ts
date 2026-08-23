import { Component, OnInit, computed, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import { AdminHeader } from '../../layout/admin-header/admin-header';
import {
  NewsletterAdminStatus,
  NewsletterService,
  NewsletterSubscription,
  NewsletterSubscriptionStatus
} from '../../core/newsletter.service';

/** Opisy stanów po polsku - w panelu nikt nie powinien widzieć nazw z bazy. */
const OPISY_STANOW: Record<NewsletterSubscriptionStatus, { etykieta: string; kolor: 'success' | 'info' | 'warn' | 'danger' | 'secondary' }> = {
  LOCAL_ONLY: { etykieta: 'Tylko u nas', kolor: 'warn' },
  GETRESPONSE_ACCEPTED: { etykieta: 'W GetResponse', kolor: 'success' },
  GETRESPONSE_REJECTED: { etykieta: 'Odrzucony', kolor: 'danger' },
  FAILED: { etykieta: 'Błąd', kolor: 'danger' },
  UNSUBSCRIBED: { etykieta: 'Wypisany', kolor: 'secondary' }
};

@Component({
  selector: 'app-admin-newsletter-page',
  imports: [AdminHeader, ButtonModule, CardModule, MessageModule, TagModule],
  templateUrl: './admin-newsletter-page.html',
  styleUrl: './admin-newsletter-page.scss'
})
export class AdminNewsletterPage implements OnInit {
  protected readonly status = signal<NewsletterAdminStatus | null>(null);
  protected readonly subscriptions = signal<NewsletterSubscription[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isLoadingList = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly listError = signal<string | null>(null);

  /** Kasowanie jest nieodwracalne, więc wymaga potwierdzenia w drugim kroku. */
  protected readonly confirmingDeleteId = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly hasSubscriptions = computed(() => this.subscriptions().length > 0);

  constructor(private readonly newsletterService: NewsletterService) {}

  ngOnInit() {
    this.loadStatus();
    this.loadSubscriptions();
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

  protected loadSubscriptions() {
    this.listError.set(null);
    this.isLoadingList.set(true);

    this.newsletterService
      .listSubscriptions()
      .pipe(finalize(() => this.isLoadingList.set(false)))
      .subscribe({
        next: (lista) => this.subscriptions.set(lista),
        error: () => this.listError.set('Nie udało się pobrać listy zapisanych.')
      });
  }

  protected opis(status: NewsletterSubscriptionStatus) {
    return OPISY_STANOW[status] ?? { etykieta: status, kolor: 'secondary' as const };
  }

  protected data(wartosc: string | null) {
    if (!wartosc) {
      return '-';
    }
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(wartosc));
  }

  protected askDelete(zapis: NewsletterSubscription) {
    this.confirmingDeleteId.set(zapis.id);
  }

  protected cancelDelete() {
    this.confirmingDeleteId.set(null);
  }

  protected isConfirmingDelete(zapis: NewsletterSubscription) {
    return this.confirmingDeleteId() === zapis.id;
  }

  protected confirmDelete(zapis: NewsletterSubscription) {
    this.listError.set(null);
    this.deletingId.set(zapis.id);

    this.newsletterService
      .deleteSubscription(zapis.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.subscriptions.update((lista) => lista.filter((pozycja) => pozycja.id !== zapis.id));
          this.confirmingDeleteId.set(null);
          // Liczniki na górze strony liczą się po stronie backendu, więc po
          // usunięciu trzeba je pobrać na nowo - inaczej pokazywałyby stan
          // sprzed kasowania.
          this.loadStatus();
        },
        error: (blad) => {
          // Backend odmawia usunięcia, gdy nie udało się zdjąć kontaktu
          // z GetResponse - i wyjaśnia w treści, co z tym zrobić.
          this.listError.set(blad?.error?.message ?? 'Nie udało się usunąć zapisu.');
        }
      });
  }
}
