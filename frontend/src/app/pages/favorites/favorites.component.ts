import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Listing } from '../../core/models/listing.model';
import { FavoritesService } from '../../core/services/favorites.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdCardComponent } from '../../shared/components/ad-card/ad-card.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [AdCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .content-section { padding: 2rem; }
    @media (max-width: 768px) {
      .content-section { padding: 1rem; }
      .ads-grid { grid-template-columns: 1fr; }
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .section-title { font-size: 1.25rem; font-weight: 600; }
    .empty-cta { margin-top: 1rem; }
  `],
  template: `
    <div class="content-section">
      <div class="section-header">
        <div class="section-title">Moje ulubione ogłoszenia ({{ favorites.count() }})</div>
        <button class="btn btn-secondary" (click)="clearAll()">Wyczyść wszystkie</button>
      </div>

      @if (loading()) {
        <div class="empty-state">
          <h3>Ładowanie...</h3>
        </div>
      } @else if (favoriteAds().length === 0) {
        <div class="empty-state">
          <h3>Brak ulubionych ogłoszeń</h3>
          <p>Dodaj ogłoszenia do ulubionych, klikając ikonę serca na karcie.</p>
          <button class="btn btn-primary empty-cta" (click)="goToAds()">
            Przeglądaj ogłoszenia
          </button>
        </div>
      } @else {
        <div class="ads-grid">
          @for (ad of favoriteAds(); track ad._id) {
            <app-ad-card [ad]="ad" />
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

  protected readonly allAds = signal<Listing[]>([]);
  protected readonly loading = signal(true);

  protected readonly favoriteAds = computed(() => {
    const ids = this.favorites.favorites();
    return this.allAds().filter((ad) => ids.includes(ad._id));
  });

  ngOnInit(): void {
    this.listingService.getAll().subscribe({
      next: (list) => {
        this.allAds.set(list);
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
      this.notifications.show('Wszystkie ulubione zostały usunięte');
    }
  }

  goToAds(): void {
    this.router.navigate(['/ads']);
  }
}
