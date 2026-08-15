import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { AdminHeader } from '../../layout/admin-header/admin-header';
import { LandingOffer } from '../../core/faq';
import { LandingContent, LandingGalleryImage } from '../../core/landing-content';
import { LandingService } from '../../core/landing.service';

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_GALLERY_UPLOAD_SIZE_BYTES = 80 * 1024 * 1024;

@Component({
  selector: 'app-admin-landing-page',
  imports: [AdminHeader, ButtonModule, CardModule, InputTextModule, MessageModule, ReactiveFormsModule],
  templateUrl: './admin-landing-page.html',
  styleUrl: './admin-landing-page.scss'
})
export class AdminLandingPage implements OnInit, OnDestroy {
  protected readonly landing = signal<LandingContent | null>(null);
  protected readonly galleryImages = signal<LandingGalleryImage[]>([]);
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly selectedGalleryImages = signal<File[]>([]);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly galleryPreviewUrls = signal<string[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isUploadingGallery = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly galleryErrorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly gallerySuccessMessage = signal<string | null>(null);
  protected readonly galleryImagePendingDeletion = signal<LandingGalleryImage | null>(null);
  protected readonly isDeletingGalleryImage = signal(false);
  protected readonly isReorderingGallery = signal(false);
  protected readonly offer = signal<LandingOffer | null>(null);
  protected readonly selectedOfferImage = signal<File | null>(null);
  protected readonly offerPreviewUrl = signal<string | null>(null);
  protected readonly isSavingOffer = signal(false);
  protected readonly offerMessage = signal<string | null>(null);
  protected readonly offerErrorMessage = signal<string | null>(null);

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)]
    }),
    ctaLabel: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)]
    }),
    ctaUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)]
    }),
    // Tłumaczenia są opcjonalne - puste pole zapisuje się jako brak tłumaczenia.
    titleEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)]
    }),
    ctaLabelEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(80)]
    }),
    imageAltEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(180)]
    }),

    imageAlt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(180)]
    })
  });

  constructor(private readonly landingService: LandingService) {}

  ngOnInit() {
    this.loadLanding();
    this.loadGallery();
    this.landingService.getOffer().subscribe({
      next: (offer) => this.offer.set(offer),
      error: () => this.offerErrorMessage.set('Nie udało się pobrać tła sekcji oferty.')
    });
  }

  ngOnDestroy() {
    this.revokePreviewUrl();
    this.revokeGalleryPreviewUrls();
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

    if (!this.isSupportedImage(file)) {
      this.selectedImage.set(null);
      this.revokePreviewUrl();
      this.errorMessage.set('Dodaj plik JPG, PNG albo WebP.');
      input.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.selectedImage.set(null);
      this.revokePreviewUrl();
      this.errorMessage.set('Zdjęcie może mieć maksymalnie 20 MB.');
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

  protected onGalleryImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.galleryErrorMessage.set(null);
    this.gallerySuccessMessage.set(null);
    this.revokeGalleryPreviewUrls();

    if (files.length === 0) {
      this.selectedGalleryImages.set([]);
      return;
    }

    if (files.some((file) => !this.isSupportedImage(file))) {
      this.selectedGalleryImages.set([]);
      this.galleryErrorMessage.set('Dodaj tylko pliki JPG, PNG albo WebP.');
      input.value = '';
      return;
    }

    if (files.some((file) => file.size > MAX_IMAGE_SIZE_BYTES)) {
      this.selectedGalleryImages.set([]);
      this.galleryErrorMessage.set('Pojedyncze zdjęcie może mieć maksymalnie 20 MB.');
      input.value = '';
      return;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_GALLERY_UPLOAD_SIZE_BYTES) {
      this.selectedGalleryImages.set([]);
      this.galleryErrorMessage.set('Jednorazowo możesz wrzucić maksymalnie 80 MB zdjęć.');
      input.value = '';
      return;
    }

    this.selectedGalleryImages.set(files);
    this.galleryPreviewUrls.set(files.map((file) => URL.createObjectURL(file)));
  }

  protected clearGalleryImages(input: HTMLInputElement) {
    input.value = '';
    this.selectedGalleryImages.set([]);
    this.revokeGalleryPreviewUrls();
    this.galleryErrorMessage.set(null);
    this.gallerySuccessMessage.set(null);
  }

  protected submit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Uzupełnij wszystkie pola landing hero.');
      return;
    }

    this.isSaving.set(true);
    this.landingService
      .updateHero({
        ...this.form.getRawValue(),
        heroImage: this.selectedImage()
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (landing) => {
          this.landing.set(landing);
          this.selectedImage.set(null);
          this.revokePreviewUrl();
          this.successMessage.set('Landing hero został zapisany.');
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.message ?? 'Nie udało się zapisać landing hero.');
        }
      });
  }

  protected uploadGallery(input: HTMLInputElement) {
    this.galleryErrorMessage.set(null);
    this.gallerySuccessMessage.set(null);

    const images = this.selectedGalleryImages();
    if (images.length === 0) {
      this.galleryErrorMessage.set('Wybierz przynajmniej jedno zdjęcie.');
      return;
    }

    this.isUploadingGallery.set(true);
    this.landingService
      .uploadGallery(images)
      .pipe(finalize(() => this.isUploadingGallery.set(false)))
      .subscribe({
        next: (createdImages) => {
          this.galleryImages.update((currentImages) => [...currentImages, ...createdImages]);
          this.clearGalleryImages(input);
          this.gallerySuccessMessage.set('Zdjęcia zostały dodane do karuzeli.');
        },
        error: (error) => {
          this.galleryErrorMessage.set(error?.error?.message ?? 'Nie udało się dodać zdjęć do karuzeli.');
        }
      });
  }

  protected askForGalleryImageDeletion(galleryImage: LandingGalleryImage) {
    this.galleryErrorMessage.set(null);
    this.gallerySuccessMessage.set(null);
    this.galleryImagePendingDeletion.set(galleryImage);
  }

  protected cancelGalleryImageDeletion() {
    this.galleryImagePendingDeletion.set(null);
  }

  protected confirmGalleryImageDeletion() {
    const galleryImage = this.galleryImagePendingDeletion();
    if (!galleryImage) {
      return;
    }

    this.isDeletingGalleryImage.set(true);
    this.landingService
      .deleteGalleryImage(galleryImage.id)
      .pipe(finalize(() => this.isDeletingGalleryImage.set(false)))
      .subscribe({
        next: () => {
          this.galleryImages.update((images) => images.filter((item) => item.id !== galleryImage.id));
          this.galleryImagePendingDeletion.set(null);
          this.gallerySuccessMessage.set('Zdjęcie zostało usunięte z karuzeli.');
        },
        error: (error) => {
          this.galleryImagePendingDeletion.set(null);
          this.galleryErrorMessage.set(error?.error?.message ?? 'Nie udało się usunąć zdjęcia.');
        }
      });
  }

  protected moveGalleryImage(galleryImage: LandingGalleryImage, offset: -1 | 1) {
    const current = this.galleryImages();
    const index = current.findIndex((item) => item.id === galleryImage.id);
    const targetIndex = index + offset;

    if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
      return;
    }

    const reordered = [...current];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    // Pokazujemy nową kolejność od razu, ale cofamy ją, jeśli zapis się nie powiedzie.
    this.galleryImages.set(reordered);
    this.galleryErrorMessage.set(null);
    this.gallerySuccessMessage.set(null);
    this.isReorderingGallery.set(true);

    this.landingService
      .reorderGallery(reordered.map((item) => item.id))
      .pipe(finalize(() => this.isReorderingGallery.set(false)))
      .subscribe({
        next: (saved) => this.galleryImages.set(saved),
        error: (error) => {
          this.galleryImages.set(current);
          this.galleryErrorMessage.set(error?.error?.message ?? 'Nie udało się zmienić kolejności zdjęć.');
        }
      });
  }

  protected onOfferImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.offerMessage.set(null);
    this.offerErrorMessage.set(null);
    this.revokeOfferPreviewUrl();

    if (!file) {
      this.selectedOfferImage.set(null);
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.selectedOfferImage.set(null);
      this.offerErrorMessage.set('Dodaj plik JPG, PNG albo WebP.');
      input.value = '';
      return;
    }

    this.selectedOfferImage.set(file);
    this.offerPreviewUrl.set(URL.createObjectURL(file));
  }

  protected saveOffer(input: HTMLInputElement, removeImage = false) {
    this.offerMessage.set(null);
    this.offerErrorMessage.set(null);
    this.isSavingOffer.set(true);

    this.landingService
      .updateOffer({
        imageAlt: this.offer()?.imageAlt ?? 'Zajęcia w BABA Studio',
        image: this.selectedOfferImage(),
        removeImage
      })
      .pipe(finalize(() => this.isSavingOffer.set(false)))
      .subscribe({
        next: (offer) => {
          this.offer.set(offer);
          this.selectedOfferImage.set(null);
          this.revokeOfferPreviewUrl();
          input.value = '';
          this.offerMessage.set(removeImage ? 'Tło zostało usunięte.' : 'Tło sekcji zostało zapisane.');
        },
        error: (error) => this.offerErrorMessage.set(error?.error?.message ?? 'Nie udało się zapisać tła sekcji.')
      });
  }

  protected offerImageUrl() {
    const image = this.offer()?.image;
    return image?.thumbnailUrl || image?.url || null;
  }

  private revokeOfferPreviewUrl() {
    const previewUrl = this.offerPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.offerPreviewUrl.set(null);
    }
  }

  private loadLanding() {
    this.isLoading.set(true);
    this.landingService
      .get()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (landing) => {
          this.landing.set(landing);
          this.form.patchValue({
            title: landing.title,
            ctaLabel: landing.ctaLabel,
            ctaUrl: landing.ctaUrl,
            imageAlt: landing.imageAlt,
            titleEn: landing.titleEn ?? '',
            ctaLabelEn: landing.ctaLabelEn ?? '',
            imageAltEn: landing.imageAltEn ?? ''
          });
        },
        error: () => this.errorMessage.set('Nie udało się pobrać danych landing page.')
      });
  }

  private loadGallery() {
    this.landingService
      .listGallery()
      .subscribe({
        next: (images) => this.galleryImages.set(images),
        error: () => this.galleryErrorMessage.set('Nie udało się pobrać zdjęć karuzeli.')
      });
  }

  private revokePreviewUrl() {
    const previewUrl = this.previewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.previewUrl.set(null);
    }
  }

  private revokeGalleryPreviewUrls() {
    for (const previewUrl of this.galleryPreviewUrls()) {
      URL.revokeObjectURL(previewUrl);
    }
    this.galleryPreviewUrls.set([]);
  }

  private isSupportedImage(file: File) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  }
}
