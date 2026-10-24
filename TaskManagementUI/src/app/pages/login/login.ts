import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { UserStateService } from '../../services/user-state.service';
import { AuthShellComponent } from '../auth/auth-shell';
import { IconComponent } from '../../components/ui/task-bits';

const REMEMBER_KEY = 'tm_last_login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, AuthShellComponent, IconComponent],
  template: `
    <tm-auth-shell>
      <div class="auth-head">
        <h2>{{ lang.t('auth.loginTitle') }}</h2>
        <p>{{ lang.t('auth.loginSub') }}</p>
      </div>

      <form class="auth-form" (ngSubmit)="onLogin()" novalidate>
        <div class="auth-field">
          <label for="login">{{ lang.t('auth.loginField') }}</label>
          <div class="auth-input">
            <tm-icon name="at" [size]="18" />
            <input id="login" name="login" type="text" autocomplete="username" [(ngModel)]="login" [placeholder]="lang.t('auth.loginPh')" autofocus />
          </div>
        </div>

        <div class="auth-field">
          <label for="password">{{ lang.t('auth.password') }}</label>
          <div class="auth-input">
            <tm-icon name="lock" [size]="18" />
            <input id="password" name="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" [(ngModel)]="password" placeholder="••••••••" />
            <button type="button" class="auth-eye no-glow" (click)="showPassword.set(!showPassword())" [attr.aria-label]="lang.t('auth.showPassword')">
              <tm-icon [name]="showPassword() ? 'eyeOff' : 'eye'" [size]="17" />
            </button>
          </div>
        </div>

        <div class="auth-row">
          <label class="auth-check"><input type="checkbox" name="remember" [(ngModel)]="remember" />{{ lang.t('auth.remember') }}</label>
        </div>

        @if (error()) {
          <div class="auth-alert" role="alert"><tm-icon name="close" [size]="16" />{{ error() }}</div>
        }

        <button type="submit" class="auth-submit no-glow" [disabled]="submitting()">
          @if (submitting()) { <span class="auth-spinner"></span> } @else { <tm-icon name="arrowRight" [size]="18" /> }
          {{ lang.t('auth.loginBtn') }}
        </button>
      </form>

      <p class="auth-foot">{{ lang.t('auth.noAccount') }}<a routerLink="/register">{{ lang.t('auth.registerLink') }}</a></p>
    </tm-auth-shell>
  `
})
export class LoginComponent {
  lang = inject(LanguageService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private userStateService = inject(UserStateService);

  login = localStorage.getItem(REMEMBER_KEY) ?? '';
  password = '';
  remember = !!localStorage.getItem(REMEMBER_KEY);
  showPassword = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  onLogin() {
    this.error.set(null);
    if (!this.login.trim() || !this.password) {
      this.error.set(this.lang.t('auth.fillAll'));
      return;
    }

    this.submitting.set(true);
    this.authService.login(this.login, this.password).subscribe({
      next: () => {
        // "Beni hatırla": sadece kullanıcı adı/e-posta saklanır, şifre asla
        if (this.remember) localStorage.setItem(REMEMBER_KEY, this.login.trim());
        else localStorage.removeItem(REMEMBER_KEY);
        this.submitting.set(false);
        this.userStateService.fetchCurrentUser();
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(err.status === 0 ? this.lang.t('common.serverDown') : err.error?.message || this.lang.t('auth.badLogin'));
      }
    });
  }
}
