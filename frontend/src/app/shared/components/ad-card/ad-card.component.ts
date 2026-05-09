import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Listing } from '../../../core/models/listing.model';
import { Category } from '../../../core/models/category.model';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ListingService } from '../../../core/services/listing.service';

@Component({
  selector: 'app-ad-card',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .ad-image-placeholder {
      color: var(--text-muted);
      font-size: 0.9rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .admin-delete-btn {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      z-index: 10;
      background: var(--danger) !important;
      color: #fff !important;
      min-width: unset;
      padding: 0 8px;
    }
    .ad-status-sold {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    :host-context(.is-new) .ad-card,
    .ad-card.is-new {
      border-color: var(--primary);
      box-shadow: 0 0 0 1px var(--primary), var(--shadow-sm);
    }
    .ad-card.is-new:hover {
      box-shadow: 0 0 0 2px var(--primary), var(--shadow-md);
    }
    .badge-new {
      display: inline-block;
      background: var(--primary);
      color: #fff;
      padding: 0.15rem 0.55rem;
      border-radius: 20px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 0.35rem;
    }
  `],
  template: `
    <div class="ad-card" [class.is-new]="isNew()" (click)="open()">
      <div class="ad-image">
        @if (firstImage()) {
          <img [src]="firstImage()" [alt]="ad().title" />
        } @else {
          <span class="ad-image-placeholder">Brak zdjęcia</span>
        }
        <span class="ad-category">{{ categoryName() }}</span>
        @if (ad().status === 'sold') {
          <span class="ad-status-sold">Sprzedane</span>
        }
        @if (auth.isAdmin()) {
          <button
            mat-flat-button
            class="admin-delete-btn"
            type="button"
            (click)="adminDelete($event)"
            title="Usuń ogłoszenie (admin)">
            <mat-icon style="font-size:16px;height:16px;width:16px;">delete</mat-icon>
          </button>
        }
        @if (auth.isLoggedIn()) {
          <button
            type="button"
            class="ad-favorite-icon"
            [class.active]="isFav()"
            (click)="toggleFav($event)"
            [attr.aria-label]="isFav() ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'">
            {{ isFav() ? '❤️' : '🤍' }}
          </button>
        }
      </div>
      <div class="ad-content">
        @if (isNew() && ad().status !== 'sold') {
          <span class="badge-new">Nowe</span>
        }
        <div class="ad-title">{{ ad().title }}</div>
        <div class="ad-price">{{ formattedPrice() }}</div>
        <div class="ad-location">{{ ad().location || '—' }}</div>
        <div class="ad-date">Dodano: {{ formattedDate() }}</div>
      </div>
    </div>
  `,
})
export class AdCardComponent {
  readonly ad = input.required<Listing>();
  readonly deleted = output<string>();

  protected readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesService);
  private readonly listingService = inject(ListingService);
  private readonly router = inject(Router);

  protected readonly isFav = computed(() => this.favorites.isFavorite(this.ad()._id));

  protected readonly isNew = computed(() => {
    const created = this.ad().createdAt;
    if (!created) return false;
    return Date.now() - new Date(created).getTime() < 24 * 60 * 60 * 1000;
  });

  protected readonly categoryName = computed<string>(() => {
    const cat = this.ad().category_id;
    if (!cat) return 'Inne';
    return typeof cat === 'string' ? '—' : (cat as Category).name;
  });

  protected readonly firstImage = computed<string | null>(() => {
    const list = this.ad().images ?? [];
    return list.length > 0 ? list[0] : null;
  });

  protected readonly formattedPrice = computed(() => {
    const value = this.ad().price ?? 0;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(value);
  });

  protected readonly formattedDate = computed(() => {
    const d = this.ad().createdAt;
    if (!d) return '';
    return new Date(d).toLocaleDateString('pl-PL');
  });

  open(): void {
    this.router.navigate(['/ads', this.ad()._id]);
  }

  toggleFav(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.favorites.toggle(this.ad()._id);
  }

  adminDelete(event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm('Usuń to ogłoszenie jako administrator?')) return;
    this.listingService.remove(this.ad()._id).subscribe({
      next: () => {
        this.favorites.removeId(this.ad()._id);
        this.deleted.emit(this.ad()._id);
      },
    });
  }
}
