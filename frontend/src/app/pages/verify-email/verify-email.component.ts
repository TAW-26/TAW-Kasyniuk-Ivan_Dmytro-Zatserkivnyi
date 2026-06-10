import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .verify-wrapper {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: var(--bg);
      }

      .verify-content {
        width: min(100%, 520px);
        text-align: center;
        color: var(--text);
      }

      h1 {
        margin-bottom: 0.75rem;
      }

      p {
        color: var(--gray-600);
        margin-bottom: 1.5rem;
      }

      mat-spinner {
        margin: 0 auto 1.5rem;
      }
    `,
  ],
  template: `
    <main class="verify-wrapper">
      <section class="verify-content">
        @if (loading()) {
          <mat-spinner diameter="42"></mat-spinner>
          <h1>Weryfikujemy adres email</h1>
          <p>To potrwa tylko chwilę.</p>
        } @else if (verified()) {
          <h1>Email został zweryfikowany</h1>
          <p>{{ message() }}</p>
          <a mat-flat-button color="primary" routerLink="/login">Przejdź do logowania</a>
        } @else {
          <h1>Nie udało się zweryfikować emaila</h1>
          <p>{{ message() }}</p>
          <a mat-stroked-button routerLink="/register">Wróć do rejestracji</a>
        }
      </section>
    </main>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly verified = signal(false);
  protected readonly message = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.message.set('Link weryfikacyjny nie zawiera tokenu.');
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.verified.set(true);
        this.message.set(response.message);
      },
      error: (error) => {
        this.loading.set(false);
        this.message.set(error?.error?.message ?? 'Link weryfikacyjny jest nieprawidłowy lub wygasł.');
      },
    });
  }
}
