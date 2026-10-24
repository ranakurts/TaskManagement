import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { UiService } from '../../services/ui.service';
import { PRIORITY_WEIGHT, TASK_PRIORITIES, TaskItem, addDays, todayKey } from '../../models/task.model';
import { TaskRowComponent } from '../../components/task-row/task-row';
import { IconComponent } from '../../components/ui/task-bits';

// Her güne kendi parıltı rengi (imleç gelince o renkte yanar)
const DAY_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#06B6D4', '#14B8A6', '#22C55E', '#84CC16', '#F59E0B', '#F97316', '#EF4444', '#E879F9', '#6366F1'];

interface Day {
  key: string;
  color: string;
  hasOverdue: boolean;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  tasks: TaskItem[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [TaskRowComponent, IconComponent],
  template: `
    <div class="tm-page wide">
      <header class="tm-page-head">
        <div>
          <h1 class="tm-title">{{ lang.t('cal.title') }}</h1>
          <p class="tm-subtitle">{{ lang.t('cal.subtitle') }}</p>
        </div>
        <div class="tm-actions">
          <button class="tm-btn" (click)="goToday()">{{ lang.t('cal.today') }}</button>
          <div class="nav">
            <button class="tm-btn icon" (click)="shift(-1)" aria-label="Previous"><tm-icon name="chevronLeft" [size]="18" /></button>
            <span class="month">{{ monthLabel() }}</span>
            <button class="tm-btn icon" (click)="shift(1)" aria-label="Next"><tm-icon name="chevronRight" [size]="18" /></button>
          </div>
          <button class="tm-btn primary" (click)="ui.newTask({ dueDate: selected() })"><tm-icon name="plus" [size]="16" />{{ lang.t('nav.newTask') }}</button>
        </div>
      </header>

      <div class="layout">
        <section class="tm-card cal">
          <div class="weekdays">
            @for (w of weekdays(); track $index) { <span>{{ w }}</span> }
          </div>
          <div class="legend">
            <span><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18h2v-7h9l-1.5-3.5L16 7H7V3z"/></svg>{{ lang.t('cal.deadline') }}</span>
            @for (p of priorities; track p) { <span [class]="'pr-' + p"><i></i>{{ lang.t('priority.' + p) }}</span> }
            <span class="hint">{{ lang.t('cal.dblHint') }}</span>
          </div>
          <div class="grid">
            @for (day of days(); track day.key) {
              <div class="cell" [style.--day-c]="day.color" [class.out]="!day.inMonth" [class.today]="day.isToday" [class.weekend]="day.isWeekend" [class.selected]="day.key === selected()" [class.has-overdue]="day.hasOverdue"
                   (click)="selected.set(day.key)" (dblclick)="ui.newTask({ dueDate: day.key })" tabindex="0" (keydown.enter)="selected.set(day.key)">
                <div class="cell-head">
                  <span class="num">{{ day.date.getDate() }}</span>
                  @if (day.tasks.length) { <span class="load" [style.--n]="day.tasks.length"></span> }
                </div>
                <div class="events">
                  @for (task of day.tasks.slice(0, 3); track task.id) {
                    <button class="event no-glow" [class]="'event no-glow pr-' + task.priority" [class.done]="task.status === 'done'" (click)="$event.stopPropagation(); ui.openTask(task.id)"
                            [attr.title]="lang.t('cal.deadline') + ': ' + task.title + (task.assignedUserName ? ' · ' + task.assignedUserName : '')">
                      <svg class="flag" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v18h2v-7h9l-1.5-3.5L16 7H7V3z"/></svg>
                      <span class="tm-ellipsis">{{ task.title }}</span>
                    </button>
                  }
                  @if (day.tasks.length > 3) { <span class="more">{{ lang.t('cal.more', { n: day.tasks.length - 3 }) }}</span> }
                </div>
              </div>
            }
          </div>
        </section>

        <aside class="side">
          <section class="tm-card">
            <div class="tm-card-head">
              <div>
                <div class="tm-eyebrow">{{ lang.t('cal.selected') }}</div>
                <div class="tm-card-title day-title">{{ lang.formatDate(selected(), { weekday: 'long', day: 'numeric', month: 'long' }) }}</div>
              </div>
              <button class="tm-btn sm icon" (click)="ui.newTask({ dueDate: selected() })" [attr.title]="lang.t('cal.addHere')"><tm-icon name="plus" [size]="15" /></button>
            </div>
            <div class="list">
              @for (task of selectedTasks(); track task.id) {
                <tm-task-row [task]="task" [compact]="true" />
              } @empty {
                <div class="tm-empty small">
                  <span>{{ lang.t('cal.noTasks') }}</span>
                  <button class="tm-btn sm" (click)="ui.newTask({ dueDate: selected() })"><tm-icon name="plus" [size]="14" />{{ lang.t('cal.addHere') }}</button>
                </div>
              }
            </div>
          </section>

          @if (unscheduled().length) {
            <section class="tm-card">
              <div class="tm-card-head"><div class="tm-card-title"><tm-icon name="inbox" [size]="16" />{{ lang.t('cal.noDate') }} <span class="count">{{ unscheduled().length }}</span></div></div>
              <div class="list">
                @for (task of unscheduled().slice(0, 6); track task.id) {
                  <tm-task-row [task]="task" [compact]="true" />
                }
              </div>
            </section>
          }
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .tm-page.wide { max-width: 1600px; }
    .nav { display: flex; align-items: center; gap: 8px; }
    .month { min-width: 150px; text-align: center; font-weight: 700; font-size: 16px; text-transform: capitalize; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
    .cal { padding: 16px; }
    .weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 6px; }
    .weekdays span { text-align: center; font-size: 11.5px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; padding: 6px 0; }
    .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
    .cell {
      min-height: 112px; padding: 8px; border-radius: 12px; background: var(--elev); border: 1px solid var(--line);
      display: flex; flex-direction: column; gap: 6px; cursor: pointer; outline: none; min-width: 0;
      transition: border-color 0.2s, background 0.2s;
    }
    .cell:hover {
      border-color: var(--day-c);
      background: color-mix(in srgb, var(--day-c) 12%, transparent);
      box-shadow: 0 0 0 1px var(--day-c), 0 0 26px color-mix(in srgb, var(--day-c) 45%, transparent), inset 0 0 18px color-mix(in srgb, var(--day-c) 14%, transparent);
    }
    .cell:hover .num { color: var(--day-c); }
    .cell.has-overdue { border-color: rgba(239, 68, 68, 0.45); }
    .cell.weekend { background: rgba(255,255,255,0.025); }
    .cell.out { opacity: 0.38; }
    .cell.selected { border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary), 0 0 24px color-mix(in srgb, var(--primary) 25%, transparent); }
    .cell-head { display: flex; align-items: center; justify-content: space-between; }
    .num { font-size: 13px; font-weight: 700; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
    .today .num { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 45%, transparent); }
    .load { width: calc(min(var(--n), 5) * 6px); height: 4px; border-radius: 999px; background: var(--accent); opacity: 0.8; }
    .events { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .event {
      display: flex; align-items: center; width: 100%; min-width: 0; border: 0; text-align: left; cursor: pointer;
      font-size: 11.5px; font-weight: 600; padding: 3px 7px; border-radius: 7px; color: var(--text);
      background: color-mix(in srgb, var(--c) 20%, transparent); border-left: 3px solid var(--c);
    }
    .event .flag { flex-shrink: 0; margin-right: 5px; color: var(--c); }
    .event:hover { background: color-mix(in srgb, var(--c) 32%, transparent); }
    .event.done { opacity: 0.5; text-decoration: line-through; }
    .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; font-size: 12px; color: var(--muted); padding: 0 4px 12px; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .legend i { width: 10px; height: 10px; border-radius: 3px; background: var(--c); }
    .legend .hint { margin-left: auto; font-style: italic; }
    .more { font-size: 11px; color: var(--muted); padding-left: 4px; }
    .side { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 100px; }
    .day-title { text-transform: capitalize; font-size: 16px; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .count { font-size: 11.5px; color: var(--muted); background: var(--elev-2); padding: 1px 8px; border-radius: 999px; }
    .tm-empty.small { padding: 16px 8px; }
    @media (max-width: 1100px) {
      .layout { grid-template-columns: 1fr; }
      .side { position: static; }
    }
    @media (max-width: 720px) {
      .cell { min-height: 64px; padding: 5px; }
      .event { font-size: 0; padding: 0; height: 6px; border-left-width: 0; background: var(--c); }
      .event span, .event .flag { display: none; }
      .legend .hint { display: none; }
      .more { display: none; }
      .weekdays span { font-size: 10px; letter-spacing: 0; }
      .month { min-width: 0; font-size: 14px; }
    }
  `]
})
export class CalendarComponent implements OnInit {
  lang = inject(LanguageService);
  ui = inject(UiService);
  store = inject(TaskStoreService);
  private route = inject(ActivatedRoute);

