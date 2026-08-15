import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { ContactPageContent, ContactService } from '../../core/contact.service';
import { SiteSettings } from '../../core/venue';
import { VenueService } from '../../core/venue.service';
import { AdminHeader } from '../../layout/admin-header/admin-header';

/**
 * Wszystko, przez co studio jest osiągalne z zewnątrz: zdjęcie strony kontaktu
 * i adresy profili w social mediach.
 *
 * Linki do profili stały wcześniej na stronie Baru, bo tam powstały razem
 * z godzinami kawiarni. Dotyczą jednak stopki na całej stronie, więc nikt by ich
 * tam nie szukał.
 */
@Component({
  selector: 'app-admin-contact-page',
  imports: [AdminHeader, ButtonModule, CardModule, InputTextModule, MessageModule, ReactiveFormsModule],
  templateUrl: './admin-contact-page.html',
  styleUrl: './admin-contact-page.scss'
})
export class AdminContactPage implements OnInit, OnDestroy {
  private readonly contactService = inject(ContactService);
  private readonly venueService = inject(VenueService);

  protected readonly page = signal<ContactPageContent | null>(null);
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly shouldRemoveImage = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly isSavingSettings = signal(false);
  protected readonly settingsMessage = signal<string | null>(null);
  protected readonly settingsErrorMessage = signal<string | null>(null);

  protected readonly settingsForm = new FormGroup({
    instagramUrl: new FormControl('', { nonNullable: true }),
    facebookUrl: new FormControl('', { nonNullable: true })
  });

  protected readonly form = new FormGroup({
    imageAlt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(180)]
    }),
    imageAltEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(180)]
    })
  });

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.revokePreviewUrl();
  }

  protected currentImageUrl() {
    return this.page()?.image?.url ?? null;
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

    // Wybór nowego pliku unieważnia wcześniejszą decyzję o usunięciu zdjęcia.
    this.shouldRemoveImage.set(false);
    this.selectedImage.set(file);
    this.revokePreviewUrl();
    this.previewUrl.set(URL.createObjectURL(file));
  }

  protected clearImage(input: HTMLInputElement) {
    input.value = '';
    this.selectedImage.set(null);
    this.revokePreviewUrl();
  }

  protected markImageForRemoval(input: HTMLInputElement) {
    this.clearImage(input);
    this.shouldRemoveImage.set(true);
  }

  protected cancelImageRemoval() {
    this.shouldRemoveImage.set(false);
  }

  protected submit(imageInput: HTMLInputElement) {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Uzupełnij opis zdjęcia.');
      return;
    }

    this.isSaving.set(true);
    this.contactService
      .updatePage({
        ...this.form.getRawValue(),
        image: this.selectedImage(),
        removeImage: this.shouldRemoveImage()
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (saved) => {
          this.page.set(saved);
          this.shouldRemoveImage.set(false);
          this.clearImage(imageInput);
          this.successMessage.set('Zmiany zostały zapisane.');
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.message ?? 'Nie udało się zapisać zmian.');
        }
      });
  }

  protected saveSettings() {
    this.settingsMessage.set(null);
    this.settingsErrorMessage.set(null);

    const { instagramUrl, facebookUrl } = this.settingsForm.getRawValue();
    this.isSavingSettings.set(true);

    // Puste pole zapisujemy jako brak wartości - stopka ukrywa wtedy ikonę.
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

  private applySettings(settings: SiteSettings, message: string | null) {
    this.settingsForm.setValue({
      instagramUrl: settings.instagramUrl ?? '',
      facebookUrl: settings.facebookUrl ?? ''
    });

    if (message) {
      this.settingsMessage.set(message);
    }
  }

  private load() {
    this.contactService
      .getPage()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (page) => {
          this.page.set(page);
          this.form.setValue({
            imageAlt: page.imageAlt,
            imageAltEn: page.imageAltEn ?? ''
          });
        },
        error: () => this.errorMessage.set('Nie udało się pobrać danych strony kontaktu.')
      });

    this.venueService.getSettings().subscribe({
      next: (settings) => this.applySettings(settings, null),
      error: () => this.settingsErrorMessage.set('Nie udało się pobrać linków.')
    });
  }

  /** Adresy blob trzeba zwolnić ręcznie, inaczej podgląd zostaje w pamięci. */
  private revokePreviewUrl() {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrl.set(null);
    }
  }
}
