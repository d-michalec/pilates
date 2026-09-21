import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { AdminHeader } from '../../layout/admin-header/admin-header';
import { EventService } from '../../core/event.service';
import { StudioEvent } from '../../core/studio-event';
import { plainEventTitle, splitEventTitle } from '../../core/event-title';
import { TypoPoleDirective } from '../../layout/typo-pole/typo-pole.directive';
import { SurowyTekstPipe } from '../../core/typografia.pipe';

const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-admin-events-page',
  imports: [AdminHeader, ButtonModule, CardModule, InputTextModule, MessageModule, ReactiveFormsModule, RouterLink, TextareaModule, TypoPoleDirective, SurowyTekstPipe],
  templateUrl: './admin-events-page.html',
  styleUrl: './admin-events-page.scss'
})
export class AdminEventsPage implements OnInit, OnDestroy {
  protected readonly events = signal<StudioEvent[]>([]);
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly selectedHostImage = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly hostPreviewUrl = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  /** Null oznacza tryb dodawania, identyfikator - tryb edycji istniejącego wydarzenia. */
  protected readonly editedEventId = signal<string | null>(null);
  protected readonly eventPendingDeletion = signal<StudioEvent | null>(null);
  protected readonly shouldRemoveHostImage = signal(false);

  protected readonly editedEvent = computed(() => {
    const id = this.editedEventId();
    return id === null ? null : (this.events().find((item) => item.id === id) ?? null);
  });
  protected readonly isEditing = computed(() => this.editedEventId() !== null);

