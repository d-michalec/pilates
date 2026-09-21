import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';
import { MessageModule } from 'primeng/message';

import { FITSSEY_STUDIO_UUID, FITSSEY_WIDGET_BASE_URL, isFitsseyConfigured } from '../../core/fitssey-widget.config';
import { FitsseyWidgetService } from '../../core/fitssey-widget.service';

type FitsseyWidgetType = 'schedule' | 'course';

@Component({
  selector: 'app-fitssey-widget',
  imports: [MessageModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './fitssey-widget.html',
  styleUrl: './fitssey-widget.scss'
})
export class FitsseyWidget implements AfterViewInit, OnDestroy {
  @Input() widget: FitsseyWidgetType = 'schedule';
  @Input() hideHeader = true;

  /*
   * Strona osadzająca widget może chcieć wiedzieć, jak poszło: pokazać własny
   * szkielet do momentu gotowości, a przy nieudanym wczytaniu skryptu Fitssey
   * podstawić coś zamiast komunikatu o błędzie. Grafik robi jedno i drugie.
   */
  @Output() readonly widgetReady = new EventEmitter<void>();
  @Output() readonly widgetFailed = new EventEmitter<void>();

  protected readonly isConfigured = signal(isFitsseyConfigured());
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoading = signal(isFitsseyConfigured());
  protected readonly studioUuid = FITSSEY_STUDIO_UUID;
  protected readonly baseUrl = FITSSEY_WIDGET_BASE_URL;

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  private frameObserver?: MutationObserver;

  constructor(private readonly fitsseyWidgetService: FitsseyWidgetService) {}

  ngAfterViewInit() {
    /*
     * Tylko w przeglądarce. Przy prerenderze ten hook też się wykonuje, a jego
     * mikrozadanie kończyło się przed serializacją - `widgetReady` szło więc
     * do strony osadzającej i w statycznym HTML-u grafiku nie było już ani
     * szkieletu, ani komunikatu o ładowaniu, tylko puste pole.
     */
    if (!isPlatformBrowser(this.platformId) || !this.isConfigured()) {
      return;
    }

    /*
     * Dwa osobne wywołania zwrotne, a nie `.then(...).catch(...)`: przy
     * sklejeniu w łańcuch wyjątek rzucony już po udanym wczytaniu (choćby
     * z `mounted()`, czyli z cudzego kodu) trafiał do `catch` i strona
     * dostawała najpierw `widgetReady`, a potem `widgetFailed` - podmieniała
     * działający widget na zapasowy iframe i wczytywała grafik po raz drugi.
     */
    void this.fitsseyWidgetService.init(FITSSEY_STUDIO_UUID).then(
      (loaded) => this.onScriptLoaded(loaded),
      () => this.onScriptFailed()
    );
  }

  ngOnDestroy() {
    this.frameObserver?.disconnect();
    this.frameObserver = undefined;
  }

  private onScriptLoaded(loaded: boolean) {
    if (!loaded) {
      this.onScriptFailed();
      return;
    }

    try {
      this.fitsseyWidgetService.mounted();
    } catch {
      this.onScriptFailed();
      return;
    }

    this.watchForFrame();
  }

  private onScriptFailed() {
    this.errorMessage.set('Nie udało się załadować widgetu Fitssey.');
    this.isLoading.set(false);
    this.widgetFailed.emit();
  }

  /*
   * Wczytany skrypt to jeszcze nie gotowy grafik: Fitssey wstawia dopiero
   * teraz własny iframe, który sam musi pobrać swoją aplikację. Zgłaszamy
   * gotowość po jego zdarzeniu `load`, bo to najbliższy sygnał, jakim
   * dysponujemy - inaczej strona osadzająca zdejmowała szkielet za wcześnie
   * i pokazywała puste pole na resztę ładowania.
   */
  private watchForFrame() {
    const frame = this.findFrame();
    if (frame) {
      this.awaitFrame(frame);
      return;
    }

    this.frameObserver = new MutationObserver(() => {
      const dodana = this.findFrame();
      if (!dodana) {
        return;
      }

      this.frameObserver?.disconnect();
      this.frameObserver = undefined;
      this.awaitFrame(dodana);
    });

    this.frameObserver.observe(this.hostRef.nativeElement, { childList: true, subtree: true });
  }

  private findFrame(): HTMLIFrameElement | null {
    return this.hostRef.nativeElement.querySelector('iframe');
  }

  private awaitFrame(frame: HTMLIFrameElement) {
    frame.addEventListener('load', () => this.markReady(), { once: true });
  }

  private markReady() {
    this.isLoading.set(false);
    this.widgetReady.emit();
  }
}
