import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { RegisterResponse } from '../../core/models/user.model';

const matchPasswords = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
};

@Component({
  selector: 'app-register',
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
  styles: [
    `
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
        max-width: 460px;
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
    `,
  ],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <a class="logo" routerLink="/">Bazarek</a>
        <p class="subtitle">Załóż konto za darmo</p>

        @if (emailSent()) {
          <div
            style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:1.5rem;text-align:center;"
          >
            <strong>Sprawdź swoją skrzynkę pocztową</strong>
            <p style="margin:0.5rem 0 0;color:var(--gray-600);font-size:0.875rem;">
              Wysłaliśmy link weryfikacyjny na <strong>{{ registeredEmail() }}</strong
              >. Potwierdź konto, a następnie zaloguj się.
            </p>
            <a routerLink="/login" style="display:inline-block;margin-top:1rem;color:var(--primary);font-weight:600;"
              >Przejdź do logowania</a
            >
          </div>
        } @else {
          @if (errorMessage()) {
            <div class="form-error">{{ errorMessage() }}</div>
          }

          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">
            <mat-form-field appearance="outline">
              <mat-label>Imię i nazwisko</mat-label>
              <input matInput type="text" formControlName="username" placeholder="Jan Kowalski" autocomplete="off" />
              @if (showError('username', 'required')) {
                <mat-error>Imię i nazwisko jest wymagane</mat-error>
              }
              @if (showError('username', 'minlength')) {
                <mat-error>Min. 2 znaki</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="jan@example.com" autocomplete="off" />
              @if (showError('email', 'required')) {
                <mat-error>Email jest wymagany</mat-error>
              }
              @if (showError('email', 'email')) {
                <mat-error>Nieprawidłowy format email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Hasło</mat-label>
              <input
                matInput
                type="password"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="new-password"
              />
              @if (showError('password', 'required')) {
                <mat-error>Hasło jest wymagane</mat-error>
              }
              @if (showError('password', 'minlength')) {
                <mat-error>Min. 6 znaków</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Powtórz hasło</mat-label>
              <input
                matInput
                type="password"
                formControlName="confirmPassword"
                placeholder="••••••••"
                autocomplete="new-password"
              />
              @if (form.hasError('passwordsMismatch') && form.controls.confirmPassword.touched) {
                <mat-error>Hasła nie są takie same</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Załóż konto
              }
            </button>
          </form>

          <div class="auth-footer">Masz już konto? <a routerLink="/login">Zaloguj się</a></div>
        }
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
  protected readonly emailSent = signal(false);
  protected readonly registeredEmail = signal('');

  protected readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: matchPasswords },
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
      next: (res: RegisterResponse) => {
        if (res.requiresVerification) {
          this.loading.set(false);
          this.registeredEmail.set(email);
          this.emailSent.set(true);
          return;
        }
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
