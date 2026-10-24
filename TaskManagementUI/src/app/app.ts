import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';

const GLOW_PALETTE = [
  '#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4',
  '#14B8A6', '#22C55E', '#84CC16', '#F59E0B', '#F97316', '#E879F9', '#6366F1'
];

const GLOW_SELECTOR = '.glass-card, .metric-card, .dash-card, .welcome-hero-section, .page-header-card, .task-card, '
  + '.board-column, .calendar-card, .report-card, .settings-card, .team-card, .login-card, .widget-card, '
  + 'button, .ai-btn, .tm-btn, .tm-card, .nav-tab, .user-avatar, .nav-icon-btn, '
  // Liste satırları, görev kartları, bildirimler: her biri üzerine gelince kendi rengini alır
  + '.row, .card, .tl-item, .feed li, .team-item, .team-table tbody tr, .notice, .menu-item, .item, .chip, .task, .tm-chip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class App {
  private lastGlowTarget: HTMLElement | null = null;

  // İmleç yeni bir karta/butona her geldiğinde ona rastgele bir parıltı rengi verir (styles.css'teki --hover-color).
  // 'mouseenter' kabarcıklanmadığı için eski dinleyici hiç tetiklenmiyordu; 'mouseover' tüm sayfalarda (giriş dahil) çalışır.
  @HostListener('document:mouseover', ['$event'])
  onMouseOver(event: MouseEvent) {
    const target = (event.target as Element | null)?.closest?.(GLOW_SELECTOR) as HTMLElement | null;
    if (target === this.lastGlowTarget) return;
    this.lastGlowTarget = target;
    if (!target) return;
    target.style.setProperty('--hover-color', GLOW_PALETTE[Math.floor(Math.random() * GLOW_PALETTE.length)]);
  }
}
