import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, signal } from '@angular/core';

export type TemaVisual = 'light' | 'dark';

const STORAGE_KEY = 'titishop-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<TemaVisual>('light');

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.setTheme(this.readStoredTheme(), false);
  }

  get isDark(): boolean {
    return this.theme() === 'dark';
  }

  toggle(): void {
    this.setTheme(this.isDark ? 'light' : 'dark');
  }

  setTheme(theme: TemaVisual, persist = true): void {
    this.theme.set(theme);
    this.document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    this.document.body.classList.toggle('dark-theme', theme === 'dark');

    if (persist) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }

  private readStoredTheme(): TemaVisual {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  }
}
