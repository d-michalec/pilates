import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

import { FITSSEY_SCHEDULE_URL, FITSSEY_WIDGET_BASE_URL } from './fitssey-widget.config';

const WARMUP_FRAME_ID = 'fitssey-warmup-frame';
const WARMUP_FRAME_LIFETIME_MS = 25000;
const SLOW_CONNECTION_TYPES = new Set(['slow-2g', '2g', '3g']);

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Grafik Fitssey to zewnętrzna aplikacja klient-side: dokument iframe jest pustą skorupą,
 * a dopiero jej JS, CSS i XHR budują widok. Nie skrócimy tego łańcucha, ale możemy go
 * zacząć zanim użytkownik kliknie "Grafik" - wtedy podzasoby są już w cache przeglądarki.
 */
@Injectable({
  providedIn: 'root'
})
export class FitsseyWarmupService {
  private hasWarmed = false;
  private removalTimeoutId?: number;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  /** Wywoływane na intencję: otwarcie menu albo hover/focus na linku do grafiku. */
  warm() {
    if (this.hasWarmed || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.hasWarmed = true;
    this.preconnect();

    if (this.isConnectionConstrained()) {
      return;
    }

    this.prefetchInBackgroundFrame();
  }

  /** Widok grafiku przejmuje ładowanie, więc ukryta ramka nie jest już potrzebna. */
  release() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.removalTimeoutId !== undefined) {
      clearTimeout(this.removalTimeoutId);
      this.removalTimeoutId = undefined;
    }

    this.document.getElementById(WARMUP_FRAME_ID)?.remove();
  }

  private preconnect() {
    if (this.document.querySelector(`link[rel="preconnect"][href="${FITSSEY_WIDGET_BASE_URL}"]`)) {
      return;
    }

    const link = this.document.createElement('link');
    link.rel = 'preconnect';
    link.href = FITSSEY_WIDGET_BASE_URL;
    this.document.head.appendChild(link);
  }

  private prefetchInBackgroundFrame() {
    if (this.document.getElementById(WARMUP_FRAME_ID)) {
      return;
    }

    const frame = this.document.createElement('iframe');
    frame.id = WARMUP_FRAME_ID;
    frame.src = FITSSEY_SCHEDULE_URL;
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('title', 'Wstępne ładowanie grafiku');
    frame.style.cssText = [
      'position:absolute',
      'width:1px',
      'height:1px',
      'opacity:0',
      'pointer-events:none',
      'border:0',
      'left:-9999px',
      'top:-9999px'
    ].join(';');

    this.document.body.appendChild(frame);
    this.removalTimeoutId = window.setTimeout(() => this.release(), WARMUP_FRAME_LIFETIME_MS);
  }

  private isConnectionConstrained() {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (!connection) {
      return false;
    }

    return Boolean(connection.saveData) || SLOW_CONNECTION_TYPES.has(connection.effectiveType ?? '');
  }
}
