import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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

      .form-info {
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
        <p class="subtitle">Zresetuj hasło</p>

        @if (sent()) {
          <div class="form-info">{{ message() }}</div>
          <div class="auth-footer"><a routerLink="/login">Wróć do logowania</a></div>
        } @else {
          <p class="subtitle">Podaj adres email — wyślemy link do ustawienia nowego hasła.</p>
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

            <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Wyślij link
              }
            </button>
          </form>

          <div class="auth-footer"><a routerLink="/login">Wróć do logowania</a></div>
        }
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly sent = signal(false);
  protected readonly message = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  showError(field: 'email', error: string): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.touched && ctrl.hasError(error);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.sent.set(true);
        this.message.set(res.message);
      },
      error: () => {
        this.loading.set(false);
        // Ta sama wiadomość co przy sukcesie, aby nie ujawniać istnienia konta.
        this.sent.set(true);
        this.message.set('Jeśli konto istnieje, link do resetu hasła został wysłany.');
      },
    });
  }
}
