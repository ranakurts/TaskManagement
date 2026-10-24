import { Component, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { IconComponent } from '../../components/ui/task-bits';
import { SpaceBackgroundComponent } from '../../components/space-bg/space-bg';
import { BrandComponent } from '../../components/brand/brand';

// Giriş ve kayıt ekranlarının ortak çerçevesi.
// Ana uygulamayla aynı uzay arka planı, üst çubuk, logo ve cam kart stilini kullanır.
@Component({
  selector: 'tm-auth-shell',
  standalone: true,
  imports: [RouterModule, IconComponent, SpaceBackgroundComponent, BrandComponent],
  template: `
    <tm-space-bg />

    <header class="app-navbar">
      <tm-brand link="/login" />
      <div class="nav-right">
        <button class="tm-btn ghost sm lang" (click)="toggleLang()"><tm-icon name="globe" [size]="15" />{{ lang.lang() === 'tr' ? 'English' : 'Türkçe' }}</button>
        @if (mode() === 'login') {
          <a class="tm-btn sm" routerLink="/register">{{ lang.t('auth.registerLink') }}</a>
        } @else {
          <a class="tm-btn sm" routerLink="/login">{{ lang.t('auth.loginLink') }}</a>
        }
      </div>
    </header>

    <main class="page">
      <section class="intro">
        <!-- Ana sayfadaki karşılama kartının benzeri -->
        <div class="hero tm-card glow">
          <span class="tm-eyebrow"><tm-icon name="sparkle" [size]="13" />{{ lang.t('auth.eyebrow') }}</span>
          <h1>{{ lang.t('auth.headline1') }} <span class="grad">{{ lang.t('auth.headline2') }}</span></h1>
          <p>{{ lang.t('auth.lead') }}</p>
          <div class="ring" aria-hidden="true"><div class="ring-inner"><strong>87%</strong><span>{{ lang.t('dash.completion') }}</span></div></div>
        </div>

        <!-- Ana sayfadaki metrik kartlarının benzeri -->
        <div class="kpis" aria-hidden="true">
          <div class="kpi tm-card glow" style="--k: var(--primary)"><span class="kpi-icon"><tm-icon name="tasks" [size]="17" /></span><span class="kpi-body"><small>{{ lang.t('dash.total') }}</small><strong>24</strong></span></div>
          <div class="kpi tm-card glow" style="--k: var(--st-progress)"><span class="kpi-icon"><tm-icon name="flame" [size]="17" /></span><span class="kpi-body"><small>{{ lang.t('dash.inProgress') }}</small><strong>6</strong></span></div>
          <div class="kpi tm-card glow" style="--k: var(--st-done)"><span class="kpi-icon"><tm-icon name="check" [size]="17" /></span><span class="kpi-body"><small>{{ lang.t('dash.doneWeek') }}</small><strong>11</strong></span></div>
        </div>

        <ul class="features">
          <li><span class="fi"><tm-icon name="board" [size]="16" /></span>{{ lang.t('auth.f1') }}</li>
          <li><span class="fi"><tm-icon name="team" [size]="16" /></span>{{ lang.t('auth.f2') }}</li>
          <li><span class="fi"><tm-icon name="reports" [size]="16" /></span>{{ lang.t('auth.f3') }}</li>
        </ul>
      </section>

      <section class="form-side">
        <div class="form-card tm-card glow">
          <ng-content />
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; position: relative; color: var(--text); }

    /* Üst çubuk: uygulamadakiyle aynı */
    .app-navbar {
      position: sticky; top: 0; z-index: 10; height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 24px;
      background: color-mix(in srgb, var(--surface) 88%, transparent); backdrop-filter: blur(28px) saturate(140%);
      border-bottom: 1px solid var(--line); box-shadow: 0 10px 40px rgba(0,0,0,0.35);
    }
    .nav-right { display: flex; align-items: center; gap: 8px; }

    .page { position: relative; z-index: 1; max-width: 1240px; margin: 0 auto; padding: 48px 32px 64px; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 440px); gap: 40px; align-items: center; min-height: calc(100vh - 72px); }
    .intro { display: flex; flex-direction: column; gap: 18px; min-width: 0; animation: tmFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }

    .hero { position: relative; overflow: hidden; padding: 34px 200px 34px 34px;
      background: radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--primary) 30%, transparent) 0%, transparent 55%),
                  radial-gradient(120% 140% at 100% 100%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 50%), var(--card); }
    .hero .tm-eyebrow { display: inline-flex; align-items: center; gap: 7px; }
    h1 { margin: 12px 0 12px; font-size: clamp(30px, 3.4vw, 44px); font-weight: 800; letter-spacing: -0.04em; line-height: 1.08; }
    .grad { background: linear-gradient(120deg, var(--accent), var(--secondary)); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .hero p { margin: 0; color: var(--text-secondary); font-size: 15px; line-height: 1.65; max-width: 520px; }
    .ring { position: absolute; right: 34px; top: 50%; transform: translateY(-50%); width: 140px; height: 140px; border-radius: 50%; padding: 11px;
      background: conic-gradient(var(--accent) 87%, rgba(255,255,255,0.08) 0); box-shadow: 0 0 60px color-mix(in srgb, var(--primary) 30%, transparent); }
    .ring-inner { width: 100%; height: 100%; border-radius: 50%; background: var(--surface); display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .ring-inner strong { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
    .ring-inner span { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }

    .kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .kpi { display: flex; align-items: center; gap: 12px; padding: 16px; }
    .kpi-icon { width: 40px; height: 40px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--k); background: color-mix(in srgb, var(--k) 16%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--k) 30%, transparent); }
    .kpi-body { display: flex; flex-direction: column; min-width: 0; }
    .kpi-body small { font-size: 11.5px; color: var(--muted); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-body strong { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }

    .features { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px 22px; }
    .features li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-secondary); font-weight: 500; }
    .fi { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: var(--accent); background: color-mix(in srgb, var(--primary) 16%, transparent); }

    .form-side { min-width: 0; }
    .form-card { padding: 32px; border-radius: 24px; animation: tmFadeUp 0.55s 0.05s cubic-bezier(0.16, 1, 0.3, 1) both;
      background: linear-gradient(180deg, color-mix(in srgb, var(--card) 100%, white 3%), var(--card)); }

    @media (max-width: 1020px) {
      .page { grid-template-columns: 1fr; max-width: 520px; padding-top: 28px; gap: 22px; }
      .kpis, .features, .ring { display: none; }
      .hero { padding: 24px; }
      h1 { font-size: 30px; }
    }
    @media (max-width: 560px) {
      .app-navbar { height: 64px; padding: 0 14px; }
      .lang { padding: 0 8px; }
      .page { padding: 18px 14px 40px; min-height: calc(100vh - 64px); }
      .hero { padding: 20px; }
      .hero p { font-size: 14px; }
      h1 { font-size: 26px; }
      .form-card { padding: 22px 18px; border-radius: 20px; }
    }
  `]
})
export class AuthShellComponent {
  lang = inject(LanguageService);
  mode = input<'login' | 'register'>('login');

  toggleLang() {
    this.lang.setLanguage(this.lang.lang() === 'tr' ? 'en' : 'tr');
  }
}
