import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { FavoritesService } from '../core/services/favorites.service';
import { MessagesService } from '../core/services/messages.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
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

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text);
    }

    .brand-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: white;
      background: var(--primary);
      padding: 0.15rem 0.5rem;
      border-radius: 20px;
      letter-spacing: 0.05em;
      margin-left: 0.5rem;
      vertical-align: middle;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
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
        display: block;
      }
    }
  `],
  template: `
    <div class="sidebar" [class.mobile-open]="mobileOpen()">
      <a class="logo" routerLink="/" (click)="closeMobileMenu()">Bazarek</a>
      <div class="nav-menu">
        <a routerLink="/ads" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          Ogłoszenia
        </a>
        <a routerLink="/favorites" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          Ulubione
          <span class="favorite-badge">{{ favorites.count() }}</span>
        </a>
        <a routerLink="/messages" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          Wiadomości
          @if (messagesService.unreadCount() > 0) {
            <span class="favorite-badge">{{ messagesService.unreadCount() }}</span>
          }
        </a>
        <a routerLink="/add-ad" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          Dodaj ogłoszenie
        </a>
        <a routerLink="/profile" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          Profil
        </a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item" (click)="closeMobileMenu()">
          Ustawienia
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
        <button class="mobile-menu-btn" (click)="toggleMobileMenu()">Menu</button>
        <span></span>
        <div class="header-actions">
          @if (!auth.user()) {
            <button class="btn btn-outline" type="button" (click)="toggleTheme()">
              {{ darkMode() ? 'Jasny' : 'Ciemny' }}
            </button>
          }
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
  private readonly route = inject(ActivatedRoute);

  protected readonly mobileOpen = signal(false);
  protected readonly darkMode = signal(localStorage.getItem('theme') === 'dark');

  ngOnInit(): void {
    this.messagesService.refreshUnreadCount();
    this.applyTheme();
  }

  toggleTheme(): void {
    this.darkMode.update((v) => !v);
    localStorage.setItem('theme', this.darkMode() ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.darkMode()) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  protected readonly initials = computed(() => {
    const user = this.auth.user();
    if (!user) return 'U';
    const parts = user.username.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return user.username.substring(0, 2).toUpperCase();
  });

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let r = this.route.firstChild;
        while (r?.firstChild) r = r.firstChild;
        return (r?.snapshot?.data?.['title'] as string | undefined) ?? 'Bazarek';
      })
    ),
    { initialValue: 'Bazarek' }
  );

  toggleMobileMenu(): void {
    this.mobileOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  logout(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
