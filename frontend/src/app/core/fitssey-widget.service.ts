import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

import { FITSSEY_WIDGET_SCRIPT_URL } from './fitssey-widget.config';

type FitsseyCommand = ((...args: unknown[]) => void) & {
  q?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    FitsseyWidget?: string;
    lb?: FitsseyCommand;
  }
}

@Injectable({
  providedIn: 'root'
})
export class FitsseyWidgetService {
  private scriptLoad?: Promise<void>;
  private initializedStudioUuid?: string;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  init(studioUuid: string) {
    if (typeof window === 'undefined') {
      return Promise.resolve(false);
    }

    const normalizedStudioUuid = studioUuid.trim();

    if (!normalizedStudioUuid) {
      return Promise.resolve(false);
    }

    if (this.initializedStudioUuid !== normalizedStudioUuid) {
      this.installCommandQueue();
      window.lb?.('init', normalizedStudioUuid);
      this.initializedStudioUuid = normalizedStudioUuid;
      this.scriptLoad = undefined;
    }

    return this.loadScript().then(() => true);
  }

  preload(studioUuid: string) {
    return this.init(studioUuid).catch(() => false);
  }

  mounted() {
    if (typeof window === 'undefined') {
      return;
    }

    window.lb?.('mounted');
  }

  private loadScript() {
    if (this.scriptLoad) {
      return this.scriptLoad;
    }

    this.scriptLoad = new Promise<void>((resolve, reject) => {
      const existingScript = this.document.getElementById('fitssey-widget-script') as HTMLScriptElement | null;

      if (existingScript) {
        if (existingScript.dataset['loaded'] === 'true') {
          resolve();
          return;
        }

        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Nie udało się załadować widgetu Fitssey.')), {
          once: true
        });
        return;
      }

      const script = this.document.createElement('script');
      script.id = 'fitssey-widget-script';
      script.async = true;
      script.src = FITSSEY_WIDGET_SCRIPT_URL;
      script.onload = () => {
        script.dataset['loaded'] = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error('Nie udało się załadować widgetu Fitssey.'));
      this.document.head.appendChild(script);
    });

    return this.scriptLoad;
  }

  private installCommandQueue() {
    if (window.lb) {
      window.FitsseyWidget = 'lb';
      window.lb.l = window.lb.l ?? Date.now();
      return;
    }

    const command = ((...args: unknown[]) => {
      command.q = command.q ?? [];
      command.q.push(args);
    }) as FitsseyCommand;

    window.FitsseyWidget = 'lb';
    command.l = Date.now();
    window.lb = command;
  }
}
