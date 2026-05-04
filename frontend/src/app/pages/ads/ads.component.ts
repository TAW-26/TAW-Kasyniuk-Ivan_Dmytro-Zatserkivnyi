import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../core/models/category.model';
import { Listing, ListingFilters } from '../../core/models/listing.model';
import { CategoryService } from '../../core/services/category.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdCardComponent } from '../../shared/components/ad-card/ad-card.component';
import { StatsMiniComponent } from '../../shared/components/stats-mini/stats-mini.component';

@Component({
  selector: 'app-ads',
  standalone: true,
  imports: [ReactiveFormsModule, AdCardComponent, StatsMiniComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
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
  `],
  template: `
    <div class="content-section" style="padding-bottom: 0;">
      <app-stats-mini [activeCount]="ads().length" />
    </div>

    <div class="content-section">
      <form class="filter-bar" [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
        <select formControlName="category">
          <option value="">Wszystkie kategorie</option>
          @for (cat of categories(); track cat._id) {
            <option [value]="cat._id">{{ cat.name }}</option>
          }
        </select>
        <input type="text" placeholder="Szukaj ogłoszeń..." formControlName="search" />
        <select formControlName="sort">
          <option value="">Najnowsze</option>
          <option value="price_asc">Cena: rosnąco</option>
          <option value="price_desc">Cena: malejąco</option>
        </select>
        <button class="btn btn-primary" type="submit">Szukaj</button>
        <button class="btn btn-outline" type="button" (click)="resetFilters()">Wyczyść</button>
      </form>

      @if (loading()) {
        <div class="empty-state">
          <h3>Ładowanie ogłoszeń...</h3>
        </div>
      } @else if (ads().length === 0) {
        <div class="empty-state">
          <h3>Brak ogłoszeń spełniających kryteria</h3>
        </div>
      } @else {
        <div class="ads-grid">
          @for (ad of ads(); track ad._id) {
            <app-ad-card [ad]="ad" />
          }
        </div>
      }
    </div>
  `,
})
export class AdsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly listingService = inject(ListingService);
  private readonly categoryService = inject(CategoryService);
  private readonly favorites = inject(FavoritesService);
  private readonly notifications = inject(NotificationService);

  protected readonly ads = signal<Listing[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);

  protected readonly filtersForm = this.fb.nonNullable.group({
    search: '',
    category: '',
    sort: '',
  });

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.notifications.show('Nie udało się pobrać kategorii'),
    });
    this.load();
  }

  applyFilters(): void {
    this.load();
  }

  resetFilters(): void {
    this.filtersForm.reset({ search: '', category: '', sort: '' });
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const raw = this.filtersForm.getRawValue();
    const filters: ListingFilters = {};
    if (raw.search) filters.search = raw.search;
    if (raw.category) filters.category = raw.category;
    if (raw.sort === 'price_asc' || raw.sort === 'price_desc') filters.sort = raw.sort;

    this.listingService.getAll(filters).subscribe({
      next: (list) => {
        this.ads.set(list);
        this.favorites.syncWithExisting(list.map((ad) => ad._id));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('Nie udało się pobrać ogłoszeń');
      },
    });
  }
}
