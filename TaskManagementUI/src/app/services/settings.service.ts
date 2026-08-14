import { Injectable, inject } from '@angular/core';
import { ThemeService, ThemeType } from './theme.service';
import { LanguageService, LangType } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  themeService = inject(ThemeService);
  languageService = inject(LanguageService);

  setTheme(theme: ThemeType) {
    this.themeService.setTheme(theme);
  }

  setLanguage(lang: LangType) {
    this.languageService.setLanguage(lang);
  }
}