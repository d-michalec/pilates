import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { DAY_NAMES, SaunaContent, SaunaSessionItem, dayName } from '../../core/venue';
import { VenueService } from '../../core/venue.service';
import { AdminHeader } from '../../layout/admin-header/admin-header';

interface SessionsByDay {
  dayOfWeek: number;
  label: string;
  sessions: SaunaSessionItem[];
}

@Component({
  selector: 'app-admin-sauna-page',
  imports: [AdminHeader, ButtonModule, CardModule, InputTextModule, MessageModule, ReactiveFormsModule, TextareaModule],
  templateUrl: './admin-sauna-page.html',
  styleUrl: './admin-sauna-page.scss'
})
export class AdminSaunaPage implements OnInit, OnDestroy {
  protected readonly dayNames = DAY_NAMES;
  protected readonly sauna = signal<SaunaContent | null>(null);
  protected readonly sessions = signal<SaunaSessionItem[]>([]);
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isSavingSession = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly sessionErrorMessage = signal<string | null>(null);

  /** Grupujemy po dniach, żeby lista w panelu czytała się jak plan tygodnia. */
  protected readonly sessionsByDay = computed<SessionsByDay[]>(() => {
    const grouped: SessionsByDay[] = [];

    for (let day = 1; day <= 7; day++) {
      const sessions = this.sessions().filter((session) => session.dayOfWeek === day);
      if (sessions.length > 0) {
        grouped.push({ dayOfWeek: day, label: dayName(day), sessions });
      }
    }

    return grouped;
  });

  protected readonly form = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(4000)]
    }),
    ctaLabel: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)]
    }),
    ctaUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)]
    }),
    imageAlt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(180)]
    }),
    descriptionEn: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(4000)] }),
    ctaLabelEn: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(80)] }),
    imageAltEn: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(180)] })
  });

  protected readonly sessionForm = new FormGroup({
    dayOfWeek: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required] }),
    time: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(private readonly venueService: VenueService) {}

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.revokePreviewUrl();
  }

  protected onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.clearMessages();

    if (!file) {
      this.selectedImage.set(null);
      this.revokePreviewUrl();
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.selectedImage.set(null);
      this.revokePreviewUrl();
      this.errorMessage.set('Dodaj plik JPG, PNG albo WebP.');
      input.value = '';
      return;
    }

    this.selectedImage.set(file);
    this.revokePreviewUrl();
    this.previewUrl.set(URL.createObjectURL(file));
  }

  protected clearImage(input: HTMLInputElement) {
    input.value = '';
    this.selectedImage.set(null);
    this.revokePreviewUrl();
  }

  protected submit(imageInput: HTMLInputElement) {
    this.clearMessages();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Uzupełnij wszystkie pola.');
      return;
    }

    this.isSaving.set(true);
    this.venueService
      .updateSauna({ ...this.form.getRawValue(), image: this.selectedImage() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (saved) => {
          this.sauna.set(saved);
          this.clearImage(imageInput);
          this.successMessage.set('Treść strony sauny została zapisana.');
        },
        error: (error) => this.errorMessage.set(error?.error?.message ?? 'Nie udało się zapisać treści.')
      });
  }

  protected addSession() {
    this.sessionErrorMessage.set(null);

    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      this.sessionErrorMessage.set('Wybierz dzień i podaj godzinę.');
      return;
    }

    const { dayOfWeek, time } = this.sessionForm.getRawValue();
    this.isSavingSession.set(true);

    this.venueService
      .addSaunaSession(dayOfWeek, time)
      .pipe(finalize(() => this.isSavingSession.set(false)))
      .subscribe({
        next: (sessions) => {
          this.sessions.set(sessions);
          this.sessionForm.patchValue({ time: '' });
          this.reloadPublicPreview();
        },
        error: (error) =>
          this.sessionErrorMessage.set(
            error?.status === 409 ? 'Ten seans jest już w planie.' : 'Nie udało się dodać seansu.'
          )
      });
  }

  protected deleteSession(session: SaunaSessionItem) {
    this.sessionErrorMessage.set(null);
    this.isSavingSession.set(true);

    this.venueService
      .deleteSaunaSession(session.id)
      .pipe(finalize(() => this.isSavingSession.set(false)))
      .subscribe({
        next: () => {
          this.sessions.update((items) => items.filter((item) => item.id !== session.id));
          this.reloadPublicPreview();
        },
        error: () => this.sessionErrorMessage.set('Nie udało się usunąć seansu.')
      });
  }

  protected currentImageUrl() {
    const image = this.sauna()?.image;
    return image?.thumbnailUrl || image?.url || null;
  }

  private load() {
    this.venueService
      .getSauna()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (sauna) => {
          this.sauna.set(sauna);
          this.form.setValue({
            description: sauna.description,
            ctaLabel: sauna.ctaLabel,
            ctaUrl: sauna.ctaUrl,
            imageAlt: sauna.imageAlt,
            descriptionEn: sauna.descriptionEn ?? '',
            ctaLabelEn: sauna.ctaLabelEn ?? '',
            imageAltEn: sauna.imageAltEn ?? ''
          });
        },
        error: () => this.errorMessage.set('Nie udało się pobrać treści strony sauny.')
      });

    this.venueService.listSaunaSessions().subscribe({
      next: (sessions) => this.sessions.set(sessions),
      error: () => this.sessionErrorMessage.set('Nie udało się pobrać planu seansów.')
    });
  }

  /** Podgląd grup w karcie treści pochodzi z publicznego endpointu, więc go odświeżamy. */
  private reloadPublicPreview() {
    this.venueService.getSauna().subscribe({ next: (sauna) => this.sauna.set(sauna) });
  }

  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private revokePreviewUrl() {
    const previewUrl = this.previewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.previewUrl.set(null);
    }
  }
}
