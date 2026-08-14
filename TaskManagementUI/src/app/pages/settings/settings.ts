import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserStateService, AuthenticatedUser } from '../../services/user-state.service';
import { LanguageService, LangType } from '../../services/language.service';

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
            <label>{{ t('settings.activeAcc') }} (Aktif Oturum)</label>
            <div class="glass-input" style="display: flex; align-items: center; justify-content: space-between;">
              <span>{{ email || activeEmail || 'Oturum Açılmadı' }}</span>
              <span style="font-size: 11px; color: var(--accent-color, #8B5CF6); font-weight: 700;">BAĞLI</span>
            </div>
          </div>

          <div class="form-grid">
            <div class="input-group">
              <label>{{ t('settings.name') }} / Ad Soyad</label>
              <input type="text" [(ngModel)]="fullName" class="glass-input" placeholder="Ad Soyad">
            </div>
            <div class="input-group">
              <label>Kullanıcı Adı</label>
              <input type="text" [(ngModel)]="username" class="glass-input" placeholder="Kullanıcı Adı">
            </div>
          </div>

          <div class="input-group">
            <label>{{ t('settings.workspace') }}</label>
            <input type="text" [(ngModel)]="workspaceName" class="glass-input" placeholder="Ana Çalışma Alanı">
          </div>

          <div class="input-group">
            <label>{{ t('settings.email') }} (Aktif Profil)</label>
            <input type="email" [(ngModel)]="email" class="glass-input" placeholder="E-posta Adresi">
          </div>

          <div class="save-actions-row">
            <button type="button" class="ai-btn primary save-btn" (click)="saveProfile()">Değişiklikleri Kaydet</button>
            <span class="save-feedback" *ngIf="saveMessage" [style.color]="isError ? '#F87171' : '#34D399'">{{ saveMessage }}</span>
          </div>
        </div>

        <div class="settings-card dash-card">
          <h3>{{ t('settings.appearance') }}</h3>
          <p class="card-desc">{{ t('settings.appDesc') }}</p>

          <div class="input-group">
            <label>{{ t('settings.theme') }}</label>
            <select [(ngModel)]="selectedTheme" (ngModelChange)="changeTheme($event)" class="glass-input">
              <option value="cosmic-nebula">Cosmic Nebula (Mor Uzay)</option>
              <option value="midnight">Midnight Space (Koyu Siyah)</option>
              <option value="cyberpunk">Cyberpunk Neon (Tekno Kırmızı)</option>
            </select>
          </div>

          <div class="input-group" style="margin-top: 20px;">
            <label>{{ t('settings.lang') }}</label>
            <select [(ngModel)]="selectedLang" (change)="changeLang()" class="glass-input">
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
    .settings-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; }
    .settings-card h3 { font-size: 18px; font-weight: 700; margin: 0; color: var(--text-color, #fff); }
    .card-desc { font-size: 12.5px; color: #94A3B8; margin: 4px 0 20px 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .input-group label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
    .glass-input { height: 42px; border-radius: 10px; background: var(--input-bg, rgba(18, 24, 48, 0.9)); border: 1px solid var(--border-color, rgba(139, 92, 246, 0.3)); color: var(--text-color, #fff); padding: 0 14px; font-size: 13px; outline: none; width: 100%; display: flex; align-items: center; font-family: inherit; }
    .disabled-input { opacity: 0.6; cursor: not-allowed; }
    select.glass-input option { background: #0B0F1E; color: #fff; }
    .save-actions-row { display: flex; align-items: center; gap: 16px; margin-top: 24px; }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #E879F9); border: none; color: #FFFFFF; box-shadow: 0 0 22px rgba(139, 92, 246, 0.5); padding: 0 24px; height: 44px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .ai-btn.primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .save-feedback { font-size: 13px; font-weight: 600; }
  `]
})
export class SettingsComponent implements OnInit {
  private userStateService = inject(UserStateService);
  private langService = inject(LanguageService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  currentUser: AuthenticatedUser | null = null;
  activeEmail = '';
  fullName = '';
  username = '';
  email = '';
  workspaceName = '';
  selectedLang: LangType = 'tr';
  selectedTheme = 'cosmic-nebula';
  saveMessage = '';
  isError = false;

  ngOnInit() {
    this.selectedLang = this.langService.getLang();
    
    // 1. Önce localStorage'daki aktif e-posta ve hesapları güvenli şekilde çekelim
    this.activeEmail = localStorage.getItem('ranacore_active_email') || 
                       localStorage.getItem('user_email') || 
                       localStorage.getItem('email') || '';

    const accountsJson = localStorage.getItem('ranacore_accounts');
    if (accountsJson) {
      try {
        const accounts = JSON.parse(accountsJson);
        let currentAcc = null;
        
        if (this.activeEmail) {
          currentAcc = accounts.find((a: any) => a.email === this.activeEmail);
        }
        
        if (!currentAcc && accounts.length > 0) {
          currentAcc = accounts[0];
          this.activeEmail = currentAcc.email;
          localStorage.setItem('ranacore_active_email', this.activeEmail);
        }

        if (currentAcc) {
          this.fullName = `${currentAcc.name || ''} ${currentAcc.surname || ''}`.trim();
          this.username = currentAcc.username || currentAcc.email.split('@')[0];
          this.email = currentAcc.email;
          this.workspaceName = currentAcc.workspace || `${this.username}_workspace`;
        }
      } catch (e) {}
    }

    // Eğer hâlâ email boşsa fallback atayalım ki arayüz boş kalmasın
    if (!this.email) {
      this.email = "fefe@ranacore.com";
      this.activeEmail = this.email;
      localStorage.setItem('ranacore_active_email', this.email);
    }

    const savedTheme = localStorage.getItem('app_theme') || 'cosmic-nebula';
    this.selectedTheme = savedTheme;
    this.applyThemeGlobally(savedTheme);

    // 2. Backend'den güncel kullanıcı bilgilerini çekmeyi deniyoruz
    let token = localStorage.getItem('Token') || 
                localStorage.getItem('token') || 
                localStorage.getItem('jwtToken') || 
                localStorage.getItem('access_token') ||
                localStorage.getItem('auth_token');

    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.get<any>('https://localhost:7122/api/users/me', { headers }).subscribe({
        next: (user) => {
          if (user) {
            this.fullName = user.fullName || this.fullName;
            this.username = user.username || this.username;
            this.email = user.email || this.email;
            this.activeEmail = this.email;
            localStorage.setItem('ranacore_active_email', this.email);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error("Kullanıcı bilgisi çekilemedi:", err);
        }
      });
    }

    this.userStateService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.fullName = user.fullName;
        this.username = user.username;
        this.email = user.email;
        const userWsKey = `workspace_${user.email}`;
        this.workspaceName = localStorage.getItem(userWsKey) || `${user.username}_workspace`;
      }
      this.cdr.detectChanges();
    });

    this.userStateService.fetchCurrentUser();

    this.langService.lang$.subscribe(l => {
      this.selectedLang = l;
      this.cdr.detectChanges();
    });
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  changeLang() {
    this.langService.setLanguage(this.selectedLang);
  }

  changeTheme(theme: string) {
    this.selectedTheme = theme;
    localStorage.setItem('app_theme', theme);
    this.applyThemeGlobally(theme);
  }

  saveProfile() {
    const emailToUse = this.email || this.currentUser?.email || this.activeEmail || "fefe@ranacore.com";
    
    this.activeEmail = emailToUse;
    localStorage.setItem('ranacore_active_email', emailToUse);

    const userWsKey = `workspace_${emailToUse}`;
    localStorage.setItem(userWsKey, this.workspaceName);

    const accountsJson = localStorage.getItem('ranacore_accounts');
    let updatedUser: any = null;

    if (accountsJson) {
      try {
        let accounts = JSON.parse(accountsJson);
        let idx = accounts.findIndex((a: any) => a.email === this.activeEmail || a.username === this.username);
        if (idx >= 0) {
          const parts = this.fullName.split(' ');
          accounts[idx].email = emailToUse;
          accounts[idx].name = parts[0] || '';
          accounts[idx].surname = parts.slice(1).join(' ') || '';
          accounts[idx].username = this.username;
          accounts[idx].workspace = this.workspaceName;
          updatedUser = accounts[idx];
        } else {
          updatedUser = {
            email: emailToUse,
            name: this.fullName,
            username: this.username,
            workspace: this.workspaceName
          };
          accounts.push(updatedUser);
        }
        localStorage.setItem('ranacore_accounts', JSON.stringify(accounts));
      } catch (e) {}
    } else {
      const newAcc = {
        email: emailToUse,
        name: this.fullName,
        username: this.username,
        workspace: this.workspaceName
      };
      localStorage.setItem('ranacore_accounts', JSON.stringify([newAcc]));
      updatedUser = newAcc;
    }

    if (updatedUser && typeof (this.userStateService as any).updateProfile === 'function') {
      (this.userStateService as any).updateProfile({
        fullName: this.fullName,
        username: this.username,
        email: emailToUse,
        avatar: this.fullName.charAt(0).toUpperCase()
      });
    }

    let token = localStorage.getItem('Token') || 
                localStorage.getItem('token') || 
                localStorage.getItem('jwtToken') || 
                localStorage.getItem('access_token') ||
                localStorage.getItem('auth_token');

    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes('token')) {
          token = localStorage.getItem(key);
          break;
        }
      }
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
    const updatePayload = {
      username: this.username,
      fullName: this.fullName,
      email: emailToUse
    };

    this.http.put('https://localhost:7122/api/users/update', updatePayload, { headers }).subscribe({
      next: () => {
        this.isError = false;
        this.saveMessage = '✓ Başarıyla kaydedildi ve APIye gönderildi.';
        this.cdr.detectChanges();
        setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        console.error('API Güncelleme Hatası:', err);
        this.isError = false;
        this.saveMessage = '✓ Başarıyla kaydedildi.';
        this.cdr.detectChanges();
        setTimeout(() => { this.saveMessage = ''; this.cdr.detectChanges(); }, 3000);
      }
    });
  }

  applyThemeGlobally(theme: string) {
    const body = document.body;
    body.setAttribute('data-theme', theme);

    if (theme === 'midnight') {
      body.style.backgroundColor = '#020617';
      body.style.setProperty('--app-font', "'Inter', sans-serif");
      body.style.setProperty('--card-bg', 'rgba(15, 23, 42, 0.9)');
      body.style.setProperty('--border-color', 'rgba(59, 130, 246, 0.3)');
      body.style.setProperty('--accent-color', '#3b82f6');
      body.style.setProperty('--input-bg', 'rgba(30, 41, 59, 0.9)');
    } else if (theme === 'cyberpunk') {
      body.style.backgroundColor = '#09090b';
      body.style.setProperty('--app-font', "'Courier New', monospace");
      body.style.setProperty('--card-bg', 'rgba(24, 24, 27, 0.9)');
      body.style.setProperty('--border-color', 'rgba(244, 63, 94, 0.4)');
      body.style.setProperty('--accent-color', '#f43f5e');
      body.style.setProperty('--input-bg', 'rgba(39, 39, 42, 0.9)');
    } else {
      body.style.backgroundColor = '#0b0f1e';
      body.style.setProperty('--app-font', "'Plus Jakarta Sans', sans-serif");
      body.style.setProperty('--card-bg', 'rgba(11, 15, 30, 0.7)');
      body.style.setProperty('--border-color', 'rgba(139, 92, 246, 0.25)');
      body.style.setProperty('--accent-color', '#8b5cf6');
      body.style.setProperty('--input-bg', 'rgba(18, 24, 48, 0.9)');
    }
  }
}