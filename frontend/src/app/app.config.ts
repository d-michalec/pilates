import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withNoHttpTransferCache } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { adminAuthInterceptor } from './core/admin-auth.interceptor';
import { BabaPreset } from './core/baba-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptors([adminAuthInterceptor])),
    // Bez hydratacji Angular kasuje prerenderowany DOM i buduje go od zera, przez co
    // iframe grafiku ładował się dwa razy. Transfer cache wyłączony celowo: treści
    // pochodzą z panelu admina i nie mogą zostać zamrożone na moment builda.
    provideClientHydration(withNoHttpTransferCache()),
    providePrimeNG({
      theme: {
        preset: BabaPreset,
        options: {
          darkModeSelector: false
        }
      }
    }),
    // Nawigacja po linkach wewnętrznych jest teraz po stronie klienta, więc pozycję
    // scrolla trzeba resetować jawnie - wcześniej robiło to pełne przeładowanie strony.
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      })
    )
  ]
};
