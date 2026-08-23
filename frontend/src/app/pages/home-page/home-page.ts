import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, computed, signal, inject} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { ContactService } from '../../core/contact.service';
import { FitsseyWarmupService } from '../../core/fitssey-warmup.service';
import { LandingOffer } from '../../core/faq';
import { LandingContent, LandingGalleryImage } from '../../core/landing-content';
import { LandingService } from '../../core/landing.service';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { LocalizePathPipe, TranslatePipe } from '../../core/localize.pipe';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-home-page',
  imports: [ButtonModule, InputTextModule, LocalizePathPipe, MessageModule, ReactiveFormsModule, RouterLink, SiteFooter, SiteHeader, TextareaModule, TranslatePipe],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  // Treść pochodzi z API, więc prerenderowany markup i stan po starcie klienta mogą się
  // różnić. Pomijamy hydratację tego widoku, żeby nie generować niezgodności.
  host: { ngSkipHydration: 'true' }
})
export class HomePage implements OnInit, AfterViewInit {
  private readonly languageService = inject(LanguageService);

  @ViewChild('galleryViewport') private galleryViewport?: ElementRef<HTMLElement>;

  protected readonly landing = signal<LandingContent | null>(null);
  protected readonly galleryImages = signal<LandingGalleryImage[]>([]);
  protected readonly carouselImages = computed(() => {
    const images = this.galleryImages();
    return [0, 1, 2].flatMap((copyIndex) =>
      images.map((image, imageIndex) => ({
        key: `${copyIndex}-${image.id}`,
        image,
        imageIndex
      }))
    );
  });
  protected readonly offer = signal<LandingOffer | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSendingContact = signal(false);
  protected readonly contactSuccessMessage = signal<string | null>(null);
  protected readonly contactErrorMessage = signal<string | null>(null);
  protected readonly contactForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(255)]
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(60)]
    }),
    subject: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(160)]
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(3000)]
    }),
    website: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)]
    })
  });
  private currentGalleryIndex = 0;

  constructor(
    private readonly contactService: ContactService,
    private readonly fitsseyWarmupService: FitsseyWarmupService,
    private readonly landingService: LandingService,
    private readonly seoService: SeoService
  ) {}

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.home.title'),
      description: this.languageService.translate('seo.home.description'),
      localBusiness: true
    });

    this.landingService
      .get()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (landing) => this.landing.set(landing),
        error: () => {
          this.landing.set({
            id: 'local-fallback',
            eyebrow: 'Pilates studio',
            title: 'BABA',
            description:
              'Kameralne studio pilatesu, regeneracji i kobiecej energii. Spotkajmy się na macie, przy oddechu i w dobrym tempie.',
            ctaLabel: 'Zarezerwuj sesję',
            ctaUrl: '/grafik',
            imageAlt: 'Sala pilates w Babastudio',
            titleEn: null,
            eyebrowEn: null,
            descriptionEn:
              'An intimate studio for pilates, recovery and feminine energy. Let us meet on the mat, with the breath and at a good pace.',
            ctaLabelEn: 'Book a session',
            imageAltEn: 'Pilates room at Babastudio',
            heroImage: null
          });
        }
      });

    this.landingService.getOffer().subscribe({
      next: (offer) => this.offer.set(offer),
      error: () => this.offer.set(null)
    });

    this.landingService.listGallery().subscribe({
      next: (images) => {
        this.galleryImages.set(images);
        this.scheduleGalleryMiddleReset();
      },
      error: () => this.galleryImages.set([])
    });
  }

  ngAfterViewInit() {
    this.scheduleGalleryMiddleReset();
  }

  /** Karuzela ma teraz kadry do 470 px, a miniatura ma 420 px, więc bierzemy oryginał. */
  protected galleryImageUrl(galleryImage: LandingGalleryImage) {
    return galleryImage.image.url;
  }

  protected scrollGallery(_direction: -1 | 1) {
    const viewport = this.galleryViewport?.nativeElement;
    const imageCount = this.galleryImages().length;
    if (!viewport || imageCount === 0) {
      return;
    }

    if (this.currentGalleryIndex < imageCount || this.currentGalleryIndex >= imageCount * 2) {
      this.currentGalleryIndex = imageCount + this.normalizedGalleryIndex();
      this.scrollToGalleryIndex(this.currentGalleryIndex, 'instant');
    }

    if (_direction > 0 && this.currentGalleryIndex >= imageCount * 2 - 1) {
      this.currentGalleryIndex -= imageCount;
      this.scrollToGalleryIndex(this.currentGalleryIndex, 'instant');
    }

    if (_direction < 0 && this.currentGalleryIndex <= imageCount) {
      this.currentGalleryIndex += imageCount;
      this.scrollToGalleryIndex(this.currentGalleryIndex, 'instant');
    }

    this.currentGalleryIndex += _direction;
    this.scrollToGalleryIndex(this.currentGalleryIndex, 'smooth');

    window.setTimeout(() => this.normalizeGalleryPosition(), 620);
  }

  protected offerImageUrl() {
    return this.offer()?.image?.url ?? null;
  }

  protected ctaUrl() {
    const url = this.landing()?.ctaUrl?.trim();
    if (!url) {
      return '/grafik';
    }

    return url.startsWith('/') || url.startsWith('https://') || url.startsWith('http://') ? url : '/grafik';
  }

  /**
   * Adres CTA jest edytowalny z panelu, więc może wskazywać zarówno na naszą trasę,
   * jak i na zewnętrzny system. Tylko ten drugi przypadek wymaga zwykłego href -
   * dla tras wewnętrznych używamy routera, żeby uniknąć pełnego przeładowania aplikacji.
   */
  protected isExternalCta() {
    const url = this.ctaUrl();
    return url.startsWith('http://') || url.startsWith('https://');
  }

  protected warmSchedule() {
    this.fitsseyWarmupService.warm();
  }

  protected submitContact() {
    this.contactSuccessMessage.set(null);
    this.contactErrorMessage.set(null);

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      this.contactErrorMessage.set(this.languageService.translate('contact.invalid'));
      return;
    }

    this.isSendingContact.set(true);
    this.contactService
      .send(this.contactForm.getRawValue())
      .pipe(finalize(() => this.isSendingContact.set(false)))
      .subscribe({
        next: () => {
          this.contactForm.reset();
          this.contactSuccessMessage.set(this.languageService.translate('contact.success'));
        },
        error: (error) => {
          this.contactErrorMessage.set(this.languageService.formError(error, 'contact.failure'));
        }
      });
  }

  private scheduleGalleryMiddleReset() {
    if (typeof window === 'undefined') {
      return;
    }

    for (const delay of [0, 80, 220, 520]) {
      window.setTimeout(() => {
        window.requestAnimationFrame(() => this.resetGalleryToMiddle());
      }, delay);
    }
  }

  private resetGalleryToMiddle() {
    const viewport = this.galleryViewport?.nativeElement;
    const imageCount = this.galleryImages().length;
    if (!viewport || imageCount === 0) {
      return;
    }

    this.currentGalleryIndex = imageCount;
    this.scrollToGalleryIndex(this.currentGalleryIndex, 'instant');
  }

  private normalizeGalleryPosition() {
    const imageCount = this.galleryImages().length;
    if (imageCount === 0) {
      return;
    }

    if (this.currentGalleryIndex < imageCount) {
      this.currentGalleryIndex += imageCount;
      this.scrollToGalleryIndex(this.currentGalleryIndex, 'instant');
    }

    if (this.currentGalleryIndex >= imageCount * 2) {
      this.currentGalleryIndex -= imageCount;
      this.scrollToGalleryIndex(this.currentGalleryIndex, 'instant');
    }
  }

  private scrollToGalleryIndex(index: number, behavior: ScrollBehavior | 'instant') {
    const viewport = this.galleryViewport?.nativeElement;
    if (!viewport) {
      return;
    }

    const items = viewport.querySelectorAll<HTMLElement>('.gallery-item');
    const target = items[index];
    if (!target) {
      return;
    }

    if (behavior === 'instant') {
      const previousScrollBehavior = viewport.style.scrollBehavior;
      viewport.style.scrollBehavior = 'auto';
      viewport.scrollLeft = target.offsetLeft;
      viewport.style.scrollBehavior = previousScrollBehavior;
      return;
    }

    viewport.scrollTo({
      left: target.offsetLeft,
      behavior
    });
  }

  private normalizedGalleryIndex() {
    const viewport = this.galleryViewport?.nativeElement;
    const imageCount = this.galleryImages().length;
    if (!viewport || imageCount === 0) {
      return 0;
    }

    const items = Array.from(viewport.querySelectorAll<HTMLElement>('.gallery-item'));
    const nearestIndex = items.reduce((nearest, item, index) => {
      const nearestDistance = Math.abs(items[nearest].offsetLeft - viewport.scrollLeft);
      const distance = Math.abs(item.offsetLeft - viewport.scrollLeft);
      return distance < nearestDistance ? index : nearest;
    }, 0);

    return nearestIndex % imageCount;
  }

  /** Wybiera wersję redagowaną w panelu; brak tłumaczenia oznacza polski tekst. */
  protected content(polish: string | null | undefined, english: string | null | undefined) {
    return this.languageService.content(polish, english);
  }

}
