import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

type Tab = 'account' | 'notifications' | 'privacy';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .content-section { padding: 2rem; }
    @media (max-width: 768px) { .content-section { padding: 1rem; } }
    .section-header { display: flex; align-items: center; margin-bottom: 1.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 600; }
    .settings-card {
      background: var(--card);
      border: 1px solid var(--border);
      padding: 2rem;
      border-radius: var(--radius-lg);
      max-width: 600px;
      box-shadow: var(--shadow-sm);
    }
    hr { border: none; border-top: 1px solid var(--gray-200); margin: 1.25rem 0; }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0;
    }
    .checkbox-row input[type="checkbox"] {
      width: auto;
    }
    .tab-section { margin-top: 1.5rem; }
    .tab-section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 1rem;
    }
    .tab-actions { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
    .field-error {
      color: var(--danger);
      font-size: 0.75rem;
      margin-top: -0.5rem;
      margin-bottom: 0.25rem;
    }
  `],
  template: `
    <div class="content-section">
      <div class="section-header">
        <div class="section-title">Ustawienia</div>
      </div>

      <div class="settings-card">
        <mat-tab-group>
          <mat-tab label="Konto">
            <div class="tab-section">
              <div class="tab-section-title">Zmiana hasła</div>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Aktualne hasło</mat-label>
                  <input matInput type="password" [(ngModel)]="currentPassword" name="currentPassword"
                    placeholder="Wprowadź aktualne hasło" #curPw="ngModel" required />
                  @if (curPw.touched && curPw.errors?.['required']) {
                    <mat-error>Pole wymagane</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Nowe hasło</mat-label>
                  <input matInput type="password" [(ngModel)]="newPassword" name="newPassword"
                    placeholder="Min. 6 znaków" #newPw="ngModel" required minlength="6" />
                  @if (newPw.touched && newPw.errors?.['required']) {
                    <mat-error>Pole wymagane</mat-error>
                  }
                  @if (newPw.touched && newPw.errors?.['minlength']) {
                    <mat-error>Min. 6 znaków</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Powtórz nowe hasło</mat-label>
                  <input matInput type="password" [(ngModel)]="confirmPassword" name="confirmPassword"
                    placeholder="Powtórz nowe hasło" #confPw="ngModel" required />
                  @if (confPw.touched && confirmPassword && newPassword !== confirmPassword) {
                    <mat-error>Hasła nie są takie same</mat-error>
                  }
                  @if (confPw.touched && confPw.errors?.['required']) {
                    <mat-error>Pole wymagane</mat-error>
                  }
                </mat-form-field>

                <button mat-flat-button color="primary" (click)="changePassword()">Zmień hasło</button>
              </div>
            </div>

            <hr />

            <div class="tab-section-title">Opcje konta</div>
            <div class="tab-actions">
              <button mat-stroked-button (click)="logout()">
                <mat-icon>logout</mat-icon> Wyloguj się
              </button>
              <button mat-stroked-button color="warn" (click)="deleteAccount()">
                <mat-icon>delete_forever</mat-icon> Usuń konto
              </button>
            </div>
          </mat-tab>

          <mat-tab label="Powiadomienia">
            <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <mat-checkbox [(ngModel)]="notifEmailMessages">
                Powiadomienia email o nowych wiadomościach
              </mat-checkbox>
              <mat-checkbox [(ngModel)]="notifSimilar">
                Alerty o podobnych ogłoszeniach w mojej okolicy
              </mat-checkbox>
              <mat-checkbox [(ngModel)]="notifWeekly">
                Tygodniowy raport aktywności
              </mat-checkbox>
              <mat-checkbox [(ngModel)]="notifPush">
                Powiadomienia push o nowych ogłoszeniach
              </mat-checkbox>
              <button mat-flat-button color="primary" style="margin-top: 0.5rem; width: fit-content;" (click)="savePreferences()">
                Zapisz preferencje
              </button>
            </div>
          </mat-tab>

          <mat-tab label="Wygląd">
            <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                <div>
                  <div style="font-weight: 600;">Motyw</div>
                  <div style="color: var(--gray-600); font-size: 0.85rem;">
                    {{ darkMode() ? 'Ciemny' : 'Jasny' }}
                  </div>
                </div>
                <button mat-stroked-button type="button" (click)="toggleTheme()">
                  <mat-icon>{{ darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
                  {{ darkMode() ? 'Włącz jasny' : 'Włącz ciemny' }}
                </button>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Prywatność">
            <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <mat-checkbox [(ngModel)]="privacyHidePhone">
                Ukryj numer telefonu w ogłoszeniach
              </mat-checkbox>
              <mat-checkbox [(ngModel)]="privacyBlockUnknown">
                Blokuj nieznane wiadomości
              </mat-checkbox>
              <mat-checkbox [(ngModel)]="privacyTrustedOnly">
                Pokaż tylko zaufanym użytkownikom
              </mat-checkbox>
              <button mat-flat-button color="primary" style="margin-top: 0.5rem; width: fit-content;" (click)="savePreferences()">
                Zapisz preferencje
              </button>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly activeTab = signal<Tab>('account');

  protected currentPassword = '';
  protected newPassword = '';
  protected confirmPassword = '';

  protected notifEmailMessages = true;
  protected notifSimilar = true;
  protected notifWeekly = false;
  protected notifPush = true;

  protected privacyHidePhone = true;
  protected privacyBlockUnknown = false;
  protected privacyTrustedOnly = false;

  protected readonly darkMode = signal(localStorage.getItem('theme') === 'dark');

  toggleTheme(): void {
    this.darkMode.update((v) => !v);
    localStorage.setItem('theme', this.darkMode() ? 'dark' : 'light');
    if (this.darkMode()) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword) {
      this.notifications.show('Wypełnij wszystkie pola');
      return;
    }
    if (this.newPassword.length < 6) {
      this.notifications.show('Nowe hasło musi mieć min. 6 znaków');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.notifications.show('Hasła nie są takie same');
      return;
    }
    this.auth
      .changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword })
      .subscribe({
        next: () => {
          this.notifications.show('Hasło zostało zmienione');
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        },
        error: (err) => {
          this.notifications.show(err?.error?.message ?? 'Nie udało się zmienić hasła');
        },
      });
  }

  savePreferences(): void {
    this.notifications.show('Preferencje zapisane lokalnie');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  deleteAccount(): void {
    if (!confirm('Czy na pewno chcesz usunąć konto? Ta operacja jest nieodwracalna.')) return;
    this.auth.deleteAccount().subscribe({
      next: () => {
        this.notifications.show('Konto zostało usunięte');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.notifications.show(err?.error?.message ?? 'Nie udało się usunąć konta');
      },
    });
  }
}
