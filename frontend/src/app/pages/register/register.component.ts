import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

const matchPasswords = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
};

@Component({
  selector: 'app-register',
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
      max-width: 460px;
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
        <p class="subtitle">Załóż konto za darmo</p>

        @if (errorMessage()) {
          <div class="form-error">{{ errorMessage() }}</div>
        }

        <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">
          <div class="form-group">
            <label for="username">Imię i nazwisko</label>
            <input id="username" name="register-username" type="text" formControlName="username" placeholder="Jan Kowalski" autocomplete="off" />
            @if (showError('username', 'required')) {
              <span class="error-text">Imię i nazwisko jest wymagane</span>
            }
            @if (showError('username', 'minlength')) {
              <span class="error-text">Min. 2 znaki</span>
            }
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" name="register-email" type="email" formControlName="email" placeholder="jan@example.com" autocomplete="off" />
            @if (showError('email', 'required')) {
              <span class="error-text">Email jest wymagany</span>
            }
            @if (showError('email', 'email')) {
              <span class="error-text">Nieprawidłowy format email</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Hasło</label>
            <input id="password" name="register-password" type="password" formControlName="password" placeholder="••••••••" autocomplete="new-password" />
            @if (showError('password', 'required')) {
              <span class="error-text">Hasło jest wymagane</span>
            }
            @if (showError('password', 'minlength')) {
              <span class="error-text">Min. 6 znaków</span>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword">Powtórz hasło</label>
            <input id="confirmPassword" name="register-confirm-password" type="password" formControlName="confirmPassword" placeholder="••••••••" autocomplete="new-password" />
            @if (form.hasError('passwordsMismatch') && form.controls.confirmPassword.touched) {
              <span class="error-text">Hasła nie są takie same</span>
            }
          </div>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
            {{ loading() ? 'Tworzenie konta...' : 'Załóż konto' }}
          </button>
        </form>

        <div class="auth-footer">
          Masz już konto? <a routerLink="/login">Zaloguj się</a>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchPasswords }
  );

  showError(field: 'username' | 'email' | 'password', error: string): boolean {
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

    const { username, email, password } = this.form.getRawValue();

    this.auth.register({ username, email, password }).subscribe({
      next: () => {
        this.auth.login({ email, password }).subscribe({
          next: () => {
            this.loading.set(false);
            this.notifications.show('Konto utworzone — zalogowano');
            this.router.navigate(['/ads']);
          },
          error: () => {
            this.loading.set(false);
            this.notifications.show('Konto utworzone — zaloguj się ręcznie');
            this.router.navigate(['/login']);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'Błąd rejestracji');
      },
    });
  }
}