  /*
   * Podgląd kolorów nazwy pod polem. Sygnał, a nie `computed` po formularzu:
   * `form.controls.title.value` nie jest sygnałem, więc nie odświeżałby widoku
   * przy pisaniu. Wartość ustawia `valueChanges` w ngOnInit.
   */
  protected readonly titlePreview = signal(splitEventTitle(''));
  protected readonly titleEnPreview = signal(splitEventTitle(''));

  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(220)]
    }),
    hostName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)]
    }),
    eventStartAt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    shortDescription: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(600)]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(6000)]
    }),
    hostDescription: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(3000)]
    }),
    durationMinutes: new FormControl<number | null>(null, {
      validators: [Validators.min(1), Validators.max(1440)]
    }),
    location: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)]
    }),
    capacity: new FormControl<number | null>(null, {
      validators: [Validators.min(1), Validators.max(100000)]
    }),
    price: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(80)]
    }),
    // Tłumaczenia są opcjonalne - puste pole zapisuje się jako brak tłumaczenia.
    titleEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(220)]
    }),
    shortDescriptionEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(600)]
    }),
    descriptionEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(6000)]
    }),
    hostDescriptionEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(3000)]
    }),
    locationEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)]
    }),
    priceEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(80)]
    }),

    signupUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)]
    })
  });

  constructor(private readonly eventService: EventService) {}

  ngOnInit() {
    this.loadEvents();

    // Podgląd kolorów nazwy odświeża się przy każdym znaku, także po wczytaniu
    // wydarzenia do edycji (`setValue` też przechodzi przez valueChanges).
    this.titlePreview.set(splitEventTitle(this.form.controls.title.value));
    this.form.controls.title.valueChanges.subscribe((value) => {
      this.titlePreview.set(splitEventTitle(value));
    });
    this.form.controls.titleEn.valueChanges.subscribe((value) => {
      this.titleEnPreview.set(splitEventTitle(value));
    });
  }

  ngOnDestroy() {
    this.revokePreviewUrl();
    this.revokeHostPreviewUrl();
  }

  /** Nazwa bez gwiazdek - lista i dialogi mają pokazywać tekst, nie zapis formatowania. */
  protected plainTitle(title: string | null | undefined) {
    return plainEventTitle(title);
  }

  /*
   * Otacza gwiazdkami fragment zaznaczony w polu, a jeśli zaznaczenie już jest
   * wyróżnieniem - zdejmuje je. Bez zaznaczenia bierze słowo pod kursorem, bo
   * to najczęstszy przypadek: ktoś klika w słowo i chce je pokolorować.
   *
   * Zapis idzie przez `setValue`, więc formularz zostaje jedynym źródłem
   * prawdy, a nie przez podmianę `input.value`.
   */
  protected oznaczNaBlekitno(input: HTMLInputElement, control: FormControl<string>) {
    const tekst = input.value ?? '';
    let od = input.selectionStart ?? tekst.length;
    let doKad = input.selectionEnd ?? od;

    if (od === doKad) {
      [od, doKad] = this.granicSlowa(tekst, od);
    }

    if (od === doKad) {
      input.focus();
      return;
    }

    const przed = tekst.slice(0, od);
    const zaznaczony = tekst.slice(od, doKad);
    const po = tekst.slice(doKad);

    /*
     * Zaznaczenie razem z gwiazdkami - zdejmujemy je. Warunek na brak gwiazdki
     * w środku jest istotny: bez niego zaznaczenie obejmujące dwa wyróżnienia
     * ("*SPORT* i *HORMONY*", na przykład po Ctrl+A) traciło tylko skrajną parę
     * i kolory wychodziły odwrotnie - wyróżnione zostawało to, co było między
     * nimi.
     */
    const srodek = zaznaczony.slice(1, -1);
    if (zaznaczony.startsWith('*') && zaznaczony.endsWith('*') && srodek.length > 0 && !srodek.includes('*')) {
      this.ustawTytul(input, control, przed, srodek, po);
      return;
    }

    // Zaznaczenie dokładnie w środku pary gwiazdek - też zdejmujemy.
    if (przed.endsWith('*') && po.startsWith('*') && !zaznaczony.includes('*')) {
      this.ustawTytul(input, control, przed.slice(0, -1), zaznaczony, po.slice(1));
      return;
    }

    /*
     * Wyróżnienie nie może zawierać gwiazdek, bo para musi obejmować ciągły
     * tekst. Zaznaczenie z wieloma wyróżnieniami scalamy więc w jedno -
     * to, czego oczekuje ktoś, kto zaznaczył całość i kliknął przycisk.
     */
    this.ustawTytul(input, control, przed, `*${zaznaczony.replace(/\*/g, '')}*`, po);
  }

  /** Granice słowa pod kursorem; spacje i gwiazdki są separatorami. */
  private granicSlowa(tekst: string, pozycja: number): [number, number] {
    const separator = /[\s*]/;
    let od = Math.min(pozycja, tekst.length);
    let doKad = od;

    while (od > 0 && !separator.test(tekst[od - 1])) {
      od -= 1;
    }
    while (doKad < tekst.length && !separator.test(tekst[doKad])) {
      doKad += 1;
    }

    return [od, doKad];
  }

  private ustawTytul(
    input: HTMLInputElement,
    control: FormControl<string>,
    przed: string,
    srodek: string,
    po: string
  ) {
    control.setValue(przed + srodek + po);
    control.markAsDirty();
    // Bez `markAsTouched` komunikat o przekroczeniu 220 znaków pokazałby się
    // dopiero po wyjściu z pola, choć długość zmienił przycisk.
    control.markAsTouched();

    // Zaznaczenie zostaje na tym samym fragmencie, więc kolejne kliknięcie
    // przycisku zdejmuje wyróżnienie, które właśnie powstało.
    const start = przed.length;
    input.focus();
    input.setSelectionRange(start, start + srodek.length);
  }

  protected onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectImage(input, this.selectedImage, this.previewUrl, () => this.revokePreviewUrl());
  }

  protected onHostImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectImage(input, this.selectedHostImage, this.hostPreviewUrl, () => this.revokeHostPreviewUrl());
    this.shouldRemoveHostImage.set(false);
  }

  protected clearImage(input: HTMLInputElement) {
    input.value = '';
    this.selectedImage.set(null);
    this.revokePreviewUrl();
  }

  protected clearHostImage(input: HTMLInputElement) {
    input.value = '';
    this.selectedHostImage.set(null);
    this.revokeHostPreviewUrl();
  }

  protected markHostImageForRemoval() {
    this.shouldRemoveHostImage.set(true);
    this.selectedHostImage.set(null);
    this.revokeHostPreviewUrl();
  }

  protected startEditing(studioEvent: StudioEvent, imageInput: HTMLInputElement, hostImageInput: HTMLInputElement) {
    this.clearMessages();
    this.editedEventId.set(studioEvent.id);
    this.shouldRemoveHostImage.set(false);
    this.form.setValue({
      title: studioEvent.title,
      hostName: studioEvent.hostName,
      eventStartAt: this.toDateTimeLocal(studioEvent.eventStartAt),
      shortDescription: studioEvent.shortDescription,
      description: studioEvent.description,
      hostDescription: studioEvent.hostDescription ?? '',
      durationMinutes: studioEvent.durationMinutes,
      location: studioEvent.location ?? '',
      capacity: studioEvent.capacity,
      price: studioEvent.price ?? '',
      signupUrl: studioEvent.signupUrl ?? '',
      titleEn: studioEvent.titleEn ?? '',
      shortDescriptionEn: studioEvent.shortDescriptionEn ?? '',
      descriptionEn: studioEvent.descriptionEn ?? '',
      hostDescriptionEn: studioEvent.hostDescriptionEn ?? '',
      locationEn: studioEvent.locationEn ?? '',
      priceEn: studioEvent.priceEn ?? ''
    });
    this.clearImage(imageInput);
    this.clearHostImage(hostImageInput);
  }

  protected cancelEditing(imageInput: HTMLInputElement, hostImageInput: HTMLInputElement) {
    this.editedEventId.set(null);
    this.shouldRemoveHostImage.set(false);
    this.form.reset();
    this.clearImage(imageInput);
    this.clearHostImage(hostImageInput);
    this.clearMessages();
  }

  protected submit(imageInput: HTMLInputElement, hostImageInput: HTMLInputElement) {
    this.clearMessages();

    const image = this.selectedImage();
    const editedId = this.editedEventId();

    // Przy dodawaniu zdjęcie wydarzenia jest obowiązkowe, przy edycji jego brak
    // oznacza zachowanie dotychczasowego.
    if (this.form.invalid || (!editedId && !image)) {
      this.form.markAllAsTouched();
      this.errorMessage.set(
        editedId ? 'Uzupełnij wymagane pola.' : 'Uzupełnij wymagane pola i dodaj zdjęcie wydarzenia.'
      );
      return;
    }

    const values = this.form.getRawValue();
    this.isSaving.set(true);

    const request = editedId
      ? this.eventService.update(editedId, {
          ...values,
          image,
          hostImage: this.selectedHostImage(),
          removeHostImage: this.shouldRemoveHostImage()
        })
      : this.eventService.create({ ...values, image: image as File, hostImage: this.selectedHostImage() });

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        if (editedId) {
          this.events.update((events) => events.map((item) => (item.id === editedId ? saved : item)).sort(this.sortEvents));
          this.successMessage.set('Zmiany zostały zapisane.');
        }
        else {
          this.events.update((events) => [...events, saved].sort(this.sortEvents));
          this.successMessage.set('Wydarzenie zostało dodane.');
        }

        this.editedEventId.set(null);
        this.shouldRemoveHostImage.set(false);
        this.form.reset();
        this.clearImage(imageInput);
        this.clearHostImage(hostImageInput);
      },
      error: (error) => this.errorMessage.set(this.toMessage(error, 'Nie udało się zapisać wydarzenia.'))
    });
  }

  protected askForDeletion(studioEvent: StudioEvent) {
    this.clearMessages();
    this.eventPendingDeletion.set(studioEvent);
  }

  protected cancelDeletion() {
    this.eventPendingDeletion.set(null);
  }

  protected confirmDeletion(imageInput: HTMLInputElement, hostImageInput: HTMLInputElement) {
    const studioEvent = this.eventPendingDeletion();
    if (!studioEvent) {
      return;
    }

    this.isSaving.set(true);
    this.eventService
      .delete(studioEvent.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.events.update((events) => events.filter((item) => item.id !== studioEvent.id));
          this.eventPendingDeletion.set(null);
          this.successMessage.set(`Usunięto wydarzenie ${plainEventTitle(studioEvent.title)}.`);

          if (this.editedEventId() === studioEvent.id) {
            this.cancelEditing(imageInput, hostImageInput);
          }
        },
        error: (error) => {
          this.eventPendingDeletion.set(null);
          this.errorMessage.set(this.toMessage(error, 'Nie udało się usunąć wydarzenia.'));
        }
      });
  }

  protected eventDate(event: StudioEvent) {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(event.eventStartAt));
  }

  protected imageUrl(event: StudioEvent) {
    return event.image.thumbnailUrl || event.image.url;
  }

  protected hostImageUrl(event: StudioEvent) {
    return event.hostImage?.thumbnailUrl || event.hostImage?.url || null;
  }

  /** Backend przyjmuje i zwraca LocalDateTime, a input datetime-local chce dokładnie minut. */
  private toDateTimeLocal(value: string) {
    return value.slice(0, 16);
  }

  private loadEvents() {
    this.eventService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (events) => this.events.set(events),
        error: () => this.errorMessage.set('Nie udało się pobrać wydarzeń.')
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

  private selectImage(
    input: HTMLInputElement,
    selectedImage: { set(value: File | null): void },
    previewUrl: { set(value: string | null): void },
    revokePreviewUrl: () => void
  ) {
    const file = input.files?.[0] ?? null;
    this.clearMessages();

    if (!file) {
      selectedImage.set(null);
      revokePreviewUrl();
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      selectedImage.set(null);
      revokePreviewUrl();
      this.errorMessage.set('Dodaj plik JPG, PNG albo WebP.');
      input.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      selectedImage.set(null);
      revokePreviewUrl();
      this.errorMessage.set('Zdjęcie może mieć maksymalnie 20 MB.');
      input.value = '';
      return;
    }

    selectedImage.set(file);
    revokePreviewUrl();
    previewUrl.set(URL.createObjectURL(file));
  }

  private revokePreviewUrl() {
    const previewUrl = this.previewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.previewUrl.set(null);
    }
  }

  private revokeHostPreviewUrl() {
    const previewUrl = this.hostPreviewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.hostPreviewUrl.set(null);
    }
  }

  private sortEvents(first: StudioEvent, second: StudioEvent) {
    return new Date(first.eventStartAt).getTime() - new Date(second.eventStartAt).getTime();
  }
}
