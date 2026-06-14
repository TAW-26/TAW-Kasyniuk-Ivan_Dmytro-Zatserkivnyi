import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
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

      .form-error {
        background: var(--surface);
        color: var(--danger);
        border: 1px solid var(--border);
        padding: 0.625rem 0.75rem;
        border-radius: var(--radius);
        margin-bottom: 1rem;
        font-size: 0.875rem;
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
        <p class="subtitle">Ustaw nowe hasło</p>

        @if (done()) {
          <div class="form-info">{{ message() }}</div>
          <div class="auth-footer"><a routerLink="/login">Przejdź do logowania</a></div>
        } @else if (!token()) {
          <div class="form-error">Link do resetu hasła nie zawiera tokenu lub jest nieprawidłowy.</div>
          <div class="auth-footer"><a routerLink="/forgot-password">Poproś o nowy link</a></div>
        } @else {
          @if (errorMessage()) {
            <div class="form-error">{{ errorMessage() }}</div>
          }
          <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Nowe hasło</mat-label>
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
                <mat-error>Hasło musi mieć min. 6 znaków</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Powtórz hasło</mat-label>
              <input
                matInput
                type="password"
                formControlName="confirm"
                placeholder="••••••••"
                autocomplete="new-password"
              />
              @if (form.hasError('mismatch') && form.controls.confirm.touched) {
                <mat-error>Hasła nie są takie same</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Zmień hasło
              }
            </button>
          </form>

          <div class="auth-footer"><a routerLink="/login">Wróć do logowania</a></div>
        }
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly done = signal(false);
  protected readonly token = signal<string | null>(null);
  protected readonly message = signal('');
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  ngOnInit(): void {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
  }

  showError(field: 'password' | 'confirm', error: string): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.touched && ctrl.hasError(error);
  }

  submit(): void {
    const token = this.token();
    if (!token || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.auth.resetPassword(token, this.form.getRawValue().password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.done.set(true);
        this.message.set(res.message);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Nie udało się zresetować hasła. Link mógł wygasnąć.');
      },
    });
  }
}
