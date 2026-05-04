import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
      padding: 2rem 1rem;
    }

    .auth-card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 420px;
      padding: 2.5rem;
    }

    .logo {
      font-size: 1.75rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .subtitle {
      text-align: center;
      color: var(--gray-600);
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }

    .form-error {
      background: #fee2e2;
      color: #991b1b;
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
        <div class="logo">LokalneOgłoszenia</div>
        <p class="subtitle">Zaloguj się, aby kontynuować</p>

        @if (errorMessage()) {
          <div class="form-error">{{ errorMessage() }}</div>
        }

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" placeholder="jan@example.com" autocomplete="email" />
            @if (showError('email', 'required')) {
              <span class="error-text">Email jest wymagany</span>
            }
            @if (showError('email', 'email')) {
              <span class="error-text">Nieprawidłowy format email</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Hasło</label>
            <input id="password" type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password" />
            @if (showError('password', 'required')) {
              <span class="error-text">Hasło jest wymagane</span>
            }
          </div>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Logowanie...' : 'Zaloguj się' }}
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
        this.errorMessage.set(err.error?.message ?? 'Błąd logowania');
      },
    });
  }
}
