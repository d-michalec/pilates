import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AdminAuthService } from './admin-auth.service';

/**
 * Dokłada nagłówek Basic do żądań panelu i sprząta po wygasłych danych logowania:
 * przy 401 czyści sesję i odsyła na formularz, żeby panel nie zostawał w stanie,
 * w którym każdy zapis po cichu się nie udaje.
 */
export const adminAuthInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.includes('/api/admin/')) {
    return next(request);
  }

  const authService = inject(AdminAuthService);
  const router = inject(Router);
  const authorization = authService.authorizationHeader;

  const authorizedRequest = authorization
    ? request.clone({ setHeaders: { Authorization: authorization } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.logOut();
        void router.navigate(['/admin/login'], {
          queryParams: { powrot: router.url }
        });
      }

      return throwError(() => error);
    })
  );
};
