import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      padding: 2rem 1rem;
    }

    .auth-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: none;
      width: 100%;
      max-width: 420px;
      padding: 2.5rem;
    }

    .logo {
      display: block;
      font-size: 1.75rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.5rem;
      color: var(--primary);
    }

    .subtitle {
      text-align: center;
      color: var(--gray-600);
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }

    .form-error {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 0.625rem 0.75rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .auth-footer {
      margin-top: 1.5rem;
      text-align: center;
      color: var(--gray-600);
      font-size: 0.875rem;
    }

    .auth-footer a {
      color: var(--primary);
      font-weight: 600;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }
  `],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <a class="logo" routerLink="/">Bazarek</a>
        <p class="subtitle">Zaloguj się, aby kontynuować</p>

        @if (errorMessage()) {
          <div class="form-error">{{ errorMessage() }}</div>
        }

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="jan@example.com" autocomplete="email" />
            @if (showError('email', 'required')) {
              <mat-error>Email jest wymagany</mat-error>
            }
            @if (showError('email', 'email')) {
              <mat-error>Nieprawidłowy format email</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Hasło</mat-label>
            <input matInput type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password" />
            @if (showError('password', 'required')) {
              <mat-error>Hasło jest wymagane</mat-error>
            }
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Zaloguj się
            }
          </button>
        </form>

        <div class="auth-footer">
          Nie masz konta? <a routerLink="/register">Zarejestruj się</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  showError(field: 'email' | 'password', error: string): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.touched && ctrl.hasError(error);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.notifications.show('Zalogowano pomyślnie');
        this.router.navigate(['/ads']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.errorMessage.set('Konto nie zostało jeszcze potwierdzone. Sprawdź skrzynkę pocztową i kliknij link weryfikacyjny.');
        } else {
          this.errorMessage.set(err.error?.message ?? 'Błąd logowania');
        }
      },
    });
  }
}
