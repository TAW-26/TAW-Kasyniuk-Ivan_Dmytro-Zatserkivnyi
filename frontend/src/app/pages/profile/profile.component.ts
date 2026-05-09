import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Listing } from '../../core/models/listing.model';
import { Category } from '../../core/models/category.model';
import { AuthService } from '../../core/services/auth.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ImagesService } from '../../core/services/images.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
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
      }
      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
      }
      .profile-card {
        background: var(--card);
        border: 1px solid var(--border);
        padding: 2rem;
        border-radius: var(--radius-lg);
        max-width: 600px;
        box-shadow: var(--shadow-sm);
      }
      .profile-header {
        display: flex;
        gap: 2rem;
        align-items: center;
        margin-bottom: 2rem;
      }
      .avatar {
        position: relative;
        border: 0;
        width: 80px;
        height: 80px;
        background: var(--primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 600;
        font-size: 2rem;
        flex-shrink: 0;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgb(0 0 0 / 0.56);
        color: #fff;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .avatar:hover .avatar-overlay,
      .avatar:focus-visible .avatar-overlay {
        opacity: 1;
      }
      .avatar-overlay mat-icon {
        font-size: 1.6rem;
        width: 1.6rem;
        height: 1.6rem;
      }
      .avatar-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.75rem;
      }
      .remove-avatar-btn {
        width: 36px;
        min-width: 36px;
        height: 36px;
        padding: 0;
      }
      .avatar-actions button:first-of-type {
        display: none;
      }
      .avatar-actions button {
        width: 36px;
        min-width: 36px;
        height: 36px;
        padding: 0;
        font-size: 0;
      }
      .avatar-actions button mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }
      .hidden-input {
        display: none;
      }
      .my-listings {
        margin-top: 2rem;
        max-width: 600px;
        background: var(--card);
        border: 1px solid var(--border);
        padding: 2rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }
      .listing-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--gray-100);
      }
      .listing-row > a,
      .listing-row > button {
        margin-left: 0.5rem;
      }
      .listing-row:last-child {
        border-bottom: none;
      }
      .listing-row-info {
        flex: 1;
        min-width: 0;
      }
      .listing-row-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .listing-row-title {
        font-weight: 600;
      }
      .listing-row-meta {
        font-size: 0.8rem;
        color: var(--gray-500);
      }
      .my-listings-title {
        margin-bottom: 1rem;
      }
      .muted {
        color: var(--gray-600);
      }
      .muted.small {
        color: var(--gray-500);
        font-size: 0.875rem;
      }
    `,
  ],
  template: `
    <div class="content-section">
      <div class="section-header">
        <div class="section-title">Mój profil</div>
      </div>

      <div class="profile-card">
        <div class="profile-header">
          <button class="avatar" type="button" (click)="avatarInput.click()" title="Zmień avatar">
            @if (avatarPreview()) {
              <img [src]="avatarPreview()" alt="Avatar" />
            } @else {
              {{ initials() }}
            }
            <span class="avatar-overlay">
              <mat-icon>photo_camera</mat-icon>
            </span>
          </button>
          <div>
            <h3>{{ auth.user()?.username }}</h3>
            <p class="muted">{{ auth.user()?.email }}</p>
            @if (auth.user()?.phone) {
              <p class="muted">Telefon: {{ auth.user()?.phone }}</p>
            }
            <p class="muted small">Rola: {{ auth.user()?.role === 'admin' ? 'Administrator' : 'Użytkownik' }}</p>
            <div class="avatar-actions">
              <input
                #avatarInput
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden-input"
                (change)="onAvatarSelected($event)"
              />
              <button mat-stroked-button type="button" (click)="avatarInput.click()">
                <mat-icon>photo_camera</mat-icon>
                Zmień avatar
              </button>
              @if (avatarDirty()) {
                <button mat-stroked-button type="button" title="Zapisz avatar" (click)="save()">
                  <mat-icon>check</mat-icon>
                </button>
              }
            </div>
          </div>
        </div>

        <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline">
            <mat-label>Imię i nazwisko</mat-label>
            <input matInput type="text" formControlName="username" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" readonly />
            <mat-hint>Email nie może być zmieniony</mat-hint>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Telefon</mat-label>
            <mat-icon matPrefix>phone</mat-icon>
            <input matInput type="tel" formControlName="phone" placeholder="+48 ___ ___ ___" />
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Zapisz zmiany
            }
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
              <a mat-stroked-button [routerLink]="['/ads', listing._id, 'edit']"> <mat-icon>edit</mat-icon> Edytuj </a>
              <button mat-stroked-button color="warn" (click)="deleteListing(listing._id)">
                <mat-icon>delete</mat-icon> Usuń
              </button>
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
  private readonly imagesService = inject(ImagesService);
  private readonly listingService = inject(ListingService);
  private readonly favorites = inject(FavoritesService);
  private readonly notifications = inject(NotificationService);

  protected readonly myListings = signal<Listing[]>([]);
  protected readonly loadingListings = signal(true);
  protected readonly saving = signal(false);
  protected readonly avatarPreview = signal('');
  protected readonly avatarDirty = signal(false);

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
    avatar: [''],
  });

  ngOnInit(): void {
    this.patchFromUser();
    this.auth.fetchMe().subscribe({
      next: () => this.patchFromUser(),
      error: () => {},
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
      .updateProfile({
        username: value.username.trim(),
        phone: value.phone.trim(),
        avatar: value.avatar,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.avatarDirty.set(false);
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
      avatar: user.avatar ?? '',
    });
    this.avatarPreview.set(user.avatar ?? '');
    this.avatarDirty.set(false);
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.notifications.show('Avatar musi być obrazem PNG, JPG lub WebP');
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.notifications.show('Avatar może mieć maksymalnie 2 MB');
      input.value = '';
      return;
    }

    const avatar = await this.imagesService.fileToDataUrl(file);
    this.avatarPreview.set(avatar);
    this.form.controls.avatar.setValue(avatar);
    this.avatarDirty.set(true);
    input.value = '';
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
