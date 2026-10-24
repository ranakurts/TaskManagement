import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { UserStateService } from '../../services/user-state.service';
import { AuthShellComponent } from '../auth/auth-shell';
import { IconComponent } from '../../components/ui/task-bits';

const STRENGTH_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#22C55E'];

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule, AuthShellComponent, IconComponent],
  template: `
    <tm-auth-shell mode="register">
      <div class="auth-head">
        <h2>{{ lang.t('auth.registerTitle') }}</h2>
        <p>{{ lang.t('auth.registerSub') }}</p>
      </div>

      <form class="auth-form" (ngSubmit)="onRegister()" novalidate>
        <div class="auth-grid">
          <div class="auth-field">
            <label for="name">{{ lang.t('auth.fullName') }}</label>
            <div class="auth-input">
              <tm-icon name="user" [size]="18" />
              <input id="name" name="name" autocomplete="name" [(ngModel)]="name" [placeholder]="lang.t('auth.fullNamePh')" autofocus />
            </div>
          </div>
          <div class="auth-field">
            <label for="username">{{ lang.t('auth.username') }} <small>{{ lang.t('auth.optional') }}</small></label>
            <div class="auth-input">
              <tm-icon name="at" [size]="18" />
              <input id="username" name="username" autocomplete="username" [(ngModel)]="username" [placeholder]="usernamePh()" />
            </div>
          </div>
        </div>

        <div class="auth-field">
          <label for="email">{{ lang.t('auth.email') }}</label>
          <div class="auth-input">
            <tm-icon name="mail" [size]="18" />
            <input id="email" name="email" type="email" autocomplete="email" [(ngModel)]="email" placeholder="ad@ornek.com" />
          </div>
        </div>

        <div class="auth-field">
          <label for="password">{{ lang.t('auth.password') }}</label>
          <div class="auth-input">
            <tm-icon name="lock" [size]="18" />
            <input id="password" name="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="new-password"
                   [ngModel]="password()" (ngModelChange)="password.set($event)" [placeholder]="lang.t('auth.passwordPh')" />
            <button type="button" class="auth-eye no-glow" (click)="showPassword.set(!showPassword())" [attr.aria-label]="lang.t('auth.showPassword')">
              <tm-icon [name]="showPassword() ? 'eyeOff' : 'eye'" [size]="17" />
            </button>
          </div>
          @if (password()) {
            <div class="auth-strength">
              @for (i of [0, 1, 2, 3]; track i) {
                <span [style.background]="i < strength() ? strengthColor() : null"></span>
              }
            </div>
            <span class="auth-strength-label">{{ lang.t('auth.strength' + strength()) }}</span>
          }
        </div>

        @if (error()) {
          <div class="auth-alert" role="alert"><tm-icon name="close" [size]="16" />{{ error() }}</div>
        }

        <button type="submit" class="auth-submit no-glow" [disabled]="submitting()">
          @if (submitting()) { <span class="auth-spinner"></span> } @else { <tm-icon name="sparkle" [size]="18" /> }
          {{ lang.t('auth.registerBtn') }}
        </button>
      </form>

      <p class="auth-foot">{{ lang.t('auth.haveAccount') }}<a routerLink="/login">{{ lang.t('auth.loginLink') }}</a></p>
    </tm-auth-shell>
  `
})
export class RegisterComponent {
  lang = inject(LanguageService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private userStateService = inject(UserStateService);

  name = '';
  username = '';
  email = '';
  password = signal('');
  showPassword = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  // 0-4 arası basit şifre gücü: uzunluk, büyük/küçük harf, rakam, sembol
  strength = computed(() => {
    const p = this.password();
    if (!p) return 0;
    let score = p.length >= 6 ? 1 : 0;
    if (p.length >= 10) score++;
    if (/[a-zçğıöşü]/.test(p) && /[A-ZÇĞİÖŞÜ]/.test(p)) score++;
    if (/\d/.test(p) && /[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(p)) score++;
    return Math.max(1, Math.min(4, score));
  });
  strengthColor = computed(() => STRENGTH_COLORS[this.strength() - 1]);

  usernamePh() {
    const fromEmail = this.email.split('@')[0];
    return fromEmail || this.lang.t('auth.usernamePh');
  }

  onRegister() {
    this.error.set(null);
    const fullName = this.name.trim();
    // "İ" harfi düz "i" olur (sunucudaki karşılaştırma ile aynı kural)
    const key = (v: string) => v.trim().replace(/İ/g, 'i').toLowerCase();
    const email = key(this.email);
    const username = key(this.username || email.split('@')[0]);
    const password = this.password();

    if (!fullName || !email || !password) {
      this.error.set(this.lang.t('auth.fillAll'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set(this.lang.t('auth.badEmail'));
      return;
    }
    if (password.length < 6) {
      this.error.set(this.lang.t('auth.shortPassword'));
      return;
    }

    this.submitting.set(true);
    this.authService.register({ username, fullName, email, password }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.userStateService.fetchCurrentUser();
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(err.status === 0 ? this.lang.t('common.serverDown') : err.error?.message || this.lang.t('common.genericError'));
      }
    });
  }
}
