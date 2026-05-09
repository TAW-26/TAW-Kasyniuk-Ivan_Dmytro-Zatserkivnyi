import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth/favorites`;

  private readonly _favorites = signal<string[]>([]);
  readonly favorites = this._favorites.asReadonly();
  readonly count = computed(() => this._favorites().length);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user) {
        this._favorites.set(user.favorites ?? []);
      } else {
        this._favorites.set(this.loadLocal());
      }
    }, { allowSignalWrites: true });
  }

  isFavorite(id: string): boolean {
    return this._favorites().includes(id);
  }

  toggle(id: string): boolean {
    const current = this._favorites();
    const isAdding = !current.includes(id);
    const next = isAdding ? [...current, id] : current.filter((x) => x !== id);
    this._favorites.set(next);

    if (this.auth.isLoggedIn()) {
      this.http.post<{ favorites: string[] }>(`${this.baseUrl}/toggle/${id}`, {}).subscribe({
        next: (res) => this.syncFromServer(res.favorites),
        error: () => this._favorites.set(current),
      });
    } else {
      this.saveLocal(next);
    }
    return isAdding;
  }

  removeId(id: string): void {
    const current = this._favorites();
    if (!current.includes(id)) return;
    const next = current.filter((x) => x !== id);
    this._favorites.set(next);

    if (this.auth.isLoggedIn()) {
      this.http.post<{ favorites: string[] }>(`${this.baseUrl}/toggle/${id}`, {}).subscribe({
        next: (res) => this.syncFromServer(res.favorites),
        error: () => this._favorites.set(current),
      });
    } else {
      this.saveLocal(next);
    }
  }

  syncWithExisting(existingIds: string[]): void {
    const valid = new Set(existingIds);
    const current = this._favorites();
    const filtered = current.filter((id) => valid.has(id));
    if (filtered.length !== current.length) {
      this._favorites.set(filtered);
      if (!this.auth.isLoggedIn()) this.saveLocal(filtered);
    }
  }

  clear(): void {
    this._favorites.set([]);
    if (this.auth.isLoggedIn()) {
      this.http.delete<{ favorites: string[] }>(this.baseUrl).subscribe();
    } else {
      this.saveLocal([]);
    }
  }

  private syncFromServer(favorites: string[]): void {
    this._favorites.set(favorites);
    this.auth.patchFavorites(favorites);
  }

  private loadLocal(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem('favorites_guest');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private saveLocal(favorites: string[]): void {
    localStorage.setItem('favorites_guest', JSON.stringify(favorites));
  }
}
