import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { BarContent, DAY_NAMES, SiteSettings, dayName } from '../../core/venue';
import { VenueService } from '../../core/venue.service';
import { AdminHeader } from '../../layout/admin-header/admin-header';

@Component({
  selector: 'app-admin-bar-page',
  imports: [AdminHeader, ButtonModule, CardModule, InputTextModule, MessageModule, ReactiveFormsModule, TextareaModule],
  templateUrl: './admin-bar-page.html',
  styleUrl: './admin-bar-page.scss'
})
export class AdminBarPage implements OnInit, OnDestroy {
  protected readonly dayNames = DAY_NAMES;
  protected readonly bar = signal<BarContent | null>(null);
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isSavingHours = signal(false);
  protected readonly isSavingSettings = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly hoursMessage = signal<string | null>(null);
  protected readonly hoursErrorMessage = signal<string | null>(null);
  protected readonly settingsMessage = signal<string | null>(null);
  protected readonly settingsErrorMessage = signal<string | null>(null);

  protected readonly form = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(4000)]
    }),
    imageAlt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(180)]
    }),
    descriptionEn: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(4000)] }),
    imageAltEn: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(180)] })
  });

  /** Siedem wierszy, po jednym na dzień tygodnia. Kolejność odpowiada numerom 1-7. */
  protected readonly hoursForm = new FormArray(
    Array.from({ length: 7 }, () =>
      new FormGroup({
        opensAt: new FormControl('', { nonNullable: true }),
        closesAt: new FormControl('', { nonNullable: true }),
        closed: new FormControl(false, { nonNullable: true })
      })
    )
  );

  protected readonly settingsForm = new FormGroup({
    instagramUrl: new FormControl('', { nonNullable: true }),
    facebookUrl: new FormControl('', { nonNullable: true })
  });

  constructor(private readonly venueService: VenueService) {}

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.revokePreviewUrl();
  }

  protected dayLabel(index: number) {
    return dayName(index + 1);
  }

  protected onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage.set(null);
    this.successMessage.set(null);

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
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Uzupełnij opis i opis zdjęcia.');
      return;
    }

    this.isSaving.set(true);
    this.venueService
      .updateBar({ ...this.form.getRawValue(), image: this.selectedImage() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (saved) => {
          this.bar.set(saved);
          this.clearImage(imageInput);
          this.successMessage.set('Treść strony baru została zapisana.');
        },
        error: (error) => this.errorMessage.set(error?.error?.message ?? 'Nie udało się zapisać treści.')
      });
  }

  protected saveHours() {
    this.hoursMessage.set(null);
    this.hoursErrorMessage.set(null);

    const days = this.hoursForm.controls.map((group, index) => {
      const value = group.getRawValue();
      return {
        dayOfWeek: index + 1,
        opensAt: value.closed ? null : value.opensAt || null,
        closesAt: value.closed ? null : value.closesAt || null,
        closed: value.closed
      };
    });

    const incomplete = days.find((day) => !day.closed && (!day.opensAt || !day.closesAt));
    if (incomplete) {
      this.hoursErrorMessage.set(
        `Uzupełnij godziny dla ${dayName(incomplete.dayOfWeek)} albo oznacz ten dzień jako zamknięty.`
      );
      return;
    }

    this.isSavingHours.set(true);
    this.venueService
      .updateBarOpeningHours(days)
      .pipe(finalize(() => this.isSavingHours.set(false)))
      .subscribe({
        next: (saved) => {
          this.bar.set(saved);
          this.hoursMessage.set('Godziny otwarcia zostały zapisane.');
        },
        error: (error) =>
          this.hoursErrorMessage.set(error?.error?.message ?? 'Nie udało się zapisać godzin otwarcia.')
      });
  }

  protected saveSettings() {
    this.settingsMessage.set(null);
    this.settingsErrorMessage.set(null);

    const { instagramUrl, facebookUrl } = this.settingsForm.getRawValue();
    this.isSavingSettings.set(true);

    this.venueService
      .updateSettings({ instagramUrl: instagramUrl.trim() || null, facebookUrl: facebookUrl.trim() || null })
      .pipe(finalize(() => this.isSavingSettings.set(false)))
      .subscribe({
        next: (settings) => this.applySettings(settings, 'Linki zostały zapisane.'),
        error: (error) =>
          this.settingsErrorMessage.set(
            error?.error?.message ?? 'Nie udało się zapisać linków. Adres musi zaczynać się od https://.'
          )
      });
  }

  protected currentImageUrl() {
    const image = this.bar()?.image;
    return image?.thumbnailUrl || image?.url || null;
  }

  private load() {
    this.venueService
      .getBar()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (bar) => {
          this.bar.set(bar);
          this.form.setValue({
            description: bar.description,
            imageAlt: bar.imageAlt,
            descriptionEn: bar.descriptionEn ?? '',
            imageAltEn: bar.imageAltEn ?? ''
          });

          for (const day of bar.openingHours) {
            this.hoursForm.at(day.dayOfWeek - 1).setValue({
              opensAt: day.opensAt ?? '',
              closesAt: day.closesAt ?? '',
              closed: day.closed
            });
          }
        },
        error: () => this.errorMessage.set('Nie udało się pobrać treści strony baru.')
      });

    this.venueService.getSettings().subscribe({
      next: (settings) => this.applySettings(settings, null),
      error: () => this.settingsErrorMessage.set('Nie udało się pobrać linków.')
    });
  }

  private applySettings(settings: SiteSettings, message: string | null) {
    this.settingsForm.setValue({
      instagramUrl: settings.instagramUrl ?? '',
      facebookUrl: settings.facebookUrl ?? ''
    });

    if (message) {
      this.settingsMessage.set(message);
    }
  }

  private revokePreviewUrl() {
    const previewUrl = this.previewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.previewUrl.set(null);
    }
  }
}
