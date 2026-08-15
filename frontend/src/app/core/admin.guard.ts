import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AdminAuthService } from './admin-auth.service';

/**
 * Guard jest wyłącznie wygodą dla użytkownika - prawdziwą ochroną są uprawnienia
 * na endpointach backendu. Bez nich ukrycie widoku niczego by nie dawało.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  // Trasy panelu renderują się po stronie klienta, ale prerender i tak je odwiedza.
  if (!isPlatformBrowser(platformId)) {
    return false;
  }

  if (inject(AdminAuthService).isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/admin/login'], {
    queryParams: state.url === '/admin/login' ? {} : { powrot: state.url }
  });
};
