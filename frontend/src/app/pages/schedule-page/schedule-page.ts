import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { FitsseyWarmupService } from '../../core/fitssey-warmup.service';
import {
  FITSSEY_FRAME_HEIGHT_EVENT,
  FITSSEY_FRAME_HEIGHT_OVERRIDE_EVENT,
  FITSSEY_FRAME_MAX_HEIGHT_PX,
  FITSSEY_FRAME_MIN_HEIGHT_PX,
  FITSSEY_FRAME_ORIGIN,
  FITSSEY_PRICING_URL,
  FITSSEY_SCHEDULE_URL
} from '../../core/fitssey-widget.config';
import { TranslationKey } from '../../core/translations';
import { FitsseyWidget } from '../../widgets/fitssey-widget/fitssey-widget';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { TranslatePipe } from '../../core/localize.pipe';
import { LanguageService } from '../../core/language.service';

/**
 * Grafik jest cudzą aplikacją w iframe, więc nie mamy wglądu w jej wewnętrzny stan.
 * Zdarzenie load to najlepszy sygnał, jakim dysponujemy; timeout chroni przed sytuacją,
 * w której nigdy nie dotrze i użytkownik zostałby ze skeletonem na stałe.
 */
const FRAME_FALLBACK_TIMEOUT_MS = 8000;

/**
 * Ta sama podstrona obsługuje dwa widoki frontoffice Fitssey: grafik i cennik.
 *
 * Różnica nie jest tylko w adresie. Grafik ma własny element widgetu
 * (`lb-schedule-widget`), który sam dopasowuje wysokość ramki do treści -
 * i tego używamy. Cennika taki element nie obejmuje: skrypt Fitssey rejestruje
 * wyłącznie `lb-schedule-widget` i `lb-course-widget` (patrz oficjalny przykład
 * w fitssey-widget-next-js-example), więc cennik idzie zwykłą ramką na stronę
 * `/frontoffice/pricing`.
 */
interface WidokFitssey {
  /** Czy widok da się osadzić oficjalnym widgetem, czy tylko ramką. */
  obslugujeWidget: boolean;
  url: string;
  tytulRamki: TranslationKey;
  komunikatLadowania: TranslationKey;
  naglowek: TranslationKey;
  seoTytul: TranslationKey;
  seoOpis: TranslationKey;
}

const WIDOKI: Record<'grafik' | 'cennik', WidokFitssey> = {
  grafik: {
    obslugujeWidget: true,
    url: FITSSEY_SCHEDULE_URL,
    tytulRamki: 'schedule.frameTitle',
    komunikatLadowania: 'schedule.loading',
    naglowek: 'schedule.title',
    seoTytul: 'seo.schedule.title',
    seoOpis: 'seo.schedule.description'
  },
  cennik: {
    obslugujeWidget: false,
    url: FITSSEY_PRICING_URL,
    tytulRamki: 'pricing.frameTitle',
    komunikatLadowania: 'pricing.loading',
    naglowek: 'pricing.title',
    seoTytul: 'seo.pricing.title',
    seoOpis: 'seo.pricing.description'
  }
};

@Component({
  selector: 'app-schedule-page',
  imports: [FitsseyWidget, SiteFooter, SiteHeader, TranslatePipe],
  templateUrl: './schedule-page.html',
  styleUrl: './schedule-page.scss'
})
export class SchedulePage implements OnInit, AfterViewInit, OnDestroy {
  private readonly languageService = inject(LanguageService);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  protected readonly widok: WidokFitssey;
  protected readonly scheduleUrl: SafeResourceUrl;
  protected readonly isFrameReady = signal(false);
  protected readonly skeletonRows = [0, 1, 2, 3, 4, 5];

  /** Skryptu Fitssey nie udało się wczytać - wracamy na surowy iframe. */
  protected readonly hasWidgetFailed = signal(false);

  /**
   * Wysokość ramki podana przez samą stronę Fitssey. `null` znaczy "jeszcze nic
   * nie przyszło" - wtedy obowiązuje wysokość ze stylów.
   */
  protected readonly wysokoscRamki = signal<number | null>(null);

  private fallbackTimeoutId?: number;
  private wysokoscWymuszona: number | null = null;
  private odsluchWysokosci?: (event: MessageEvent) => void;

