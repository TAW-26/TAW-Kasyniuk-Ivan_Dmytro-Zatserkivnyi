import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Listing } from '../../core/models/listing.model';
import { FavoritesService } from '../../core/services/favorites.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdCardComponent } from '../../shared/components/ad-card/ad-card.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [AdCardComponent, MatButtonModule, MatIconModule],
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
        .ads-grid {
          grid-template-columns: 1fr;
        }
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
      }
      .empty-cta {
        margin-top: 1rem;
      }
    `,
  ],
  template: `
    <div class="content-section">
      <div class="section-header">
        <div class="section-title">Moje ulubione ogłoszenia ({{ favorites.count() }})</div>
        <button mat-stroked-button color="warn" (click)="clearAll()">
          <mat-icon>delete_sweep</mat-icon> Wyczyść wszystkie
        </button>
      </div>

      @if (loading()) {
        <div class="ads-grid">
          @for (s of [1, 2, 3]; track s) {
            <div class="skeleton-card">
              <div class="skeleton skeleton-image"></div>
              <div class="skeleton-body">
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line short"></div>
                <div class="skeleton skeleton-line price"></div>
              </div>
            </div>
          }
        </div>
      } @else if (favoriteAds().length === 0) {
        <div class="empty-state">
          <svg class="empty-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill="var(--gray-100)" />
            <path
              d="M100 145 L70 115 C55 100 55 80 70 70 C85 60 100 70 100 85 C100 70 115 60 130 70 C145 80 145 100 130 115 Z"
              stroke="var(--danger)"
              stroke-width="5"
              fill="none"
              stroke-linejoin="round"
            />
          </svg>
          <h3>Brak ulubionych ogłoszeń</h3>
          <p>Dodaj ogłoszenia do ulubionych, klikając ikonę serca na karcie.</p>
          <button mat-flat-button color="primary" class="empty-cta" (click)="goToAds()">
            <mat-icon>search</mat-icon> Przeglądaj ogłoszenia
          </button>
        </div>
      } @else {
        <div class="ads-grid">
          @for (ad of favoriteAds(); track ad._id) {
            <app-ad-card [ad]="ad" (deleted)="onDeleted($event)" />
          }
        </div>
      }
    </div>
  `,
})
export class FavoritesComponent implements OnInit {
  private readonly listingService = inject(ListingService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  protected readonly favorites = inject(FavoritesService);

  protected readonly favoriteAds = signal<Listing[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    const ids = this.favorites.favorites();
    if (ids.length === 0) {
      this.loading.set(false);
      return;
    }
    this.listingService.getAll({ ids, limit: Math.max(ids.length, 1) }).subscribe({
      next: (list) => {
        this.favoriteAds.set(list);
        this.favorites.syncWithExisting(list.map((ad) => ad._id));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('Nie udało się pobrać ogłoszeń');
      },
    });
  }

  clearAll(): void {
    if (this.favorites.count() === 0) {
      this.notifications.show('Brak ulubionych ogłoszeń do usunięcia');
      return;
    }
    if (confirm('Czy na pewno chcesz usunąć wszystkie ogłoszenia z ulubionych?')) {
      this.favorites.clear();
      this.favoriteAds.set([]);
      this.notifications.show('Wszystkie ulubione zostały usunięte');
    }
  }

  onDeleted(id: string): void {
    this.favoriteAds.update((list) => list.filter((ad) => ad._id !== id));
    this.favorites.removeId(id);
  }

  goToAds(): void {
    this.router.navigate(['/ads']);
  }
}
