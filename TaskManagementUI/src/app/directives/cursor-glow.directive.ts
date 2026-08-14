import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '.glass-card, .metric-card, .dash-card, .welcome-hero-section, .page-header-card, .task-card, .board-column, .calendar-card, .report-card, button, .nav-tab, .user-avatar, .nav-icon-btn',
  standalone: true
})
export class CursorGlowDirective {
  private palette = [
    '#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4', 
    '#14B8A6', '#22C55E', '#84CC16', '#F59E0B', '#F97316', '#E879F9', '#6366F1'
  ];

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    this.renderer.setStyle(this.el.nativeElement, '--hover-color', randomColor);
  }
}