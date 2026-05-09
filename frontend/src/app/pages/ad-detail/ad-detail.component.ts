import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Listing } from '../../core/models/listing.model';
import { Category } from '../../core/models/category.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-ad-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .public-shell {
        min-height: 100vh;
        background: var(--bg);
      }
      .topbar {
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        padding: 1rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        position: sticky;
        top: 0;
        z-index: 50;
      }
      .topbar-brand {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text);
      }
      .topbar-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .topbar-actions .username {
        color: var(--gray-700);
        font-weight: 500;
        margin-right: 0.5rem;
      }
      .content-section {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      @media (max-width: 768px) {
        .topbar {
          padding: 0.75rem 1rem;
        }
        .content-section {
          padding: 1rem;
        }
      }

      .detail-container {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 2rem;
        max-width: 900px;
        margin: 0 auto;
        box-shadow: var(--shadow);
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .detail-header h2 {
        flex: 1;
      }

      .gallery {
        margin-bottom: 1.5rem;
      }

      .gallery-main {
        width: 100%;
        height: 400px;
        border-radius: var(--radius-lg);
        overflow: hidden;
        background: var(--gray-100);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-size: 1rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .gallery-main img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: var(--gray-100);
      }

      .gallery-thumbs {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.75rem;
        flex-wrap: wrap;
      }

      .gallery-thumb {
        width: 80px;
        height: 80px;
        border-radius: var(--radius);
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        background: var(--gray-100);
        padding: 0;
        transition: border-color 0.2s;
      }

      .gallery-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .gallery-thumb.active {
        border-color: var(--primary);
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
        margin: 0.5rem 0 1.5rem;
        color: var(--gray-600);
        font-size: 0.875rem;
      }

      .description {
        margin: 1rem 0;
        line-height: 1.6;
        white-space: pre-line;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text);
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 0.55rem 0.85rem;
        cursor: pointer;
        margin-bottom: 1.25rem;
        font-weight: 500;
        font-size: 0.9rem;
        transition:
          background 0.2s,
          border-color 0.2s;
      }

      .back-link:hover {
        background: var(--gray-100);
        border-color: var(--text);
      }

      .back-link mat-icon {
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
      }

      .divider {
        border: none;
        border-top: 1px solid var(--gray-200);
        margin: 1.5rem 0;
      }

      .seller-card {
        background: var(--gray-50);
        padding: 1rem 1.25rem;
        border-radius: var(--radius);
        border: 1px solid var(--gray-200);
      }

      .seller-card .seller-name {
        font-weight: 600;
        margin-bottom: 0.4rem;
      }

      .seller-contact {
        color: var(--gray-700);
        font-size: 0.9rem;
        margin-top: 0.25rem;
      }

      .badge-sold {
        background: var(--surface);
        color: var(--text);
        border: 1px solid var(--border);
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .badges-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .badges-row .badge {
        display: inline-block;
      }
    `,
  ],
  template: `
    <div class="public-shell">
      <header class="topbar">
        <a class="topbar-brand" routerLink="/">Bazarek</a>
        <div class="topbar-actions">
          @if (!auth.isLoggedIn()) {
            <a class="btn btn-outline" routerLink="/login">Zaloguj się</a>
            <a class="btn btn-primary" routerLink="/register">Zarejestruj się</a>
          }
        </div>
      </header>

      <div class="content-section">
        <button class="back-link" type="button" (click)="back()">
          <mat-icon>arrow_back</mat-icon>
          Powrót do ogłoszeń
        </button>

        @if (loading()) {
          <div class="empty-state">
            <h3>Ładowanie ogłoszenia...</h3>
          </div>
        } @else if (!listing()) {
          <div class="empty-state">
            <h3>Ogłoszenie nie zostało znalezione</h3>
          </div>
        } @else {
          <div class="detail-container">
            <div class="detail-header">
              <h2>{{ listing()!.title }}</h2>
              <button
                type="button"
                class="favorite-btn"
                [class.active]="isFav()"
                (click)="toggleFavorite()"
                [attr.aria-label]="isFav() ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'"
              >
                {{ isFav() ? '❤️' : '🤍' }}
              </button>
            </div>

            <div class="gallery">
              <div class="gallery-main">
                @if (currentImage()) {
                  <img [src]="currentImage()" [alt]="listing()!.title" />
                } @else {
                  <span>Brak zdjęć</span>
                }
              </div>
              @if (gallery().length > 1) {
                <div class="gallery-thumbs">
                  @for (img of gallery(); track $index) {
                    <button
                      type="button"
                      class="gallery-thumb"
                      [class.active]="$index === activeIndex()"
                      (click)="activeIndex.set($index)"
                    >
                      <img [src]="img" [alt]="'Zdjęcie ' + ($index + 1)" />
                    </button>
                  }
                </div>
              }
            </div>

            <div class="badges-row">
              <div class="badge badge-active">{{ categoryName() }}</div>
              @if (listing()!.status === 'sold') {
                <span class="badge-sold">Sprzedane</span>
              }
            </div>
            <div class="detail-price">{{ formattedPrice() }}</div>
            <div class="ad-location">{{ listing()!.location || '—' }}</div>

            <div class="meta">
              <span>Dodano: {{ formattedDate() }}</span>
              <span>•</span>
              <span>Status: {{ listing()!.status }}</span>
            </div>

            <p class="description">{{ listing()!.description }}</p>

            <hr class="divider" />

            <div class="seller-card">
              <div class="seller-name">Sprzedawca: {{ sellerName() }}</div>
              @if (sellerPhone()) {
                <div class="seller-contact">Telefon: {{ sellerPhone() }}</div>
              }
            </div>

            <div class="contact-buttons">
              @if (isOwner()) {
                <a class="btn btn-outline" [routerLink]="['/ads', listing()!._id, 'edit']">
                  <mat-icon>edit</mat-icon>
                  Edytuj
                </a>
              }
              @if (canMarkSold()) {
                <button class="btn btn-outline" (click)="markAsSold()" [disabled]="marking()">
                  {{ marking() ? 'Zapisywanie...' : 'Oznacz jako sprzedane' }}
                </button>
              }
              @if (canBuyIntent()) {
                <button class="btn btn-primary" (click)="wantToBuy()">Chcę kupić</button>
              }
              @if (canMessage()) {
                <button class="btn btn-outline" (click)="openChat()">Napisz</button>
              }
              @if (sellerPhone() && !isOwner()) {
                <a class="btn btn-outline" [href]="'tel:' + sellerPhone()">Zadzwoń</a>
              }
              @if (canDelete()) {
                <button mat-stroked-button color="warn" (click)="remove()">
                  <mat-icon>delete</mat-icon>
                  {{ auth.isAdmin() && !isOwner() ? 'Usuń (admin)' : 'Usuń ogłoszenie' }}
                </button>
              }
              @if (!auth.isLoggedIn() && listing()!.status !== 'sold') {
                <a class="btn btn-primary" routerLink="/login">Zaloguj się, aby napisać do sprzedawcy</a>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly listingService = inject(ListingService);
  protected readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly listing = signal<Listing | null>(null);
  protected readonly loading = signal(true);
  protected readonly activeIndex = signal(0);
  protected readonly marking = signal(false);

  protected readonly gallery = computed<string[]>(() => this.listing()?.images ?? []);

  protected readonly currentImage = computed<string | null>(() => {
    const imgs = this.gallery();
    if (imgs.length === 0) return null;
    const i = Math.min(this.activeIndex(), imgs.length - 1);
    return imgs[i];
  });

  protected readonly isFav = computed(() => {
    const ad = this.listing();
    return ad ? this.favorites.isFavorite(ad._id) : false;
  });

  protected readonly categoryName = computed(() => {
    const ad = this.listing();
    if (!ad) return '';
    return typeof ad.category_id === 'string' ? '—' : (ad.category_id as Category).name;
  });

  protected readonly formattedPrice = computed(() => {
    const ad = this.listing();
    if (!ad) return '';
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(ad.price ?? 0);
  });

  protected readonly formattedDate = computed(() => {
    const ad = this.listing();
    return ad?.createdAt ? new Date(ad.createdAt).toLocaleDateString('pl-PL') : '';
  });

  protected readonly sellerName = computed<string>(() => {
    const ad = this.listing();
    if (!ad) return '';
    return typeof ad.user_id === 'string' ? '—' : (ad.user_id as User).username;
  });

  protected readonly sellerPhone = computed<string>(() => {
    const ad = this.listing();
    if (!ad) return '';
    return typeof ad.user_id === 'string' ? '' : ((ad.user_id as User).phone ?? '');
  });

  protected readonly sellerId = computed<string | null>(() => {
    const ad = this.listing();
    if (!ad) return null;
    return typeof ad.user_id === 'string' ? ad.user_id : (ad.user_id as User)._id;
  });

  protected readonly isOwner = computed(() => {
    const me = this.auth.user();
    const seller = this.sellerId();
    return !!(me && seller && me._id === seller);
  });

  protected readonly canMarkSold = computed(() => {
    const ad = this.listing();
    if (!ad) return false;
    return this.isOwner() && ad.status !== 'sold';
  });

  protected readonly canBuyIntent = computed(() => {
    const ad = this.listing();
    if (!ad) return false;
    return this.auth.isLoggedIn() && !this.isOwner() && ad.status !== 'sold';
  });

  protected readonly canMessage = computed(() => {
    return this.auth.isLoggedIn() && !this.isOwner() && !!this.sellerId();
  });

  protected readonly canDelete = computed(() => {
    const ad = this.listing();
    const me = this.auth.user();
    if (!ad || !me) return false;
    if (me.role === 'admin') return true;
    return this.isOwner();
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.listingService.getOne(this.id()).subscribe({
      next: (ad) => {
        this.listing.set(ad);
        this.activeIndex.set(0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('Nie udało się pobrać ogłoszenia');
      },
    });
  }

  toggleFavorite(): void {
    const ad = this.listing();
    if (!ad) return;
    const added = this.favorites.toggle(ad._id);
    this.notifications.show(added ? 'Dodano do ulubionych' : 'Usunięto z ulubionych');
  }

  markAsSold(): void {
    const ad = this.listing();
    if (!ad) return;
    if (!confirm(`Oznaczyć "${ad.title}" jako sprzedane?`)) return;

    this.marking.set(true);
    this.listingService.markAsSold(ad._id).subscribe({
      next: (updated) => {
        this.marking.set(false);
        this.listing.set(updated);
        this.notifications.show('Ogłoszenie oznaczone jako sprzedane');
      },
      error: (err) => {
        this.marking.set(false);
        this.notifications.show(err.error?.message ?? 'Nie udało się zaktualizować ogłoszenia');
      },
    });
  }

  openChat(): void {
    const seller = this.sellerId();
    const ad = this.listing();
    if (!seller || !ad) return;
    this.router.navigate(['/messages'], {
      queryParams: { to: seller, listing: ad._id },
    });
  }

  wantToBuy(): void {
    const seller = this.sellerId();
    const ad = this.listing();
    if (!seller || !ad) return;
    const prefill = `Witam, chciałbym kupić „${ad.title}" za ${this.formattedPrice()}. Czy jest jeszcze dostępne?`;
    this.router.navigate(['/messages'], {
      queryParams: { to: seller, listing: ad._id, prefill },
    });
  }

  remove(): void {
    const ad = this.listing();
    if (!ad) return;
    if (!confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) return;

    this.listingService.remove(ad._id).subscribe({
      next: () => {
        this.favorites.removeId(ad._id);
        this.notifications.show('Ogłoszenie usunięte');
        this.router.navigate(['/ads']);
      },
      error: () => this.notifications.show('Nie udało się usunąć ogłoszenia'),
    });
  }

  back(): void {
    this.router.navigate([this.auth.isLoggedIn() ? '/ads' : '/']);
  }
}
