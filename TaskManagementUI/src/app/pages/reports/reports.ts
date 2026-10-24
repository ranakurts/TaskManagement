import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { Team, TeamService } from '../../services/team.service';
import { UiService } from '../../services/ui.service';
import { TASK_PRIORITIES, TASK_STATUSES, TaskItem, addDays, dueState, todayKey } from '../../models/task.model';
import { TaskRowComponent } from '../../components/task-row/task-row';
import { AvatarComponent, IconComponent } from '../../components/ui/task-bits';

interface Bucket {
  label: string;
  title: string;
  created: number;
  completed: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, TaskRowComponent, AvatarComponent, IconComponent],
  template: `
    <div class="tm-page">
      <header class="tm-page-head">
        <div>
          <h1 class="tm-title">{{ lang.t('rep.title') }}</h1>
          <p class="tm-subtitle">{{ lang.t('rep.subtitle') }}</p>
        </div>
        <div class="tm-actions">
          <select class="tm-select team-select" [ngModel]="teamId()" (ngModelChange)="teamId.set($event)">
            <option [ngValue]="undefined">{{ lang.t('rep.teamFilter') }}</option>
            <option [ngValue]="null">{{ lang.t('common.personal') }}</option>
            @for (t of teams(); track t.id) { <option [ngValue]="t.id">{{ t.name }}</option> }
          </select>
          <div class="tm-seg">
            @for (r of ranges; track r) {
              <button [class.active]="range() === r" (click)="range.set(r)">{{ lang.t('rep.range', { n: r }) }}</button>
            }
          </div>
        </div>
      </header>

      <section class="kpis">
        <div class="kpi tm-card glow">
          <span class="kpi-label">{{ lang.t('rep.completion') }}</span>
          <strong class="kpi-value">{{ completionRate() }}%</strong>
          <div class="tm-progress"><span [style.width.%]="completionRate()"></span></div>
        </div>
        <div class="kpi tm-card glow">
          <span class="kpi-label">{{ lang.t('rep.completedRange') }}</span>
          <strong class="kpi-value">{{ completedInRange().length }}</strong>
          <span class="kpi-sub">{{ lang.t('rep.created') }}: {{ createdInRange().length }}</span>
        </div>
        <div class="kpi tm-card glow">
          <span class="kpi-label">{{ lang.t('rep.cycle') }}</span>
          <strong class="kpi-value">{{ avgCycle() === null ? '—' : avgCycle() }} <small>{{ avgCycle() === null ? '' : lang.t('rep.cycleUnit') }}</small></strong>
        </div>
        <div class="kpi tm-card glow" [class.alert]="overdue().length > 0">
          <span class="kpi-label">{{ lang.t('rep.overdue') }}</span>
          <strong class="kpi-value">{{ overdue().length }}</strong>
        </div>
      </section>

      <section class="tm-card">
        <div class="tm-card-head">
          <div class="tm-card-title"><tm-icon name="reports" [size]="17" />{{ lang.t('rep.trend') }}</div>
          <div class="legend-inline">
            <span><i class="sw created"></i>{{ lang.t('rep.created') }}</span>
            <span><i class="sw completed"></i>{{ lang.t('rep.completedRange') }}</span>
          </div>
        </div>
        <div class="chart">
          @for (b of buckets(); track $index) {
            <div class="bar-col" [attr.title]="b.title + ' — ' + lang.t('rep.created') + ': ' + b.created + ', ' + lang.t('rep.done') + ': ' + b.completed">
              <div class="bars">
                <span class="bar created" [class.zero]="!b.created" [style.height.%]="pct(b.created)"></span>
                <span class="bar completed" [class.zero]="!b.completed" [style.height.%]="pct(b.completed)"></span>
              </div>
              <span class="bar-label">{{ b.label }}</span>
            </div>
          }
        </div>
      </section>

      <div class="two">
        <section class="tm-card">
          <div class="tm-card-head"><div class="tm-card-title">{{ lang.t('rep.statusMix') }}</div></div>
          <div class="stack">
            @for (s of statusMix(); track s.key) {
              @if (s.count) { <span [class]="'st-' + s.key" [style.flex]="s.count" [attr.title]="lang.t('status.' + s.key) + ': ' + s.count"></span> }
            }
          </div>
          <ul class="mix-list">
            @for (s of statusMix(); track s.key) {
              <li [class]="'st-' + s.key"><span class="tm-dot" style="color: var(--c)"></span>{{ lang.t('status.' + s.key) }}<strong>{{ s.count }}</strong><span class="share">{{ share(s.count) }}%</span></li>
            }
          </ul>
        </section>

        <section class="tm-card">
          <div class="tm-card-head"><div class="tm-card-title">{{ lang.t('rep.priorityMix') }}</div></div>
          <ul class="hbars">
            @for (p of priorityMix(); track p.key) {
              <li [class]="'pr-' + p.key">
                <span class="hb-label">{{ lang.t('priority.' + p.key) }}</span>
                <span class="hb-track"><span class="hb-fill" [style.width.%]="maxPriority() ? (p.count / maxPriority()) * 100 : 0"></span></span>
                <strong>{{ p.count }}</strong>
              </li>
            }
          </ul>
        </section>
      </div>

      <div class="two">
        <section class="tm-card">
          <div class="tm-card-head"><div class="tm-card-title"><tm-icon name="team" [size]="17" />{{ lang.t('rep.workload') }}</div></div>
          <div class="workload">
            @for (w of workload(); track w.name) {
              <div class="wl-row">
                <tm-avatar [name]="w.name === '-' ? null : w.name" />
                <div class="wl-main">
                  <div class="wl-head">
                    <span class="tm-ellipsis">{{ w.name === '-' ? lang.t('common.unassigned') : w.name }}</span>
                    <span class="tm-muted">{{ w.open }} {{ lang.t('rep.open').toLocaleLowerCase(lang.locale) }} · {{ w.done }} {{ lang.t('rep.done').toLocaleLowerCase(lang.locale) }}</span>
                  </div>
                  <div class="wl-bar">
                    <span class="wl-done" [style.flex]="w.done"></span>
                    <span class="wl-open" [style.flex]="w.open - w.overdue"></span>
                    <span class="wl-over" [style.flex]="w.overdue"></span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="tm-empty small"><span>{{ lang.t('rep.noData') }}</span></div>
            }
          </div>
        </section>

        <section class="tm-card">
          <div class="tm-card-head"><div class="tm-card-title"><tm-icon name="clock" [size]="17" />{{ lang.t('rep.overdueList') }}</div></div>
          <div class="list">
            @for (task of overdue().slice(0, 8); track task.id) {
              <tm-task-row [task]="task" [compact]="true" />
            } @empty {
              <div class="tm-empty small"><div class="tm-empty-icon"><tm-icon name="check" [size]="22" /></div><span>{{ lang.t('dash.focusEmpty') }}</span></div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .team-select { width: auto; min-width: 170px; }
    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .kpi { display: flex; flex-direction: column; gap: 8px; }
    .kpi-label { font-size: 12px; color: var(--muted); font-weight: 600; }
    .kpi-value { font-size: 30px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
    .kpi-value small { font-size: 14px; color: var(--muted); font-weight: 600; }
    .kpi-sub { font-size: 12px; color: var(--muted); }
    .kpi.alert .kpi-value { color: #FCA5A5; }
    .legend-inline { display: flex; gap: 14px; font-size: 12px; color: var(--muted); }
    .legend-inline span { display: inline-flex; align-items: center; gap: 6px; }
    .sw { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
    .sw.created, .bar.created { background: color-mix(in srgb, var(--secondary) 70%, transparent); }
    .sw.completed, .bar.completed { background: linear-gradient(180deg, var(--accent), var(--primary)); }
    .chart { display: flex; align-items: flex-end; gap: 4px; height: 220px; padding-top: 10px; }
    .bar-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; gap: 6px; }
    .bars { flex: 1; display: flex; align-items: flex-end; justify-content: center; gap: 2px; border-bottom: 1px solid var(--line); }
    .bar { width: 42%; max-width: 16px; min-height: 2px; border-radius: 4px 4px 1px 1px; transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    .bar.zero { opacity: 0; }
    .bar-label { font-size: 10.5px; color: var(--muted); text-align: center; white-space: nowrap; overflow: hidden; }
    .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
    .stack { display: flex; height: 14px; border-radius: 999px; overflow: hidden; gap: 2px; background: var(--elev-2); margin-bottom: 18px; }
    .stack span { background: var(--c); }
    .mix-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .mix-list li { display: flex; align-items: center; gap: 10px; font-size: 13.5px; }
    .mix-list strong { margin-left: auto; }
    .share { width: 44px; text-align: right; color: var(--muted); font-size: 12px; }
    .hbars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
    .hbars li { display: grid; grid-template-columns: 80px 1fr 32px; align-items: center; gap: 12px; font-size: 13px; }
    .hb-track { height: 10px; border-radius: 999px; background: var(--elev-2); overflow: hidden; }
    .hb-fill { display: block; height: 100%; border-radius: inherit; background: var(--c); transition: width 0.5s ease; }
    .hbars strong { text-align: right; }
    .workload { display: flex; flex-direction: column; gap: 14px; }
    .wl-row { display: flex; gap: 12px; align-items: center; }
    .wl-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
    .wl-head { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; font-weight: 600; }
    .wl-head .tm-muted { font-weight: 500; font-size: 12px; white-space: nowrap; }
    .wl-bar { display: flex; height: 8px; border-radius: 999px; overflow: hidden; background: var(--elev-2); gap: 2px; }
    .wl-done { background: var(--st-done); }
    .wl-open { background: var(--st-progress); }
    .wl-over { background: #EF4444; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .tm-empty.small { padding: 18px 8px; }
    @media (max-width: 1000px) {
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .two { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .chart { height: 160px; }
      .bar.zero { opacity: 0; }
    .bar-label { font-size: 9px; }
      .kpi-value { font-size: 24px; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  lang = inject(LanguageService);
  ui = inject(UiService);
  store = inject(TaskStoreService);
  private teamService = inject(TeamService);

  readonly ranges = [7, 30, 90];
  range = signal(30);
  teamId = signal<number | null | undefined>(undefined);
  teams = signal<Team[]>([]);

  private scoped = computed(() => this.store.tasks().filter(t => this.teamId() === undefined || t.teamId === this.teamId()));
  private since = computed(() => Date.now() - this.range() * 86400000);

  createdInRange = computed(() => this.scoped().filter(t => new Date(t.createdAt).getTime() >= this.since()));
  completedInRange = computed(() => this.scoped().filter(t => t.completedAt && new Date(t.completedAt).getTime() >= this.since()));
  overdue = computed(() => this.scoped().filter(t => dueState(t) === 'overdue').sort((a, b) => a.dueDate!.localeCompare(b.dueDate!)));

  completionRate = computed(() => {
    const all = this.scoped();
    return all.length ? Math.round((all.filter(t => t.status === 'done').length / all.length) * 100) : 0;
  });

  avgCycle = computed(() => {
    const done = this.completedInRange();
    if (!done.length) return null;
    const total = done.reduce((sum, t) => sum + (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()), 0);
    return Math.round((total / done.length / 86400000) * 10) / 10;
  });

  // 7/30 gün için günlük, 90 gün için haftalık sütunlar
  buckets = computed<Bucket[]>(() => {
    this.lang.lang();
    const days = this.range();
    const step = days > 30 ? 7 : 1;
    const count = Math.ceil(days / step);
    const today = new Date();
    const result: Bucket[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const end = addDays(today, -i * step);
      const start = addDays(end, -(step - 1));
      const startKey = todayKey(start), endKey = todayKey(end);
      const inBucket = (iso: string | null) => {
        if (!iso) return false;
        const k = todayKey(new Date(iso));
        return k >= startKey && k <= endKey;
      };
      const showLabel = step > 1 || days <= 7 || i % 5 === 0 || i === 0;
      result.push({
        label: showLabel ? this.lang.formatDate(step > 1 ? start : end, days <= 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' }) : '',
        title: step > 1 ? `${this.lang.formatDate(start)} – ${this.lang.formatDate(end)}` : this.lang.formatDate(end, { weekday: 'long', day: 'numeric', month: 'long' }),
        created: this.scoped().filter(t => inBucket(t.createdAt)).length,
        completed: this.scoped().filter(t => inBucket(t.completedAt)).length
      });
    }
    return result;
  });

  private maxBucket = computed(() => Math.max(1, ...this.buckets().map(b => Math.max(b.created, b.completed))));

  statusMix = computed(() => TASK_STATUSES.map(key => ({ key, count: this.scoped().filter(t => t.status === key).length })));
  priorityMix = computed(() => [...TASK_PRIORITIES].reverse().map(key => ({ key, count: this.scoped().filter(t => t.priority === key && t.status !== 'done').length })));
  maxPriority = computed(() => Math.max(0, ...this.priorityMix().map(p => p.count)));

  workload = computed(() => {
    const map = new Map<string, { name: string; open: number; done: number; overdue: number }>();
    for (const t of this.scoped()) {
      const name = t.assignedUserName || '-';
      const row = map.get(name) ?? { name, open: 0, done: 0, overdue: 0 };
      if (t.status === 'done') row.done++; else row.open++;
      if (dueState(t) === 'overdue') row.overdue++;
      map.set(name, row);
    }
    return [...map.values()].sort((a, b) => b.open - a.open || b.done - a.done).slice(0, 8);
  });

  ngOnInit() {
    this.store.load();
    this.teamService.getMyTeams().subscribe({ next: t => this.teams.set(t), error: () => {} });
  }

  pct(value: number) {
    return (value / this.maxBucket()) * 100;
  }

  share(count: number) {
    const total = this.scoped().length;
    return total ? Math.round((count / total) * 100) : 0;
  }
}
