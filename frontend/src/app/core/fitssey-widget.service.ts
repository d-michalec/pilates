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

  mounted() {
    window.lb?.('mounted');
  }

  private loadScript() {
    if (this.scriptLoad) {
      return this.scriptLoad;
    }

    this.scriptLoad = new Promise<void>((resolve, reject) => {
      const existingScript = this.document.getElementById('fitssey-widget-script') as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.remove();
      }

      const script = this.document.createElement('script');
      script.id = 'fitssey-widget-script';
      script.async = true;
      script.src = FITSSEY_WIDGET_SCRIPT_URL;
      script.onload = () => {
        script.dataset['loaded'] = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error('Nie udalo sie zaladowac widgetu Fitssey.'));
      this.document.head.appendChild(script);
    });

    return this.scriptLoad;
  }

  private installCommandQueue() {
    const command = ((...args: unknown[]) => {
      command.q = command.q ?? [];
      command.q.push(args);
    }) as FitsseyCommand;

    window.FitsseyWidget = 'lb';
    command.l = Date.now();
    window.lb = command;
  }
}
