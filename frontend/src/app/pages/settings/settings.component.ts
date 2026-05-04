import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

type Tab = 'account' | 'notifications' | 'privacy';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .content-section { padding: 2rem; }
    @media (max-width: 768px) { .content-section { padding: 1rem; } }
    .section-header { display: flex; align-items: center; margin-bottom: 1.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 600; }
    .settings-card {
      background: white;
      padding: 2rem;
      border-radius: var(--radius-lg);
      max-width: 600px;
      box-shadow: var(--shadow);
    }
    hr { border: none; border-top: 1px solid var(--gray-200); margin: 1rem 0; }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0;
    }
    .checkbox-row input[type="checkbox"] {
      width: auto;
    }
  `],
  template: `
    <div class="content-section">
      <div class="section-header">
        <div class="section-title">Ustawienia</div>
      </div>

      <div class="settings-card">
        <div class="tabs">
          <button class="tab" [class.active]="activeTab() === 'account'" (click)="activeTab.set('account')">
            Konto
          </button>
          <button class="tab" [class.active]="activeTab() === 'notifications'" (click)="activeTab.set('notifications')">
            Powiadomienia
          </button>
          <button class="tab" [class.active]="activeTab() === 'privacy'" (click)="activeTab.set('privacy')">
            Prywatność
          </button>
        </div>

        @if (activeTab() === 'account') {
          <div class="form-grid">
            <div class="form-group">
              <label>Aktualne hasło</label>
              <input type="password" [(ngModel)]="currentPassword" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label>Nowe hasło</label>
              <input type="password" [(ngModel)]="newPassword" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label>Powtórz nowe hasło</label>
              <input type="password" [(ngModel)]="confirmPassword" placeholder="••••••••" />
            </div>
            <button class="btn btn-primary" (click)="changePassword()">Zmień hasło</button>
            <hr />
            <button class="btn btn-secondary" (click)="logout()">Wyloguj się</button>
            <button class="btn btn-danger" (click)="deleteAccount()">Usuń konto</button>
          </div>
        } @else if (activeTab() === 'notifications') {
          <div>
            <div class="checkbox-row">
              <input type="checkbox" id="n1" [(ngModel)]="notifEmailMessages" />
              <label for="n1">Powiadomienia email o nowych wiadomościach</label>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="n2" [(ngModel)]="notifSimilar" />
              <label for="n2">Alerty o podobnych ogłoszeniach w mojej okolicy</label>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="n3" [(ngModel)]="notifWeekly" />
              <label for="n3">Tygodniowy raport aktywności</label>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="n4" [(ngModel)]="notifPush" />
              <label for="n4">Powiadomienia push o nowych ogłoszeniach</label>
            </div>
            <button class="btn btn-primary" style="margin-top: 1rem;" (click)="savePreferences()">
              Zapisz preferencje
            </button>
          </div>
        } @else if (activeTab() === 'privacy') {
          <div>
            <div class="checkbox-row">
              <input type="checkbox" id="p1" [(ngModel)]="privacyHidePhone" />
              <label for="p1">Ukryj numer telefonu w ogłoszeniach</label>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="p2" [(ngModel)]="privacyBlockUnknown" />
              <label for="p2">Blokuj nieznane wiadomości</label>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="p3" [(ngModel)]="privacyTrustedOnly" />
              <label for="p3">Pokaż tylko zaufanym użytkownikom</label>
            </div>
            <button class="btn btn-primary" style="margin-top: 1rem;" (click)="savePreferences()">
              Zapisz preferencje
            </button>
          </div>
        }
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

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword) {
      this.notifications.show('Wypełnij wszystkie pola');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.notifications.show('Hasła nie są takie same');
      return;
    }
    this.notifications.show('Funkcja zmiany hasła wymaga rozszerzenia backendu');
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
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
    this.notifications.show('Funkcja usunięcia konta wymaga rozszerzenia backendu');
  }
}
