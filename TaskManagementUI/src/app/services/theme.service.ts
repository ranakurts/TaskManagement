import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeType = 'cosmic-nebula' | 'midnight-galaxy' | 'aurora' | 'solar-horizon';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<ThemeType>(this.getInitialTheme());
  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  private getInitialTheme(): ThemeType {
    return (localStorage.getItem('selectedTheme') as ThemeType) || 'cosmic-nebula';
  }

  setTheme(theme: ThemeType) {
    localStorage.setItem('selectedTheme', theme);
    this.themeSubject.next(theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeType) {
    document.body.setAttribute('data-theme', theme);
  }
}