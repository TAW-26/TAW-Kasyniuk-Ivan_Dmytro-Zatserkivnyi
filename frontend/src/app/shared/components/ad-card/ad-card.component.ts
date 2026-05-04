import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Listing } from '../../../core/models/listing.model';
import { Category } from '../../../core/models/category.model';
import { FavoritesService } from '../../../core/services/favorites.service';

@Component({
  selector: 'app-ad-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .ad-image-placeholder {
      color: white;
      font-size: 0.9rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .ad-status-sold {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: var(--danger);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
  `],
  template: `
    <div class="ad-card" (click)="open()">
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
        <button
          type="button"
          class="ad-favorite-icon"
          [class.active]="isFav()"
          (click)="toggleFav($event)"
          [attr.aria-label]="isFav() ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'">
          {{ isFav() ? '❤️' : '🤍' }}
        </button>
      </div>
      <div class="ad-content">
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

  private readonly favorites = inject(FavoritesService);
  private readonly router = inject(Router);

  protected readonly isFav = computed(() => this.favorites.isFavorite(this.ad()._id));

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
    this.favorites.toggle(this.ad()._id);
  }
}
