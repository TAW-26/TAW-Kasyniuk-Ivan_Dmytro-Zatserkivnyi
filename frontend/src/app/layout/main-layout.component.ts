import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../core/services/auth.service';
import { FavoritesService } from '../core/services/favorites.service';
import { MessagesService } from '../core/services/messages.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        width: 260px;
        height: 100vh;
        background: var(--card);
        border-right: 1px solid var(--border);
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        z-index: 100;
        transition: transform 0.3s ease;
      }

      .logo {
        display: block;
        padding: 1.5rem;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary);
        border-bottom: 1px solid var(--gray-200);
      }

      .nav-menu {
        flex: 1;
        padding: 1.5rem 0;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        margin: 0.25rem 0;
        color: var(--gray-700);
        transition: all 0.2s;
        cursor: pointer;
        position: relative;
      }

      .nav-item:hover {
        background: var(--gray-100);
        color: var(--primary);
      }

      .nav-item.active {
        background: var(--primary-50);
        color: var(--primary);
        border-left: 3px solid var(--primary);
      }

      .favorite-badge {
        background: var(--primary);
        color: #fff;
        border-radius: 20px;
        padding: 0.125rem 0.5rem;
        font-size: 0.7rem;
        margin-left: auto;
        min-width: 1.4rem;
        text-align: center;
        border: 1px solid var(--primary);
      }

      .user-section {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--gray-200);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: var(--text);
        cursor: pointer;
        transition: background 0.2s;
      }

      .user-section:hover {
        background: var(--gray-100);
      }

      .avatar {
        width: 40px;
        height: 40px;
        background: var(--primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 600;
        flex-shrink: 0;
        overflow: hidden;
      }

      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .user-info {
        flex: 1;
        min-width: 0;
      }

      .user-name {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-email {
        font-size: 0.75rem;
        color: var(--gray-500);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .logout-btn {
        margin-left: auto;
        background: transparent;
        border: 1px solid var(--gray-300);
        color: var(--gray-700);
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.35rem 0.75rem;
        border-radius: var(--radius);
      }

      .logout-btn:hover {
        background: var(--gray-100);
        color: var(--danger);
        border-color: var(--danger);
      }

      .main-content {
        margin-left: 260px;
        min-height: 100vh;
      }

      .header {
        background: var(--card);
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--gray-200);
        position: sticky;
        top: 0;
        z-index: 90;
      }

      .header-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        margin-left: auto;
      }

      .nav-item mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }

      .mobile-menu-btn {
        display: none;
        background: none;
        border: none;
        color: var(--text);
        cursor: pointer;
        padding: 0;
      }

      .backdrop {
        display: none;
      }

      @media (max-width: 768px) {
        .sidebar {
          transform: translateX(-100%);
        }
        .sidebar.mobile-open {
          transform: translateX(0);
        }
        .main-content {
          margin-left: 0;
        }
        .mobile-menu-btn {
          display: inline-flex;
          align-items: center;
        }
        .backdrop {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 99;
        }
      }
    `,
  ],
  template: `
    @if (mobileOpen()) {
      <div class="backdrop" (click)="closeMobileMenu()"></div>
    }
    <div class="sidebar" [class.mobile-open]="mobileOpen()">
      <a class="logo" routerLink="/" (click)="closeMobileMenu()">Bazarek</a>
      <div class="nav-menu">
        <a routerLink="/ads" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          <mat-icon>storefront</mat-icon> Ogłoszenia
        </a>
        <a routerLink="/favorites" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          <mat-icon>favorite</mat-icon> Ulubione
          @if (favorites.count() > 0) {
            <span class="favorite-badge">{{ favorites.count() }}</span>
          }
        </a>
        <a routerLink="/messages" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          <mat-icon>chat_bubble</mat-icon> Wiadomości
          @if (messagesService.unreadCount() > 0) {
            <span class="favorite-badge">{{ messagesService.unreadCount() }}</span>
          }
        </a>
        <a routerLink="/add-ad" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          <mat-icon>add_circle</mat-icon> Dodaj ogłoszenie
        </a>
        <a routerLink="/profile" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          <mat-icon>person</mat-icon> Profil
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          <mat-icon>settings</mat-icon> Ustawienia
        </a>
      </div>
      <a class="user-section" routerLink="/profile" (click)="closeMobileMenu()">
        <div class="avatar">
          @if (auth.user()?.avatar) {
            <img [src]="auth.user()!.avatar" alt="Avatar" />
          } @else {
            {{ initials() }}
          }
        </div>
        <div class="user-info">
          <div class="user-name">{{ auth.user()?.username }}</div>
          <div class="user-email">{{ auth.user()?.email }}</div>
        </div>
        <button class="logout-btn" title="Wyloguj się" (click)="logout($event)">Wyloguj</button>
      </a>
    </div>

    <div class="main-content">
      <div class="header">
        <button class="mobile-menu-btn" aria-label="Otwórz menu" (click)="toggleMobileMenu()">
          <mat-icon>menu</mat-icon>
        </button>
        <div class="header-actions">
          <button
            mat-icon-button
            [matTooltip]="darkMode() ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'"
            [attr.aria-label]="darkMode() ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'"
            (click)="toggleTheme()"
          >
            <mat-icon>{{ darkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          <a class="btn btn-primary" routerLink="/add-ad">Dodaj ogłoszenie</a>
        </div>
      </div>
      <router-outlet />
    </div>
  `,
})
export class MainLayoutComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly favorites = inject(FavoritesService);
  protected readonly messagesService = inject(MessagesService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);

  protected readonly mobileOpen = signal(false);
  protected readonly darkMode = this.theme.darkMode;

  ngOnInit(): void {
    this.messagesService.refreshUnreadCount();
  }

  protected readonly initials = computed(() => {
    const user = this.auth.user();
    if (!user) return 'U';
    const parts = user.username.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return user.username.substring(0, 2).toUpperCase();
  });

  toggleMobileMenu(): void {
    this.mobileOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  logout(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
