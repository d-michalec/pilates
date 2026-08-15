import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { finalize } from 'rxjs';

import { AdminAuthService } from '../../core/admin-auth.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [ButtonModule, InputTextModule, MessageModule, ReactiveFormsModule],
  templateUrl: './admin-login-page.html',
  styleUrl: './admin-login-page.scss',
  host: { ngSkipHydration: 'true' }
})
export class AdminLoginPage {
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  protected submit() {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const { username, password } = this.form.getRawValue();

    this.adminAuthService
      .logIn(username, password)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl()),
        error: (error: unknown) => this.errorMessage.set(this.toMessage(error))
      });
  }

  private returnUrl() {
    const requested = this.route.snapshot.queryParamMap.get('powrot');

    // Przyjmujemy wyłącznie ścieżki panelu, żeby parametr z adresu nie posłużył
    // do przekierowania na obcą domenę.
    return requested?.startsWith('/admin/') && requested !== '/admin/login' ? requested : '/admin/landing';
  }

  private toMessage(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'Nieprawidłowa nazwa użytkownika albo hasło.';
      }

      if (error.status === 0) {
        return 'Brak połączenia z serwerem. Sprawdź, czy backend jest uruchomiony.';
      }
    }

    return 'Nie udało się zalogować. Spróbuj ponownie.';
  }
}
