import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeType = 'cosmic-nebula' | 'midnight' | 'cyberpunk' | 'aurora' | 'solar-horizon';

export const THEMES: ThemeType[] = ['cosmic-nebula', 'midnight', 'cyberpunk', 'aurora', 'solar-horizon'];

// Ayarlar sayfası ve layout aynı kaynağı kullanır; böylece tema değişince arka plan da değişir.
const THEME_VARS: Record<ThemeType, Record<string, string>> = {
  'cosmic-nebula': {
    '--app-font': "'Plus Jakarta Sans', sans-serif",
    '--card-bg': 'rgba(11, 15, 30, 0.7)',
    '--border-color': 'rgba(139, 92, 246, 0.25)',
    '--accent-color': '#8b5cf6',
    '--input-bg': 'rgba(18, 24, 48, 0.9)'
  },
  midnight: {
    '--app-font': "'Inter', sans-serif",
    '--card-bg': 'rgba(15, 23, 42, 0.9)',
    '--border-color': 'rgba(59, 130, 246, 0.3)',
    '--accent-color': '#3b82f6',
    '--input-bg': 'rgba(30, 41, 59, 0.9)'
  },
  cyberpunk: {
    '--app-font': "'Plus Jakarta Sans', sans-serif",
    '--card-bg': 'rgba(24, 10, 26, 0.88)',
    '--border-color': 'rgba(244, 63, 94, 0.4)',
    '--accent-color': '#f43f5e',
    '--input-bg': 'rgba(39, 20, 40, 0.9)'
  },
  aurora: {
    '--app-font': "'Plus Jakarta Sans', sans-serif",
    '--card-bg': 'rgba(4, 24, 26, 0.85)',
    '--border-color': 'rgba(6, 182, 212, 0.35)',
    '--accent-color': '#06b6d4',
    '--input-bg': 'rgba(6, 36, 38, 0.9)'
  },
  'solar-horizon': {
    '--app-font': "'Plus Jakarta Sans', sans-serif",
    '--card-bg': 'rgba(30, 12, 4, 0.85)',
    '--border-color': 'rgba(249, 115, 22, 0.35)',
    '--accent-color': '#f97316',
    '--input-bg': 'rgba(45, 20, 8, 0.9)'
  }
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<ThemeType>(this.getInitialTheme());
  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  getTheme(): ThemeType {
    return this.themeSubject.value;
  }

  setTheme(theme: ThemeType) {
    localStorage.setItem('selectedTheme', theme);
    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  private getInitialTheme(): ThemeType {
    const saved = localStorage.getItem('selectedTheme') as ThemeType;
    return THEMES.includes(saved) ? saved : 'cosmic-nebula';
  }

  private applyTheme(theme: ThemeType) {
    const body = document.body;
    body.setAttribute('data-theme', theme);
    for (const [key, value] of Object.entries(THEME_VARS[theme])) {
      body.style.setProperty(key, value);
    }
  }
}
