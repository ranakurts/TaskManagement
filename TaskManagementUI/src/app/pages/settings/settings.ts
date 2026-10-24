import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserStateService, AuthenticatedUser } from '../../services/user-state.service';
import { LanguageService, LangType } from '../../services/language.service';
import { ThemeService, ThemeType } from '../../services/theme.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workspace-container">
      <div class="page-header-card dash-card">
        <div class="header-text">
          <h1>{{ t('settings.title') }}</h1>
          <p>{{ t('settings.desc') }}</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="settings-card dash-card">
          <h3>{{ t('settings.profileTitle') }}</h3>
          <p class="card-desc">{{ t('settings.profileDesc') }}</p>

          <div class="input-group" style="margin-bottom: 20px;">
            <label>{{ t('settings.activeAcc') }}</label>
            <div class="glass-input" style="display: flex; align-items: center; justify-content: space-between;">
              <span class="ellipsis">{{ currentUser?.email || '-' }}</span>
              <span style="font-size: 11px; color: var(--accent-color, #8B5CF6); font-weight: 700;">{{ t('settings.connected') }}</span>
            </div>
          </div>

          <div class="form-grid">
            <div class="input-group">
              <label>{{ t('settings.name') }}</label>
              <input type="text" [(ngModel)]="fullName" class="glass-input">
            </div>
            <div class="input-group">
              <label>{{ t('settings.username') }}</label>
              <input type="text" [(ngModel)]="username" class="glass-input">
            </div>
          </div>

          <div class="input-group">
            <label>{{ t('settings.workspace') }}</label>
            <input type="text" [(ngModel)]="workspaceName" class="glass-input">
          </div>

          <div class="input-group">
            <label>{{ t('settings.email') }}</label>
            <input type="email" [(ngModel)]="email" class="glass-input">
          </div>

          <div class="save-actions-row">
            <button type="button" class="ai-btn primary save-btn" [disabled]="saving" (click)="saveProfile()">{{ t('settings.save') }}</button>
            <span class="save-feedback" *ngIf="saveMessage" [style.color]="isError ? '#F87171' : '#34D399'">{{ saveMessage }}</span>
          </div>
        </div>

        <div class="settings-card dash-card password-card">
          <h3>{{ lang.t('pw.title') }}</h3>
          <p class="card-desc">{{ lang.t('pw.desc') }}</p>
          <div class="input-group">
            <label>{{ lang.t('pw.current') }}</label>
            <input type="password" [(ngModel)]="currentPassword" class="glass-input" autocomplete="current-password">
          </div>
          <div class="form-grid">
            <div class="input-group">
              <label>{{ lang.t('pw.new') }}</label>
              <input type="password" [(ngModel)]="newPassword" class="glass-input" autocomplete="new-password">
            </div>
            <div class="input-group">
              <label>{{ lang.t('pw.repeat') }}</label>
              <input type="password" [(ngModel)]="repeatPassword" class="glass-input" autocomplete="new-password">
            </div>
          </div>
          <div class="save-actions-row">
            <button type="button" class="ai-btn primary save-btn" [disabled]="changingPassword" (click)="changePassword()">{{ lang.t('pw.save') }}</button>
            <span class="save-feedback" *ngIf="pwMessage" [style.color]="pwError ? '#F87171' : '#34D399'">{{ pwMessage }}</span>
          </div>
        </div>

        <div class="settings-card dash-card">
          <h3>{{ t('settings.appearance') }}</h3>
          <p class="card-desc">{{ t('settings.appDesc') }}</p>

          <div class="input-group">
            <label>{{ t('settings.theme') }}</label>
            <select [(ngModel)]="selectedTheme" (ngModelChange)="changeTheme($event)" class="glass-input">
              <option value="cosmic-nebula">Cosmic Nebula</option>
              <option value="midnight">Midnight Space</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
              <option value="aurora">Aurora</option>
              <option value="solar-horizon">Solar Horizon</option>
            </select>
          </div>

          <div class="input-group" style="margin-top: 20px;">
            <label>{{ t('settings.lang') }}</label>
            <select [(ngModel)]="selectedLang" (ngModelChange)="changeLang($event)" class="glass-input">
              <option value="tr">Türkçe</option>
              <option value="en">English (US)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: calc(100vh - 84px); color: var(--text-color, #F1F5F9); font-family: var(--app-font, 'Plus Jakarta Sans'), sans-serif; }
    .workspace-container { max-width: 1200px; margin: 0 auto; padding: 40px; display: flex; flex-direction: column; gap: 24px; }
    .dash-card { background: var(--card-bg, rgba(11, 15, 30, 0.7)); backdrop-filter: blur(30px); border-radius: 20px; padding: 28px; border: 1px solid var(--border-color, rgba(139, 92, 246, 0.25)); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .page-header-card h1 { font-size: 28px; font-weight: 700; margin: 0; color: var(--text-color, #fff); }
    .page-header-card p { font-size: 13.5px; color: #94A3B8; margin: 4px 0 0 0; }
    .settings-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr); gap: 24px; align-items: start; }
    .password-card { grid-column: 1 / -1; }
    .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ai-btn.primary:disabled { opacity: 0.6; cursor: wait; }
    @media (max-width: 900px) {
      .workspace-container { padding: 20px 16px; }
      .settings-grid, .form-grid { grid-template-columns: 1fr; }
    }
    .settings-card h3 { font-size: 18px; font-weight: 700; margin: 0; color: var(--text-color, #fff); }
    .card-desc { font-size: 12.5px; color: #94A3B8; margin: 4px 0 20px 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .input-group label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
    .glass-input { height: 42px; border-radius: 10px; background: var(--input-bg, rgba(18, 24, 48, 0.9)); border: 1px solid var(--border-color, rgba(139, 92, 246, 0.3)); color: var(--text-color, #fff); padding: 0 14px; font-size: 13px; outline: none; width: 100%; display: flex; align-items: center; font-family: inherit; }
    .disabled-input { opacity: 0.6; cursor: not-allowed; }
    select.glass-input option { background: #0B0F1E; color: #fff; }
    .save-actions-row { display: flex; align-items: center; gap: 16px; margin-top: 24px; flex-wrap: wrap; min-height: 44px; }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #E879F9); border: none; color: #FFFFFF; box-shadow: 0 0 22px rgba(139, 92, 246, 0.5); padding: 0 24px; height: 44px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .ai-btn.primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .save-feedback { font-size: 13px; font-weight: 600; }
  `]
})
export class SettingsComponent implements OnInit {
  private userStateService = inject(UserStateService);
  private langService = inject(LanguageService);
  lang = this.langService;
  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  currentUser: AuthenticatedUser | null = null;
  fullName = '';
  username = '';
  email = '';
  workspaceName = '';
  selectedLang: LangType = 'tr';
  selectedTheme: ThemeType = 'cosmic-nebula';
  saveMessage = '';
  isError = false;
  saving = false;
  currentPassword = '';
  newPassword = '';
  repeatPassword = '';
  changingPassword = false;
  pwMessage = '';
  pwError = false;

  ngOnInit() {
    this.selectedLang = this.langService.getLang();
    this.selectedTheme = this.themeService.getTheme();

    this.userStateService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.fullName = user.fullName;
        this.username = user.username;
        this.email = user.email;
        // Veritabanındaki değer esas; eski sürümde tarayıcıda kalmış değer varsa ilk kayıtta taşınır
        this.workspaceName = user.workspaceName || localStorage.getItem(`workspace_${user.id}`) || '';
      }
      this.cdr.markForCheck();
    });
    this.userStateService.fetchCurrentUser();

    this.langService.lang$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(l => {
      this.selectedLang = l;
      this.cdr.markForCheck();
    });
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  changeLang(lang: LangType) {
    this.langService.setLanguage(lang);
  }

  changeTheme(theme: ThemeType) {
    this.themeService.setTheme(theme);
  }

  saveProfile() {
    if (!this.currentUser) return;

    if (!this.fullName.trim() || !this.username.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.showMessage(this.t('settings.invalid'), true);
      return;
    }

    this.saving = true;
    this.userStateService.updateProfile({
      fullName: this.fullName.trim(),
      username: this.username.trim(),
      email: this.email.trim(),
      workspaceName: this.workspaceName.trim()
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showMessage(this.t('settings.saved'), false);
      },
      error: err => {
        this.saving = false;
        // Önceden hata olsa bile "Başarıyla kaydedildi" yazıyordu
        const msg = err.status === 0 ? this.t('settings.serverDown') : err.error?.message || this.t('settings.saveFailed');
        this.showMessage(msg, true);
      }
    });
  }

  changePassword() {
    this.pwMessage = '';
    if (!this.currentPassword || !this.newPassword) {
      this.setPw(this.lang.t('pw.fill'), true);
      return;
    }
    if (this.newPassword.length < 6) {
      this.setPw(this.lang.t('auth.shortPassword'), true);
      return;
    }
    if (this.newPassword !== this.repeatPassword) {
      this.setPw(this.lang.t('pw.mismatch'), true);
      return;
    }
    this.changingPassword = true;
    this.userStateService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: res => {
        this.changingPassword = false;
        this.currentPassword = this.newPassword = this.repeatPassword = '';
        this.setPw(res.message, false);
      },
      error: (err: HttpErrorResponse) => {
        this.changingPassword = false;
        this.setPw(err.status === 0 ? this.t('settings.serverDown') : err.error?.message || this.t('settings.saveFailed'), true);
      }
    });
  }

  private setPw(text: string, isError: boolean) {
    this.pwMessage = text;
    this.pwError = isError;
    this.cdr.markForCheck();
  }

  private showMessage(text: string, isError: boolean) {
    this.saveMessage = text;
    this.isError = isError;
    this.cdr.markForCheck();
    setTimeout(() => { this.saveMessage = ''; this.cdr.markForCheck(); }, 4000);
  }
}
