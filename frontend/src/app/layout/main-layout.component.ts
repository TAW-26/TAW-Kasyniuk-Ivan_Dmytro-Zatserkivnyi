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
      background: white;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      z-index: 100;
      transition: transform 0.3s ease;
    }

    .logo {
      padding: 1.5rem;
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
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
      background: linear-gradient(90deg, rgba(37, 99, 235, 0.1) 0%, transparent 100%);
      color: var(--primary);
      border-left: 3px solid var(--primary);
    }

    .favorite-badge {
      background: var(--danger);
      color: white;
      border-radius: 20px;
      padding: 0.125rem 0.5rem;
      font-size: 0.7rem;
      margin-left: auto;
    }

    .user-section {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--gray-200);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      flex-shrink: 0;
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
      background: white;
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
      <div class="logo">LokalneOgłoszenia</div>
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
      <div class="user-section">
        <div class="avatar">{{ initials() }}</div>
        <div class="user-info">
          <div class="user-name">{{ auth.user()?.username }}</div>
          <div class="user-email">{{ auth.user()?.email }}</div>
        </div>
        <button class="logout-btn" title="Wyloguj się" (click)="logout()">Wyloguj</button>
      </div>
    </div>

    <div class="main-content">
      <div class="header">
        <button class="mobile-menu-btn" (click)="toggleMobileMenu()">Menu</button>
        <h1 class="page-title">{{ pageTitle() }}</h1>
        <div class="header-actions">
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

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let r = this.route.firstChild;
        while (r?.firstChild) r = r.firstChild;
        return (r?.snapshot?.data?.['title'] as string | undefined) ?? 'LokalneOgłoszenia';
      })
    ),
    { initialValue: 'LokalneOgłoszenia' }
  );

  toggleMobileMenu(): void {
    this.mobileOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
