import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

// RanaCore logosu: menü çubuğunda ve giriş ekranında aynı görünüm
@Component({
  selector: 'tm-brand',
  standalone: true,
  imports: [RouterModule],
  template: `
    <a class="brand" [routerLink]="link()" title="RanaCore">
      <span class="mark">
        <span class="ring"></span>
        <span class="tile">
          <span class="shine"></span>
          <span class="letter">R</span>
          <svg class="sparkle" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0c.9 5.6 3.4 9.4 12 12-8.6 2.6-11.1 6.4-12 12-.9-5.6-3.4-9.4-12-12C8.6 9.4 11.1 5.6 12 0z" />
          </svg>
        </span>
      </span>
      <span class="words">
        <span class="name">Rana<span class="core">Core</span></span>
        <span class="tag">AI Workspace</span>
      </span>
    </a>
  `,
  styles: [`
    :host { display: inline-flex; flex-shrink: 0; }
    .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }

    /* ---- İkon ---- */
    .mark { position: relative; width: 40px; height: 40px; flex-shrink: 0; }
    .ring {
      position: absolute; inset: -2px; border-radius: 14px;
      background: conic-gradient(from 0deg, #F472B6, #A855F7, #38BDF8, #34D399, #F472B6);
      animation: spin 6s linear infinite; opacity: 0.85; filter: blur(0.3px);
    }
    .ring::after { content: ''; position: absolute; inset: -6px; border-radius: 18px; background: inherit; filter: blur(12px); opacity: 0.45; }
    .tile {
      position: absolute; inset: 1.5px; border-radius: 12px; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(140deg, #EC4899 0%, #A855F7 48%, #6366F1 78%, #38BDF8 120%);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -8px 16px rgba(30, 10, 60, 0.35);
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .shine {
      position: absolute; top: -60%; left: -60%; width: 60%; height: 220%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
      transform: rotate(25deg); animation: sweep 5s ease-in-out infinite;
    }
    .letter { position: relative; font-size: 21px; font-weight: 800; color: #fff; letter-spacing: -0.04em; text-shadow: 0 2px 8px rgba(60, 10, 90, 0.45); }
    .sparkle { position: absolute; top: 5px; right: 5px; width: 9px; height: 9px; fill: #fff; filter: drop-shadow(0 0 4px #F9A8D4) drop-shadow(0 0 2px #fff); animation: twinkle 2.8s ease-in-out infinite; }

    .brand:hover .tile { transform: rotate(-6deg) scale(1.06); }
    .brand:hover .ring { opacity: 1; animation-duration: 2.5s; }

    /* ---- Yazı ---- */
    .words { display: flex; flex-direction: column; line-height: 1; }
    .name { font-size: 21px; font-weight: 800; letter-spacing: -0.035em; color: #fff; }
    .core {
      margin-left: 1px;
      background: linear-gradient(100deg, #F472B6 0%, #C084FC 30%, #FFFFFF 45%, #C084FC 55%, #38BDF8 85%);
      background-size: 220% 100%;
      -webkit-background-clip: text; background-clip: text; color: transparent;
      animation: shimmer 6s ease-in-out infinite;
    }
    .tag { margin-top: 4px; font-size: 9px; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: rgba(232, 121, 249, 0.75); }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes sweep { 0%, 55% { left: -60%; } 85%, 100% { left: 130%; } }
    @keyframes twinkle { 0%, 100% { transform: scale(0.75) rotate(0deg); opacity: 0.75; } 50% { transform: scale(1.15) rotate(45deg); opacity: 1; } }
    @keyframes shimmer { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0 0; } }

    /* Dar ekranda sadece ikon */
    @media (max-width: 640px) {
      .words { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ring, .shine, .sparkle, .core { animation: none; }
    }
  `]
})
export class BrandComponent {
  link = input<string>('/dashboard');
}