  constructor(
    private readonly fitsseyWarmupService: FitsseyWarmupService,
    private readonly seoService: SeoService,
    route: ActivatedRoute,
    sanitizer: DomSanitizer
  ) {
    const klucz = route.snapshot.data['widok'] === 'cennik' ? 'cennik' : 'grafik';
    this.widok = WIDOKI[klucz];

    // Cennik nie ma własnego elementu widgetu, więc od początku idzie ramką.
    this.hasWidgetFailed.set(!this.widok.obslugujeWidget);
    this.scheduleUrl = sanitizer.bypassSecurityTrustResourceUrl(this.widok.url);
  }

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate(this.widok.seoTytul),
      description: this.languageService.translate(this.widok.seoOpis)
    });
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') {
      return;
    }

    this.zacznijSluchacWysokosci();

    // Ukryta ramka rozgrzewająca zrobiła swoje - dalej ładuje się już właściwy widok.
    this.fitsseyWarmupService.release();
    this.fallbackTimeoutId = window.setTimeout(() => this.markFrameReady(), FRAME_FALLBACK_TIMEOUT_MS);
  }

  protected onWidgetReady() {
    this.markFrameReady();
  }

  /*
   * Skrypt Fitssey nie wstał. Wracamy na surowy iframe i znów czekamy na jego
   * `load`, więc szkielet zostaje na ekranie zamiast mrugnąć pustym miejscem.
   */
  protected onWidgetFailed() {
    this.hasWidgetFailed.set(true);

    /*
     * Jeśli strona już zdjęła szkielet (bo minął czas oczekiwania), nie
     * wracamy do niego - mrugałby na treści, którą użytkownik ma przed sobą.
     */
    if (this.isFrameReady()) {
      return;
    }

    this.clearFallbackTimeout();

    if (typeof window !== 'undefined') {
      this.fallbackTimeoutId = window.setTimeout(() => this.markFrameReady(), FRAME_FALLBACK_TIMEOUT_MS);
    }
  }

  ngOnDestroy() {
    this.clearFallbackTimeout();

    if (this.odsluchWysokosci && typeof window !== 'undefined') {
      window.removeEventListener('message', this.odsluchWysokosci);
      this.odsluchWysokosci = undefined;
    }
  }

  /**
   * Osadzona strona Fitssey sama mówi, ile miejsca potrzebuje - dokładnie tak,
   * jak robi to oficjalny widget grafiku. Bez tego wysokość ramki musiałaby być
   * zgadywana ze stylów, a treść cennika rośnie z każdym nowym karnetem.
   *
   * Ramkę tylko podwyższamy. Pierwsza wiadomość przychodzi jeszcze przed
   * dociągnięciem karnetów (u nas: 1138 px przy treści na 2414 px), więc gdyby
   * ją wziąć wprost, cennik witałby ucięty. Właściwe wysokości Fitssey wysyła
   * seriami przy każdym ruchu w środku ramki - i te już ramkę rozciągają.
   * Dolną granicą jest więc zawsze wysokość ze stylów.
   */
  private zacznijSluchacWysokosci() {
    this.odsluchWysokosci = (event: MessageEvent) => {
      if (event.origin !== FITSSEY_FRAME_ORIGIN || typeof event.data !== 'string') {
        return;
      }

      let tresc: Record<string, unknown>;

      try {
        tresc = JSON.parse(event.data) as Record<string, unknown>;
      } catch {
        // Fitssey i wtyczki przeglądarki wysyłają tym kanałem różne rzeczy.
        return;
      }

      if (FITSSEY_FRAME_HEIGHT_OVERRIDE_EVENT in tresc) {
        const wymuszona = this.liczbaPikseli(tresc[FITSSEY_FRAME_HEIGHT_OVERRIDE_EVENT]);
        this.wysokoscWymuszona = wymuszona;
      }

      if (FITSSEY_FRAME_HEIGHT_EVENT in tresc) {
        const zmierzona = this.liczbaPikseli(tresc[FITSSEY_FRAME_HEIGHT_EVENT]);

        // Panel zakupu narzuca swoją wysokość i wygrywa z wyliczoną - tak samo
        // rozstrzyga to oficjalny widget.
        const docelowa = this.wysokoscWymuszona ?? zmierzona;

        if (docelowa !== null && docelowa > this.wysokoscRamkiWStronie() + 1) {
          this.wysokoscRamki.set(docelowa);
        }
      }
    };

    window.addEventListener('message', this.odsluchWysokosci);
  }

  /**
   * Ile ramka ma teraz na ekranie - razem z tym, co dały jej same styles.
   *
   * Element szukamy za każdym razem od nowa, a nie przez `@ViewChild`: ramka
   * stoi w bloku `@if`, więc zapytanie widoku potrafi trzymać węzeł, którego
   * w dokumencie już nie ma (mierzył się wtedy na zero i wpuszczał zaniżoną
   * wysokość z pierwszej wiadomości).
   */
  private wysokoscRamkiWStronie(): number {
    const element = this.host.nativeElement.querySelector<HTMLIFrameElement>('.schedule-frame');

    return element ? element.getBoundingClientRect().height : (this.wysokoscRamki() ?? 0);
  }

  private liczbaPikseli(wartosc: unknown): number | null {
    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < FITSSEY_FRAME_MIN_HEIGHT_PX) {
      return null;
    }

    return Math.min(Math.round(liczba), FITSSEY_FRAME_MAX_HEIGHT_PX);
  }

  protected onFrameLoad() {
    this.markFrameReady();
  }

  private markFrameReady() {
    this.clearFallbackTimeout();
    this.isFrameReady.set(true);
  }

  private clearFallbackTimeout() {
    if (this.fallbackTimeoutId !== undefined) {
      clearTimeout(this.fallbackTimeoutId);
      this.fallbackTimeoutId = undefined;
    }
  }
}
