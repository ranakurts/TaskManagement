import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="workspace-container">
      
      <div class="page-header-card dash-card" (mouseenter)="setRandomColor($event)">
        <div class="header-text">
          <h1>{{ t('calendar.title') }}</h1>
          <p>{{ t('calendar.desc') }}</p>
        </div>
      </div>

      <div class="calendar-card dash-card" (mouseenter)="setRandomColor($event)">
        <div class="calendar-toolbar">
          <button class="ai-btn" (click)="prevMonth()">{{ t('calendar.prev') }}</button>
          <h2>{{ currentMonthName }} {{ currentYear }}</h2>
          <button class="ai-btn" (click)="nextMonth()">{{ t('calendar.next') }}</button>
        </div>

        <div class="days-grid">
          <div class="day-header" *ngFor="let d of weekDays">{{ d }}</div>
          <div class="day-cell dash-card" *ngFor="let day of days" (mouseenter)="setRandomColor($event)">
            <span class="day-num" [class.today]="isToday(day)">{{ day }}</span>
            <div class="day-events" *ngIf="day === 29">
              <span class="event-badge">Architecture Review</span>
            </div>
            <div class="day-events" *ngIf="day === 31">
              <span class="event-badge">Sprint Deadline</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; min-height: calc(100vh - 84px); color: #F1F5F9; font-family: 'Plus Jakarta Sans', sans-serif; }
    .workspace-container { max-width: 1200px; margin: 0 auto; padding: 40px; display: flex; flex-direction: column; gap: 24px; }
    
    .dash-card {
      background: rgba(11, 15, 30, 0.7);
      backdrop-filter: blur(30px);
      border-radius: 20px;
      padding: 28px;
      border: 1px solid rgba(139, 92, 246, 0.25);
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                  box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                  border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .dash-card:hover {
      transform: translateY(-3px) scale(1.01);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px color-mix(in srgb, var(--hover-color, #8B5CF6) 50%, transparent) !important;
      border-color: var(--hover-color, #8B5CF6) !important;
    }

    .page-header-card h1 { font-size: 28px; font-weight: 700; margin: 0; color: #fff; }
    .page-header-card p { font-size: 13.5px; color: #94A3B8; margin: 4px 0 0 0; }
    
    .calendar-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .calendar-toolbar h2 { margin: 0; font-size: 20px; color: #FFF; font-weight: 700; }
    
    .ai-btn { background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #C084FC; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.3s; }
    .ai-btn:hover { background: rgba(139, 92, 246, 0.3); color: #FFF; box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }

    .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
    .day-header { text-align: center; font-size: 12px; font-weight: 700; color: #94A3B8; padding-bottom: 8px; text-transform: uppercase; }
    
    .day-cell { min-height: 95px; padding: 12px !important; display: flex; flex-direction: column; gap: 6px; }
    .day-num { font-size: 13px; font-weight: 600; color: #94A3B8; }
    .day-num.today { background: #8B5CF6; color: #FFF; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(139,92,246,0.6); }
    
    .event-badge { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38BDF8; font-size: 10px; padding: 3px 8px; border-radius: 6px; font-weight: 600; display: inline-block; }
  `]
})
export class CalendarComponent implements OnInit {
  private langService = inject(LanguageService);
  private cdr = inject(ChangeDetectorRef);

  days: number[] = [];
  currentMonthName = 'July';
  currentYear = 2026;
  private monthIndex = 6; // July

  private palette = [
    '#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4', 
    '#14B8A6', '#22C55E', '#84CC16', '#F59E0B', '#F97316', '#E879F9'
  ];

  setRandomColor(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    el.style.setProperty('--hover-color', randomColor);
  }

  ngOnInit() {
    this.updateDaysCount();
    this.langService.lang$.subscribe(() => this.cdr.detectChanges());
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  prevMonth() {
    this.monthIndex--;
    if (this.monthIndex < 0) {
      this.monthIndex = 11;
      this.currentYear--;
    }
    this.updateMonthName();
    this.updateDaysCount();
  }

  nextMonth() {
    this.monthIndex++;
    if (this.monthIndex > 11) {
      this.monthIndex = 0;
      this.currentYear++;
    }
    this.updateMonthName();
    this.updateDaysCount();
  }

  private updateMonthName() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.currentMonthName = months[this.monthIndex];
  }

  private updateDaysCount() {
    const totalDays = new Date(this.currentYear, this.monthIndex + 1, 0).getDate();
    this.days = [];
    for (let i = 1; i <= totalDays; i++) {
      this.days.push(i);
    }
  }

  isToday(day: number): boolean {
    return day === 29 && this.monthIndex === 6 && this.currentYear === 2026;
  }

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}