import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Category } from '../../core/models/category.model';
import { Listing, ListingFilters } from '../../core/models/listing.model';
import { CategoryService } from '../../core/services/category.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdCardComponent } from '../../shared/components/ad-card/ad-card.component';
import { StatsMiniComponent } from '../../shared/components/stats-mini/stats-mini.component';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-ads',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AdCardComponent,
    StatsMiniComponent,
    DecimalPipe,
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
        .ads-grid {
          grid-template-columns: 1fr;
        }
      }

      .filter-bar mat-form-field {
        flex: 1;
        min-width: 130px;
      }
      .filter-bar mat-form-field.grow {
        flex: 2;
        min-width: 200px;
      }
      .filter-bar button[mat-stroked-button] {
        height: 56px;
        border-color: var(--border);
        color: var(--text);
        font-size: 0.875rem;
      }
      .filter-bar button[mat-stroked-button]:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: var(--primary-50);
      }
      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
        color: var(--gray-600);
        font-size: 0.875rem;
      }
    `,
  ],
  template: `
    <div class="content-section" style="padding-bottom: 0;">
      <app-stats-mini [activeCount]="ads().length" />
    </div>

    <div class="content-section">
      <form class="filter-bar" [formGroup]="filtersForm" (ngSubmit)="applyFilters()">
        <mat-form-field appearance="outline">
          <mat-label>Kategoria</mat-label>
          <mat-select formControlName="category">
            <mat-option value="">Wszystkie kategorie</mat-option>
            @for (cat of categories(); track cat._id) {
              <mat-option [value]="cat._id">{{ cat.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="grow">
          <mat-label>Szukaj ogłoszeń</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput formControlName="search" placeholder="Wpisz słowo kluczowe..." />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Lokalizacja</mat-label>
          <mat-icon matPrefix>location_on</mat-icon>
          <input matInput formControlName="location" placeholder="Miasto..." />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cena od (zł)</mat-label>
          <input matInput type="number" min="0" formControlName="minPrice" placeholder="0" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cena do (zł)</mat-label>
          <input matInput type="number" min="0" formControlName="maxPrice" placeholder="bez limitu" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sortuj</mat-label>
          <mat-select formControlName="sort">
            <mat-option value="">Najnowsze</mat-option>
            <mat-option value="price_asc">Cena: rosnąco</mat-option>
            <mat-option value="price_desc">Cena: malejąco</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button type="submit"><mat-icon>search</mat-icon> Szukaj</button>
        <button mat-stroked-button type="button" (click)="resetFilters()"><mat-icon>clear</mat-icon> Wyczyść</button>
      </form>

      @if (loading()) {
        <div class="ads-grid">
          @for (s of [1, 2, 3, 4, 5, 6]; track s) {
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
      } @else if (ads().length === 0) {
        <div class="empty-state">
          <svg class="empty-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill="var(--gray-100)" />
            <circle cx="85" cy="85" r="30" stroke="var(--primary)" stroke-width="6" fill="none" />
            <line x1="107" y1="107" x2="135" y2="135" stroke="var(--primary)" stroke-width="6" stroke-linecap="round" />
            <path
              d="M60 140 Q100 160 140 140"
              stroke="var(--gray-400)"
              stroke-width="3"
              fill="none"
              stroke-linecap="round"
            />
          </svg>
          <h3>Brak ogłoszeń spełniających kryteria</h3>
          <p>Spróbuj zmienić filtry lub wyczyścić wyszukiwanie.</p>
        </div>
      } @else {
        <div class="ads-grid">
          @for (ad of ads(); track ad._id) {
            <app-ad-card [ad]="ad" (deleted)="onDeleted($event)" />
          }
        </div>
        @if (totalPages() > 1) {
          <div class="pagination">
            <button mat-stroked-button [disabled]="currentPage() <= 1" (click)="changePage(currentPage() - 1)">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span>Strona {{ currentPage() }} z {{ totalPages() }} ({{ total() | number }} ogłoszeń)</span>
            <button
              mat-stroked-button
              [disabled]="currentPage() >= totalPages()"
              (click)="changePage(currentPage() + 1)"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class AdsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly listingService = inject(ListingService);
  private readonly categoryService = inject(CategoryService);
  private readonly notifications = inject(NotificationService);

  protected readonly ads = signal<Listing[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly total = signal(0);

  protected readonly filtersForm = this.fb.nonNullable.group({
    search: '',
    category: '',
    sort: '',
    location: '',
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
  });

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.notifications.show('Nie udało się pobrać kategorii'),
    });
    this.load();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.load();
  }

  onDeleted(id: string): void {
    this.ads.update((list) => list.filter((ad) => ad._id !== id));
  }

  resetFilters(): void {
    this.filtersForm.reset({ search: '', category: '', sort: '', location: '', minPrice: null, maxPrice: null });
    this.currentPage.set(1);
    this.load();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private load(): void {
    this.loading.set(true);
    const raw = this.filtersForm.getRawValue();
    const filters: ListingFilters = { page: this.currentPage(), limit: 20 };
    if (raw.search) filters.search = raw.search;
    if (raw.category) filters.category = raw.category;
    if (raw.sort === 'price_asc' || raw.sort === 'price_desc') filters.sort = raw.sort;
    if (raw.location) filters.location = raw.location;
    if (raw.minPrice !== null && raw.minPrice !== undefined) filters.minPrice = raw.minPrice;
    if (raw.maxPrice !== null && raw.maxPrice !== undefined) filters.maxPrice = raw.maxPrice;

    this.listingService.getPaged(filters).subscribe({
      next: (res) => {
        this.ads.set(res.listings);
        this.totalPages.set(res.totalPages);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.show('Nie udało się pobrać ogłoszeń');
      },
    });
  }
}
