import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _darkMode = signal(this.readStored());
  readonly darkMode = this._darkMode.asReadonly();

  constructor() {
    this.apply(this._darkMode());
  }

  toggle(): void {
    this.setDark(!this._darkMode());
  }

  setDark(dark: boolean): void {
    this._darkMode.set(dark);
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    this.apply(dark);
  }

  private apply(dark: boolean): void {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private readStored(): boolean {
    return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'dark';
  }
}
