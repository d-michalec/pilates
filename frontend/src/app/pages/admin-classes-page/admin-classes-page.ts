import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { AdminHeader } from '../../layout/admin-header/admin-header';
import { PilatesClass } from '../../core/pilates-class';
import { PilatesClassService } from '../../core/pilates-class.service';

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-admin-classes-page',
  imports: [AdminHeader, ButtonModule, CardModule, InputTextModule, MessageModule, ReactiveFormsModule, TextareaModule],
  templateUrl: './admin-classes-page.html',
  styleUrl: './admin-classes-page.scss'
})
export class AdminClassesPage implements OnInit, OnDestroy {
  protected readonly classes = signal<PilatesClass[]>([]);
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  /** Null oznacza tryb dodawania, identyfikator - tryb edycji istniejących zajęć. */
  protected readonly editedClassId = signal<string | null>(null);
  protected readonly classPendingDeletion = signal<PilatesClass | null>(null);
  protected readonly reorderingId = signal<string | null>(null);
  /** Zaznaczone przez użytkownika usunięcie obecnego zdjęcia w trybie edycji. */
  protected readonly shouldRemoveImage = signal(false);

  protected readonly editedClass = computed(() => {
    const id = this.editedClassId();
    return id === null ? null : (this.classes().find((item) => item.id === id) ?? null);
  });
  protected readonly isEditing = computed(() => this.editedClassId() !== null);

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(180)]
    }),
    levelLabel: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1800)]
    }),
    signupUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)]
    }),

    // Tłumaczenia są opcjonalne - puste pole zapisuje się jako brak tłumaczenia.
    titleEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(180)]
    }),
    levelLabelEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)]
    }),
    descriptionEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1800)]
    })
  });

  constructor(private readonly pilatesClassService: PilatesClassService) {}

  ngOnInit() {
    this.loadClasses();
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

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.rejectFile(input, 'Dodaj plik JPG, PNG albo WebP.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.rejectFile(input, 'Zdjęcie może mieć maksymalnie 20 MB.');
      return;
    }

    this.selectedImage.set(file);
    this.shouldRemoveImage.set(false);
    this.revokePreviewUrl();
    this.previewUrl.set(URL.createObjectURL(file));
  }

  protected clearImage(input: HTMLInputElement) {
    input.value = '';
    this.selectedImage.set(null);
    this.revokePreviewUrl();
  }

  protected markImageForRemoval() {
    this.shouldRemoveImage.set(true);
    this.selectedImage.set(null);
    this.revokePreviewUrl();
  }

  protected startEditing(pilatesClass: PilatesClass, imageInput: HTMLInputElement) {
    this.clearMessages();
    this.editedClassId.set(pilatesClass.id);
    this.shouldRemoveImage.set(false);
    this.form.setValue({
      title: pilatesClass.title,
      levelLabel: pilatesClass.levelLabel,
      description: pilatesClass.description,
      signupUrl: pilatesClass.signupUrl ?? '',
      titleEn: pilatesClass.titleEn ?? '',
      levelLabelEn: pilatesClass.levelLabelEn ?? '',
      descriptionEn: pilatesClass.descriptionEn ?? ''
    });
    this.clearImage(imageInput);
  }

  protected cancelEditing(imageInput: HTMLInputElement) {
    this.editedClassId.set(null);
    this.shouldRemoveImage.set(false);
    this.form.reset();
    this.clearImage(imageInput);
    this.clearMessages();
  }

  protected submit(imageInput: HTMLInputElement) {
    this.clearMessages();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Uzupełnij wymagane pola.');
      return;
    }

    const payload = { ...this.form.getRawValue(), image: this.selectedImage() };
    const editedId = this.editedClassId();

    this.isSaving.set(true);

    const request = editedId
      ? this.pilatesClassService.update(editedId, { ...payload, removeImage: this.shouldRemoveImage() })
      : this.pilatesClassService.create(payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        if (editedId) {
          this.classes.update((classes) => classes.map((item) => (item.id === editedId ? saved : item)));
          this.successMessage.set('Zmiany zostały zapisane.');
        }
        else {
          this.classes.update((classes) => [...classes, saved]);
          this.successMessage.set('Zajęcia zostały dodane.');
        }

        this.editedClassId.set(null);
        this.shouldRemoveImage.set(false);
        this.form.reset();
        this.clearImage(imageInput);
      },
      error: (error) => this.errorMessage.set(this.toMessage(error, 'Nie udało się zapisać zajęć.'))
    });
  }

  protected askForDeletion(pilatesClass: PilatesClass) {
    this.clearMessages();
    this.classPendingDeletion.set(pilatesClass);
  }

  protected cancelDeletion() {
    this.classPendingDeletion.set(null);
  }

  protected confirmDeletion(imageInput: HTMLInputElement) {
    const pilatesClass = this.classPendingDeletion();
    if (!pilatesClass) {
      return;
    }

    this.isSaving.set(true);
    this.pilatesClassService
      .delete(pilatesClass.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.classes.update((classes) => classes.filter((item) => item.id !== pilatesClass.id));
          this.classPendingDeletion.set(null);
          this.successMessage.set(`Usunięto zajęcia ${pilatesClass.title}.`);

          if (this.editedClassId() === pilatesClass.id) {
            this.cancelEditing(imageInput);
          }
        },
        error: (error) => {
          this.classPendingDeletion.set(null);
          this.errorMessage.set(this.toMessage(error, 'Nie udało się usunąć zajęć.'));
        }
      });
  }

  protected move(pilatesClass: PilatesClass, offset: -1 | 1) {
    const current = this.classes();
    const index = current.findIndex((item) => item.id === pilatesClass.id);
    const targetIndex = index + offset;

    if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
      return;
    }

    const reordered = [...current];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    // Pokazujemy nową kolejność od razu, ale cofamy ją, jeśli zapis się nie powiedzie.
    this.classes.set(reordered);
    this.clearMessages();
    this.reorderingId.set(pilatesClass.id);

    this.pilatesClassService
      .reorder(reordered.map((item) => item.id))
      .pipe(finalize(() => this.reorderingId.set(null)))
      .subscribe({
        next: (saved) => this.classes.set(saved),
        error: (error) => {
          this.classes.set(current);
          this.errorMessage.set(this.toMessage(error, 'Nie udało się zmienić kolejności.'));
        }
      });
  }

  protected isFirst(pilatesClass: PilatesClass) {
    return this.classes()[0]?.id === pilatesClass.id;
  }

  protected isLast(pilatesClass: PilatesClass) {
    const classes = this.classes();
    return classes[classes.length - 1]?.id === pilatesClass.id;
  }

  protected imageUrl(pilatesClass: PilatesClass) {
    return pilatesClass.image?.thumbnailUrl || pilatesClass.image?.url || null;
  }

  private rejectFile(input: HTMLInputElement, message: string) {
    this.selectedImage.set(null);
    this.revokePreviewUrl();
    this.errorMessage.set(message);
    input.value = '';
  }

  private loadClasses() {
    this.pilatesClassService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (classes) => this.classes.set(classes),
        error: () => this.errorMessage.set('Nie udało się pobrać zajęć.')
      });
  }

  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private toMessage(error: unknown, fallback: string) {
    const message = (error as { error?: { message?: string } })?.error?.message;
    return message ?? fallback;
  }

  private revokePreviewUrl() {
    const previewUrl = this.previewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.previewUrl.set(null);
    }
  }
}
