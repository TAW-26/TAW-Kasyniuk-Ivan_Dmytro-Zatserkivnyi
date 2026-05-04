import { Injectable, computed, signal } from '@angular/core';

const FAVORITES_KEY = 'favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly _favorites = signal<string[]>(this.load());
  readonly favorites = this._favorites.asReadonly();
  readonly count = computed(() => this._favorites().length);

  isFavorite(id: string): boolean {
    return this._favorites().includes(id);
  }

  toggle(id: string): boolean {
    const current = this._favorites();
    if (current.includes(id)) {
      this.commit(current.filter((x) => x !== id));
      return false;
    }
    this.commit([...current, id]);
    return true;
  }

  removeId(id: string): void {
    const current = this._favorites();
    if (!current.includes(id)) return;
    this.commit(current.filter((x) => x !== id));
  }

  syncWithExisting(existingIds: string[]): void {
    const valid = new Set(existingIds);
    const current = this._favorites();
    const filtered = current.filter((id) => valid.has(id));
    if (filtered.length !== current.length) {
      this.commit(filtered);
    }
  }

  clear(): void {
    this.commit([]);
  }

  private commit(next: string[]): void {
    this._favorites.set(next);
    this.save(next);
  }

  private load(): string[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private save(favorites: string[]): void {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}
