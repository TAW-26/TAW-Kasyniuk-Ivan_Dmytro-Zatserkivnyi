import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
import { ThemeService } from '../../core/services/theme.service';

interface HealthResponse {
  status: 'ok' | 'degraded' | string;
  db: string;
  uptime: number;
  timestamp: string;
}

interface MonitoringEvent {
  event: string;
  message: string;
  time: string;
  payload: Record<string, unknown>;
}

interface EventsResponse {
  count: number;
  events: MonitoringEvent[];
}

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
  styles: [
    `
      .content-section {
        padding: 2rem;
      }
      @media (max-width: 768px) {
        .content-section {
          padding: 1rem;
        }
      }
      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
      }
      .settings-card {
        background: var(--card);
        border: 1px solid var(--border);
        padding: 2rem;
        border-radius: var(--radius-lg);
        max-width: 600px;
        box-shadow: var(--shadow-sm);
      }
      hr {
        border: none;
        border-top: 1px solid var(--gray-200);
        margin: 1.25rem 0;
      }
      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0;
      }
      .checkbox-row input[type='checkbox'] {
        width: auto;
      }
      .tab-section {
        margin-top: 1.5rem;
      }
      .tab-section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 1rem;
      }
      .tab-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .field-error {
        color: var(--danger);
        font-size: 0.75rem;
        margin-top: -0.5rem;
        margin-bottom: 0.25rem;
      }
      .monitoring-tab {
        margin-top: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .admin-banner {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        background: var(--gray-50);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 0.85rem 1rem;
      }
      .admin-banner mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: var(--primary);
      }
      .admin-banner-title {
        font-weight: 600;
      }
      .admin-banner-sub {
        font-size: 0.85rem;
        color: var(--gray-600);
      }
      .health-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 0.75rem 1rem;
      }
      .health-card.health-ok {
        border-left: 4px solid var(--success);
      }
      .health-card.health-bad {
        border-left: 4px solid var(--danger);
      }
      .health-label {
        font-weight: 600;
        margin-right: 0.5rem;
      }
      .health-value {
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        color: var(--gray-700);
      }
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 0.75rem;
      }
      .tool-card {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--card);
        text-decoration: none;
        color: var(--text);
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .tool-card:hover {
        border-color: var(--primary);
        box-shadow: var(--shadow-sm);
      }
      .tool-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--primary);
      }
      .tool-name {
        font-weight: 600;
      }
      .tool-desc {
        font-size: 0.8rem;
        color: var(--gray-600);
        line-height: 1.35;
      }
      .tool-url {
        font-family: 'Courier New', monospace;
        font-size: 0.75rem;
        color: var(--gray-500);
        margin-top: 0.25rem;
      }
      .metrics-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 0.85rem;
      }
      .metrics-list li {
        padding: 0.5rem 0.75rem;
        background: var(--gray-50);
        border: 1px solid var(--gray-200);
        border-radius: var(--radius);
      }
      .metrics-list code {
        background: var(--gray-100);
        padding: 0.05rem 0.35rem;
        border-radius: 3px;
        font-size: 0.85em;
      }
      .logs-hint {
        font-size: 0.85rem;
        color: var(--gray-700);
        line-height: 1.5;
      }
      .logs-hint code {
        background: var(--gray-100);
        padding: 0.05rem 0.35rem;
        border-radius: 3px;
      }
      .events-card {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--card);
        padding: 0.75rem 1rem;
      }
      .events-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: var(--gray-700);
        margin-bottom: 0.5rem;
      }
      .events-empty {
        color: var(--gray-600);
        font-size: 0.85rem;
        font-style: italic;
        margin: 0.5rem 0;
      }
      .events-list {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 320px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .event-row {
        display: grid;
        grid-template-columns: 110px 140px 1fr;
        gap: 0.6rem;
        align-items: center;
        padding: 0.4rem 0.6rem;
        background: var(--gray-50);
        border-radius: 4px;
        font-size: 0.82rem;
      }
      .event-time {
        color: var(--gray-600);
        font-family: 'Courier New', monospace;
        font-size: 0.75rem;
      }
      .event-tag {
        background: var(--primary);
        color: #fff;
        font-size: 0.7rem;
        padding: 0.15rem 0.5rem;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .event-row[data-evt='listing.delete.forbidden'] .event-tag,
      .event-row[data-evt='listing.deleted'] .event-tag {
        background: var(--danger);
      }
      .event-row[data-evt='auth.login'] .event-tag {
        background: var(--success);
      }
      .event-msg {
        color: var(--text);
      }
      @media (max-width: 600px) {
        .event-row {
          grid-template-columns: 1fr;
          gap: 0.15rem;
        }
      }
    `,
  ],
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
                  <input
                    matInput
                    type="password"
                    [(ngModel)]="currentPassword"
                    name="currentPassword"
                    placeholder="Wprowadź aktualne hasło"
                    #curPw="ngModel"
                    required
                  />
                  @if (curPw.touched && curPw.errors?.['required']) {
                    <mat-error>Pole wymagane</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Nowe hasło</mat-label>
                  <input
                    matInput
                    type="password"
                    [(ngModel)]="newPassword"
                    name="newPassword"
                    placeholder="Min. 6 znaków"
                    #newPw="ngModel"
                    required
                    minlength="6"
                  />
                  @if (newPw.touched && newPw.errors?.['required']) {
                    <mat-error>Pole wymagane</mat-error>
                  }
                  @if (newPw.touched && newPw.errors?.['minlength']) {
                    <mat-error>Min. 6 znaków</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Powtórz nowe hasło</mat-label>
                  <input
                    matInput
                    type="password"
                    [(ngModel)]="confirmPassword"
                    name="confirmPassword"
                    placeholder="Powtórz nowe hasło"
                    #confPw="ngModel"
                    required
                  />
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
              <button mat-stroked-button (click)="logout()"><mat-icon>logout</mat-icon> Wyloguj się</button>
              <button mat-stroked-button color="warn" (click)="deleteAccount()">
                <mat-icon>delete_forever</mat-icon> Usuń konto
              </button>
            </div>
          </mat-tab>

          <mat-tab label="Powiadomienia">
            <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <mat-checkbox [(ngModel)]="notifEmailMessages"> Powiadomienia email o nowych wiadomościach </mat-checkbox>
              <mat-checkbox [(ngModel)]="notifSimilar"> Alerty o podobnych ogłoszeniach w mojej okolicy </mat-checkbox>
              <mat-checkbox [(ngModel)]="notifWeekly"> Tygodniowy raport aktywności </mat-checkbox>
              <mat-checkbox [(ngModel)]="notifPush"> Powiadomienia push o nowych ogłoszeniach </mat-checkbox>
              <button
                mat-flat-button
                color="primary"
                style="margin-top: 0.5rem; width: fit-content;"
                (click)="savePreferences()"
              >
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
              <mat-checkbox [(ngModel)]="privacyHidePhone"> Ukryj numer telefonu w ogłoszeniach </mat-checkbox>
              <mat-checkbox [(ngModel)]="privacyBlockUnknown"> Blokuj nieznane wiadomości </mat-checkbox>
              <mat-checkbox [(ngModel)]="privacyTrustedOnly"> Pokaż tylko zaufanym użytkownikom </mat-checkbox>
              <button
                mat-flat-button
                color="primary"
                style="margin-top: 0.5rem; width: fit-content;"
                (click)="savePreferences()"
              >
                Zapisz preferencje
              </button>
            </div>
          </mat-tab>

          @if (auth.isAdmin()) {
            <mat-tab label="Monitoring">
              <div class="monitoring-tab">
                <div class="admin-banner">
                  <mat-icon>shield</mat-icon>
                  <div>
                    <div class="admin-banner-title">Panel administratora</div>
                    <div class="admin-banner-sub">
                      Ta zakładka jest widoczna tylko dla użytkowników z rolą <strong>admin</strong>.
                    </div>
                  </div>
                </div>

                <div class="health-card" [class.health-ok]="health()?.status === 'ok'" [class.health-bad]="health()?.status && health()?.status !== 'ok'">
                  <div class="health-row">
                    <span class="health-label">Status backendu</span>
                    <span class="health-value">
                      @if (healthLoading()) {
                        Sprawdzanie...
                      } @else if (health()) {
                        {{ health()!.status }} • DB: {{ health()!.db }} • uptime {{ health()!.uptime }}s
                      } @else {
                        Brak połączenia z /health
                      }
                    </span>
                  </div>
                  <button mat-stroked-button (click)="refreshHealth()" [disabled]="healthLoading()">
                    <mat-icon>refresh</mat-icon>
                    Odśwież
                  </button>
                </div>

                <div class="tab-section-title">Narzędzia mojego stosu</div>
                <div class="tools-grid">
                  <a class="tool-card" href="http://localhost:3000" target="_blank" rel="noopener">
                    <mat-icon class="tool-icon">analytics</mat-icon>
                    <div class="tool-name">Grafana</div>
                    <div class="tool-desc">Dashboard z wykresami (request rate, latency, RAM, CPU)</div>
                    <div class="tool-url">localhost:3000</div>
                  </a>
                  <a class="tool-card" href="http://localhost:9090/targets" target="_blank" rel="noopener">
                    <mat-icon class="tool-icon">radar</mat-icon>
                    <div class="tool-name">Prometheus</div>
                    <div class="tool-desc">Status scrape'a, surowe metryki, ad-hoc queries</div>
                    <div class="tool-url">localhost:9090/targets</div>
                  </a>
                  <a class="tool-card" href="http://localhost:5000/health" target="_blank" rel="noopener">
                    <mat-icon class="tool-icon">monitor_heart</mat-icon>
                    <div class="tool-name">Healthcheck</div>
                    <div class="tool-desc">Uptime + status DB (publiczny endpoint dla UptimeRobota)</div>
                    <div class="tool-url">localhost:5000/health</div>
                  </a>
                  <button class="tool-card" type="button" (click)="copyMetricsCmd()">
                    <mat-icon class="tool-icon">content_copy</mat-icon>
                    <div class="tool-name">Skopiuj curl /metrics</div>
                    <div class="tool-desc">Wymagany Bearer METRICS_TOKEN — kopiuje gotowy curl do schowka</div>
                    <div class="tool-url">curl -H "Authorization: Bearer ..."</div>
                  </button>
                  <button class="tool-card" type="button" (click)="copyRssCmd()">
                    <mat-icon class="tool-icon">rss_feed</mat-icon>
                    <div class="tool-name">Skopiuj curl /events.rss</div>
                    <div class="tool-desc">RSS feed ostatnich zdarzeń (login, register, usunięcia, błędy)</div>
                    <div class="tool-url">/api/monitoring/events.rss</div>
                  </button>
                </div>

                <div class="tab-section-title">Ostatnie zdarzenia (RSS)</div>
                <div class="events-card">
                  <div class="events-header">
                    <span>{{ events().length }} zdarzeń w buforze (max 100)</span>
                    <button mat-stroked-button (click)="refreshEvents()" [disabled]="eventsLoading()">
                      <mat-icon>refresh</mat-icon>
                      Odśwież
                    </button>
                  </div>
                  @if (events().length === 0 && !eventsLoading()) {
                    <p class="events-empty">Brak zdarzeń. Zaloguj się ponownie albo usuń ogłoszenie, by je wygenerować.</p>
                  }
                  <ul class="events-list">
                    @for (e of events(); track e.time) {
                      <li class="event-row" [attr.data-evt]="e.event">
                        <div class="event-time">{{ formatTime(e.time) }}</div>
                        <div class="event-tag">{{ e.event }}</div>
                        <div class="event-msg">{{ e.message }}</div>
                      </li>
                    }
                  </ul>
                </div>

                <div class="tab-section-title">Eksponowane metryki</div>
                <ul class="metrics-list">
                  <li><code>http_requests_total</code> — Counter, etykiety: method/route/status_code</li>
                  <li><code>http_request_duration_ms</code> — Histogram, kubełki [5, 10, 25, 50, 100, 250, 500, 1000]</li>
                  <li><code>active_connections</code> — Gauge, aktualnie obsługiwane połączenia</li>
                  <li><code>process_*</code>, <code>nodejs_*</code> — CPU, RSS, heap, event loop lag (z prom-client)</li>
                </ul>

                <div class="tab-section-title">Logi aplikacji</div>
                <p class="logs-hint">
                  Lokalne logi JSON są zapisywane w katalogu <code>backend/logs/</code> z dzienną rotacją (pino + pino-roll).
                  Hasła i tokeny są automatycznie redagowane jako <code>[REDACTED]</code>.
                  Pełny opis: <a href="https://github.com/TAW-26/TAW-Kasyniuk-Ivan_Dmytro-Zatserkivnyi/blob/main/docs/monitoring.md" target="_blank">docs/monitoring.md</a>.
                </p>
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly http = inject(HttpClient);
  private readonly theme = inject(ThemeService);

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

  protected readonly darkMode = this.theme.darkMode;

  protected readonly health = signal<HealthResponse | null>(null);
  protected readonly healthLoading = signal(false);
  protected readonly events = signal<MonitoringEvent[]>([]);
  protected readonly eventsLoading = signal(false);

  ngOnInit(): void {
    if (this.auth.isAdmin()) {
      this.refreshHealth();
      this.refreshEvents();
    }
  }

  refreshEvents(): void {
    this.eventsLoading.set(true);
    this.http.get<EventsResponse>('/api/monitoring/events.json').subscribe({
      next: (res) => {
        this.events.set(res.events);
        this.eventsLoading.set(false);
      },
      error: () => {
        this.events.set([]);
        this.eventsLoading.set(false);
      },
    });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pl-PL');
  }

  copyRssCmd(): void {
    const cmd = 'curl -H "Authorization: Bearer <METRICS_TOKEN>" http://localhost:5000/api/monitoring/events.rss';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(cmd)
        .then(() => this.notifications.show('Skopiowano: curl /events.rss'))
        .catch(() => this.notifications.show('Nie udało się skopiować'));
    } else {
      this.notifications.show(cmd);
    }
  }

  refreshHealth(): void {
    this.healthLoading.set(true);
    this.http.get<HealthResponse>('/health').subscribe({
      next: (res) => {
        this.health.set(res);
        this.healthLoading.set(false);
      },
      error: () => {
        this.health.set(null);
        this.healthLoading.set(false);
      },
    });
  }

  copyMetricsCmd(): void {
    const cmd = 'curl -H "Authorization: Bearer <METRICS_TOKEN>" http://localhost:5000/metrics';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(cmd)
        .then(() => this.notifications.show('Skopiowano: curl /metrics'))
        .catch(() => this.notifications.show('Nie udało się skopiować'));
    } else {
      this.notifications.show(cmd);
    }
  }

  toggleTheme(): void {
    this.theme.toggle();
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
    this.auth.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
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
