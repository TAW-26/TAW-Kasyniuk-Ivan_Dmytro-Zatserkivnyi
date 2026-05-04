import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Listing } from '../../core/models/listing.model';
import { Category } from '../../core/models/category.model';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .content-section { padding: 2rem; }
    @media (max-width: 768px) { .content-section { padding: 1rem; } }
    .section-header { display: flex; align-items: center; margin-bottom: 1.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 600; }
    .profile-card {
      background: white;
      padding: 2rem;
      border-radius: var(--radius-lg);
      max-width: 600px;
      box-shadow: var(--shadow);
    }
    .profile-header {
      display: flex;
      gap: 2rem;
      align-items: center;
      margin-bottom: 2rem;
    }
    .avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 2rem;
      flex-shrink: 0;
    }
    .my-listings {
      margin-top: 2rem;
      max-width: 600px;
      background: white;
      padding: 2rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
    }
    .listing-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--gray-100);
    }
    .listing-row:last-child { border-bottom: none; }
    .listing-row-info { flex: 1; min-width: 0; }
    .listing-row-title { font-weight: 600; }
    .listing-row-meta { font-size: 0.8rem; color: var(--gray-500); }
    .my-listings-title { margin-bottom: 1rem; }
    .muted { color: var(--gray-600); }
    .muted.small { color: var(--gray-500); font-size: 0.875rem; }
  `],
  template: `
    <div class="content-section">
      <div class="section-header">
        <div class="section-title">Mój profil</div>
      </div>

      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar">{{ initials() }}</div>
          <div>
            <h3>{{ auth.user()?.username }}</h3>
            <p class="muted">{{ auth.user()?.email }}</p>
            @if (auth.user()?.phone) {
              <p class="muted">Telefon: {{ auth.user()?.phone }}</p>
            }
            <p class="muted small">
              Rola: {{ auth.user()?.role === 'admin' ? 'Administrator' : 'Użytkownik' }}
            </p>
          </div>
        </div>

        <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
          <div class="form-group">
            <label>Imię i nazwisko</label>
            <input type="text" formControlName="username" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" formControlName="email" readonly />
            <small class="muted small">Email nie może być zmieniony</small>
          </div>
          <div class="form-group">
            <label>Telefon</label>
            <input type="tel" formControlName="phone" placeholder="+48 123 456 789" />
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Zapisywanie...' : 'Zapisz zmiany' }}
          </button>
        </form>
      </div>

      <div class="my-listings">
        <h3 class="my-listings-title">Moje ogłoszenia ({{ myListings().length }})</h3>
        @if (loadingListings()) {
          <p class="muted">Ładowanie...</p>
        } @else if (myListings().length === 0) {
          <p class="muted">Nie masz jeszcze żadnych ogłoszeń.</p>
        } @else {
          @for (listing of myListings(); track listing._id) {
            <div class="listing-row">
              <div class="listing-row-info">
                <div class="listing-row-title">{{ listing.title }}</div>
                <div class="listing-row-meta">
                  {{ formatPrice(listing.price) }} · {{ categoryName(listing) }} · {{ listing.status }}
                </div>
              </div>
              <button class="btn btn-danger" (click)="deleteListing(listing._id)">Usuń</button>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);
  private readonly listingService = inject(ListingService);
  private readonly favorites = inject(FavoritesService);
  private readonly notifications = inject(NotificationService);

  protected readonly myListings = signal<Listing[]>([]);
  protected readonly loadingListings = signal(true);
  protected readonly saving = signal(false);

  protected readonly initials = computed(() => {
    const user = this.auth.user();
    if (!user) return 'U';
    const parts = user.username.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return user.username.substring(0, 2).toUpperCase();
  });

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    email: [''],
    phone: [''],
  });

  ngOnInit(): void {
    this.patchFromUser();
    this.auth.fetchMe().subscribe({
      next: () => this.patchFromUser(),
      error: () => {
        // ignore — keep local snapshot
      },
    });
    this.loadMyListings();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.auth
      .updateProfile({ username: value.username.trim(), phone: value.phone.trim() })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.patchFromUser();
          this.notifications.show('Profil zaktualizowany');
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.notifications.show(err.error?.message ?? 'Nie udało się zaktualizować profilu');
        },
      });
  }

  private patchFromUser(): void {
    const user = this.auth.user();
    if (!user) return;
    this.form.patchValue({
      username: user.username,
      email: user.email,
      phone: user.phone ?? '',
    });
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  categoryName(listing: Listing): string {
    const cat = listing.category_id;
    return typeof cat === 'string' ? '—' : (cat as Category).name;
  }

  deleteListing(id: string): void {
    if (!confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) return;
    this.listingService.remove(id).subscribe({
      next: () => {
        this.myListings.update((list) => list.filter((l) => l._id !== id));
        this.favorites.removeId(id);
        this.notifications.show('Ogłoszenie usunięte');
      },
      error: () => this.notifications.show('Nie udało się usunąć ogłoszenia'),
    });
  }

  private loadMyListings(): void {
    this.listingService.getMine().subscribe({
      next: (list) => {
        this.myListings.set(list);
        this.loadingListings.set(false);
      },
      error: () => {
        this.loadingListings.set(false);
        this.notifications.show('Nie udało się pobrać Twoich ogłoszeń');
      },
    });
  }
}
