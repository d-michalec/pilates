import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { ContactMessage, ContactService } from '../../core/contact.service';
import { AdminHeader } from '../../layout/admin-header/admin-header';

/**
 * Skrzynka wiadomości z formularza kontaktowego.
 *
 * Zgłoszenia idą też e-mailem, ale poczta bywa zawodna - trafia do spamu albo
 * wysyłka się nie udaje. Ta strona jest źródłem prawdy: widać tu wszystko, co
 * przyszło, razem z informacją, czy powiadomienie faktycznie wyszło.
 */
@Component({
  selector: 'app-admin-messages-page',
  imports: [AdminHeader, ButtonModule, CardModule, MessageModule],
  templateUrl: './admin-messages-page.html',
  styleUrl: './admin-messages-page.scss'
})
export class AdminMessagesPage implements OnInit {
  private readonly contactService = inject(ContactService);

  protected readonly messages = signal<ContactMessage[]>([]);
  protected readonly unhandledCount = signal(0);
  protected readonly isLoading = signal(true);
  protected readonly savingId = signal<string | null>(null);
  protected readonly expandedId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly hasMessages = computed(() => this.messages().length > 0);

  ngOnInit() {
    this.load();
  }

  protected isExpanded(message: ContactMessage) {
    return this.expandedId() === message.id;
  }

  protected toggleExpanded(message: ContactMessage) {
    this.expandedId.set(this.isExpanded(message) ? null : message.id);
  }

  protected toggleHandled(message: ContactMessage, event: Event) {
    // Kliknięcie w przycisk nie powinno przy okazji zwijać wiadomości.
    event.stopPropagation();

    this.errorMessage.set(null);
    this.savingId.set(message.id);

    this.contactService
      .setMessageHandled(message.id, !message.handled)
      .pipe(finalize(() => this.savingId.set(null)))
      .subscribe({
        next: (saved) => {
          this.messages.update((lista) => lista.map((pozycja) => (pozycja.id === saved.id ? saved : pozycja)));
          this.unhandledCount.update((ile) => (saved.handled ? ile - 1 : ile + 1));
        },
        error: () => this.errorMessage.set('Nie udało się zmienić oznaczenia wiadomości.')
      });
  }

  protected receivedAt(message: ContactMessage) {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(message.createdAt));
  }

  /** Opis stanu wysyłki powiadomienia - to co innego niż obsługa zgłoszenia. */
  protected deliveryLabel(message: ContactMessage) {
    switch (message.status) {
      case 'SENT':
        return 'powiadomienie wysłane';
      case 'FAILED':
        return 'powiadomienie nie wyszło';
      default:
        return 'powiadomienie w kolejce';
    }
  }

  protected mailtoLink(message: ContactMessage) {
    const temat = message.subject ? `Re: ${message.subject}` : 'Wiadomość z babapilates.pl';
    return `mailto:${message.email}?subject=${encodeURIComponent(temat)}`;
  }

  private load() {
    this.contactService
      .listMessages()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (inbox) => {
          this.messages.set(inbox.messages);
          this.unhandledCount.set(inbox.unhandledCount);
        },
        error: () => this.errorMessage.set('Nie udało się pobrać wiadomości.')
      });
  }
}