  readonly priorities = [...TASK_PRIORITIES].reverse();

  // Gösterilen ayın ilk günü
  cursor = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  selected = signal(todayKey());

  monthLabel = computed(() => { this.lang.lang(); return this.lang.formatDate(this.cursor(), { month: 'long', year: 'numeric' }); });

  // Pazartesi ile başlayan kısa gün adları
  weekdays = computed(() => {
    this.lang.lang();
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => this.lang.formatDate(addDays(monday, i), { weekday: 'short' }));
  });

  private tasksByDay = computed(() => {
    const map = new Map<string, TaskItem[]>();
    for (const t of this.store.tasks()) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done') || PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
    }
    return map;
  });

  days = computed<Day[]>(() => {
    const first = this.cursor();
    const offset = (first.getDay() + 6) % 7; // Pazartesi = 0
    const start = addDays(first, -offset);
    const today = todayKey();
    const map = this.tasksByDay();
    return Array.from({ length: 42 }, (_, i) => {
      const date = addDays(start, i);
      const key = todayKey(date);
      const tasks = map.get(key) ?? [];
      return {
        key, date,
        color: DAY_COLORS[(date.getDate() + date.getMonth() * 5) % DAY_COLORS.length],
        hasOverdue: key < today && tasks.some(t => t.status !== 'done'),
        inMonth: date.getMonth() === first.getMonth(),
        isToday: key === today,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        tasks
      };
    });
  });

  selectedTasks = computed(() => this.tasksByDay().get(this.selected()) ?? []);

  unscheduled = computed(() => this.store.tasks().filter(t => !t.dueDate && t.status !== 'done'));

  ngOnInit() {
    this.store.load();
    // Ana sayfadan ?date=yyyy-MM-dd ile gelinirse o gün seçili açılır
    const date = this.route.snapshot.queryParamMap.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m] = date.split('-').map(Number);
      this.cursor.set(new Date(y, m - 1, 1));
      this.selected.set(date);
    }
  }

  shift(months: number) {
    const c = this.cursor();
    this.cursor.set(new Date(c.getFullYear(), c.getMonth() + months, 1));
  }

  goToday() {
    const now = new Date();
    this.cursor.set(new Date(now.getFullYear(), now.getMonth(), 1));
    this.selected.set(todayKey());
  }
}
