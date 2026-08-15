import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { FaqEntry } from '../../core/faq';
import { FaqService } from '../../core/faq.service';
import { AdminHeader } from '../../layout/admin-header/admin-header';

@Component({
  selector: 'app-admin-faq-page',
  imports: [AdminHeader, ButtonModule, CardModule, InputTextModule, MessageModule, ReactiveFormsModule, TextareaModule],
  templateUrl: './admin-faq-page.html',
  styleUrl: './admin-faq-page.scss'
})
export class AdminFaqPage implements OnInit {
  protected readonly entries = signal<FaqEntry[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly reorderingId = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  /** Null oznacza tryb dodawania, identyfikator - tryb edycji istniejącego pytania. */
  protected readonly editedEntryId = signal<string | null>(null);
  protected readonly entryPendingDeletion = signal<FaqEntry | null>(null);

  protected readonly editedEntry = computed(() => {
    const id = this.editedEntryId();
    return id === null ? null : (this.entries().find((entry) => entry.id === id) ?? null);
  });
  protected readonly isEditing = computed(() => this.editedEntryId() !== null);

  protected readonly form = new FormGroup({
    question: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(400)]
    }),
    answer: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(4000)]
    }),
    questionEn: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(400)] }),
    answerEn: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(4000)] })
  });

  /** Ile pytań czeka na tłumaczenie - właścicielka widzi to od razu na liście. */
  protected readonly missingTranslations = computed(
    () => this.entries().filter((entry) => !entry.questionEn || !entry.answerEn).length
  );

  constructor(private readonly faqService: FaqService) {}

  ngOnInit() {
    this.load();
  }

  protected startEditing(entry: FaqEntry) {
    this.clearMessages();
    this.editedEntryId.set(entry.id);
    this.form.setValue({
      question: entry.question,
      answer: entry.answer,
      questionEn: entry.questionEn ?? '',
      answerEn: entry.answerEn ?? ''
    });
  }

  protected cancelEditing() {
    this.editedEntryId.set(null);
    this.form.reset();
    this.clearMessages();
  }

  protected submit() {
    this.clearMessages();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Uzupełnij pytanie i odpowiedź.');
      return;
    }

    const payload = this.form.getRawValue();
    const editedId = this.editedEntryId();
    this.isSaving.set(true);

    const request = editedId ? this.faqService.update(editedId, payload) : this.faqService.create(payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        if (editedId) {
          this.entries.update((entries) => entries.map((entry) => (entry.id === editedId ? saved : entry)));
          this.successMessage.set('Zmiany zostały zapisane.');
        }
        else {
          this.entries.update((entries) => [...entries, saved]);
          this.successMessage.set('Pytanie zostało dodane.');
        }

        this.editedEntryId.set(null);
        this.form.reset();
      },
      error: (error) => this.errorMessage.set(error?.error?.message ?? 'Nie udało się zapisać pytania.')
    });
  }

  protected askForDeletion(entry: FaqEntry) {
    this.clearMessages();
    this.entryPendingDeletion.set(entry);
  }

  protected cancelDeletion() {
    this.entryPendingDeletion.set(null);
  }

  protected confirmDeletion() {
    const entry = this.entryPendingDeletion();
    if (!entry) {
      return;
    }

    this.isSaving.set(true);
    this.faqService
      .delete(entry.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.entries.update((entries) => entries.filter((item) => item.id !== entry.id));
          this.entryPendingDeletion.set(null);
          this.successMessage.set('Pytanie zostało usunięte.');

          if (this.editedEntryId() === entry.id) {
            this.cancelEditing();
          }
        },
        error: () => {
          this.entryPendingDeletion.set(null);
          this.errorMessage.set('Nie udało się usunąć pytania.');
        }
      });
  }

  protected move(entry: FaqEntry, offset: -1 | 1) {
    const current = this.entries();
    const index = current.findIndex((item) => item.id === entry.id);
    const targetIndex = index + offset;

    if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
      return;
    }

    const reordered = [...current];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    // Pokazujemy nową kolejność od razu, ale cofamy ją, jeśli zapis się nie powiedzie.
    this.entries.set(reordered);
    this.clearMessages();
    this.reorderingId.set(entry.id);

    this.faqService
      .reorder(reordered.map((item) => item.id))
      .pipe(finalize(() => this.reorderingId.set(null)))
      .subscribe({
        next: (saved) => this.entries.set(saved),
        error: () => {
          this.entries.set(current);
          this.errorMessage.set('Nie udało się zmienić kolejności.');
        }
      });
  }

  protected isFirst(entry: FaqEntry) {
    return this.entries()[0]?.id === entry.id;
  }

  protected isLast(entry: FaqEntry) {
    const entries = this.entries();
    return entries[entries.length - 1]?.id === entry.id;
  }

  private load() {
    this.faqService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (entries) => this.entries.set(entries),
        error: () => this.errorMessage.set('Nie udało się pobrać pytań.')
      });
  }

  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
