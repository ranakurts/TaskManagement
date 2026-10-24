import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { Team, TeamService } from '../../services/team.service';
import { UiService } from '../../services/ui.service';
import { UserStateService } from '../../services/user-state.service';
import { PRIORITY_WEIGHT, TASK_STATUSES, TaskItem, addDays, daysUntil, dueState, todayKey } from '../../models/task.model';
import { TaskRowComponent } from '../../components/task-row/task-row';
import { AvatarComponent, IconComponent } from '../../components/ui/task-bits';

type FocusTab = 'today' | 'week' | 'all';

interface Activity {
  key: string;
  icon: string;
  tone: string;
  name: string;
  text: string;
  title: string;
  taskId: number;
  at: string;
}

// Ana sayfa: "Bugün ne yapmalıyım?" sorusuna öncelik veren sade bir düzen.
// Üstte başlık + hızlı eylemler, altında metrik şeridi; solda odak listesi ve haftalık şerit, sağda ilerleme/takımlar/aktivite.
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, TaskRowComponent, IconComponent, AvatarComponent],
  template: `
    <div class="tm-page">
      <!-- BAŞLIK -->
      <header class="head">
        <div class="head-text">
          <span class="date">{{ todayLabel() }}</span>
          <h1>{{ greeting() }}@if (firstName()) {, <span class="name">{{ firstName() }}</span>}</h1>
          <p>{{ summary() }}</p>
        </div>
      </header>

      @if (store.error()) {
        <div class="tm-card error-card">
          <tm-icon name="close" [size]="16" />
          <span>{{ lang.t(store.error() === 'server' ? 'common.serverDown' : 'common.loadError') }}</span>
          <button class="tm-btn sm" (click)="store.refresh()"><tm-icon name="refresh" [size]="14" />{{ lang.t('common.retry') }}</button>
        </div>
      }

      <!-- METRİK ŞERİDİ -->
      <section class="stats">
        @for (s of stats(); track s.key) {
          <button class="stat tm-card no-glow" [class.alert]="s.alert" [style.--k]="s.color" (click)="s.action()">
            <div class="stat-top">
              <span class="stat-label">{{ lang.t(s.key) }}</span>
              <span class="stat-icon"><tm-icon [name]="s.icon" [size]="15" /></span>
            </div>
            @if (store.loaded()) {
              <strong class="stat-value">{{ s.value }}</strong>
            } @else {
              <span class="tm-skeleton" style="height: 32px; width: 56px; display: block"></span>
            }
            <span class="stat-sub">{{ s.sub }}</span>
          </button>
        }
      </section>

      <div class="grid">
        <!-- SOL SÜTUN -->
        <div class="col main">
          <section class="tm-card focus">
            <div class="card-head">
              <div>
                <h2>{{ lang.t('dash.focus') }}</h2>
                <span class="card-sub">{{ lang.t('dash.focusSub') }}</span>
              </div>
              <div class="tm-seg tabs">
                @for (tab of tabs; track tab) {
                  <button [class.active]="focusTab() === tab" (click)="focusTab.set(tab)">
                    {{ lang.t('dash.tab.' + tab) }}<span class="count" [class.hot]="tab === 'today' && tabCount(tab) > 0">{{ tabCount(tab) }}</span>
                  </button>
                }
              </div>
            </div>

            <div class="list">
              @if (!store.loaded()) {
                @for (i of [1, 2, 3]; track i) { <div class="tm-skeleton" style="height: 60px"></div> }
              } @else {
                @for (task of focusList(); track task.id) {
                  <tm-task-row [task]="task" />
                } @empty {
                  <div class="empty">
                    <div class="empty-icon"><tm-icon [name]="store.tasks().length ? 'check' : 'sparkle'" [size]="22" /></div>
                    @if (store.tasks().length === 0) {
                      <strong>{{ lang.t('dash.emptyTitle') }}</strong>
                      <span>{{ lang.t('dash.emptyText') }}</span>
                      <button class="tm-btn primary sm" (click)="ui.newTask()"><tm-icon name="plus" [size]="14" />{{ lang.t('nav.newTask') }}</button>
                    } @else {
                      <strong>{{ lang.t('dash.tabEmpty.' + focusTab()) }}</strong>
                      <span>{{ lang.t('dash.tabEmptyHint') }}</span>
                    }
                  </div>
                }
                @if (focusMore() > 0) {
                  <a class="more" routerLink="/tasks">{{ lang.t('dash.more', { n: focusMore() }) }}<tm-icon name="arrowRight" [size]="14" /></a>
                }
              }
            </div>
          </section>

          <!-- 7 GÜNLÜK ŞERİT -->
          <section class="tm-card week">
            <div class="card-head">
              <div>
                <h2>{{ lang.t('dash.weekTitle') }}</h2>
                <span class="card-sub">{{ lang.t('dash.weekSub') }}</span>
              </div>
              <a class="tm-btn ghost sm" routerLink="/calendar">{{ lang.t('nav.calendar') }}<tm-icon name="arrowRight" [size]="14" /></a>
            </div>
            <div class="days">
              @for (d of week(); track d.key) {
                <button class="day no-glow" [class.today]="d.isToday" [class.busy]="d.tasks.length > 0" (click)="openDay(d.key)">
                  <span class="dname">{{ d.name }}</span>
                  <span class="dnum">{{ d.num }}</span>
                  <span class="dots">
                    @for (t of d.tasks.slice(0, 4); track t.id) { <i [class]="'pr-' + t.priority"></i> }
                  </span>
                  <span class="dcount">{{ d.tasks.length ? lang.t('dash.dayCount', { n: d.tasks.length }) : '—' }}</span>
                </button>
              }
            </div>
          </section>
        </div>

        <!-- SAĞ SÜTUN -->
        <div class="col side">
          <section class="tm-card progress">
            <div class="card-head"><h2>{{ lang.t('dash.progress') }}</h2></div>
            <div class="progress-body">
              <div class="ring" [style.--p]="completion()">
                <div class="ring-inner"><strong>{{ completion() }}<small>%</small></strong><span>{{ lang.t('dash.completion') }}</span></div>
              </div>
              <ul class="bars">
                @for (s of statusMix(); track s.status) {
                  <li [class]="'st-' + s.status">
                    <div class="bar-label"><span class="tm-dot" style="color: var(--c)"></span>{{ lang.t('status.' + s.status) }}<strong>{{ s.count }}</strong></div>
                    <div class="bar"><span [style.width.%]="s.pct"></span></div>
                  </li>
                }
              </ul>
            </div>
          </section>

          <section class="tm-card">
            <div class="card-head">
              <h2>{{ lang.t('dash.teams') }}</h2>
              <a class="tm-btn ghost sm" routerLink="/team">{{ lang.t('common.viewAll') }}<tm-icon name="arrowRight" [size]="14" /></a>
            </div>
            <div class="teams">
              @for (team of teams(); track team.id) {
                <a class="team-item" routerLink="/team">
                  <tm-avatar [name]="team.name" />
                  <span class="team-text">
                    <strong class="tm-ellipsis">{{ team.name }}</strong>
                    <span>{{ lang.t('dash.members', { n: team.memberCount }) }} · {{ lang.t('dash.openCount', { n: teamOpenCount(team.id) }) }}</span>
                  </span>
                  @if (team.myRole === 'Admin') { <span class="role">Admin</span> }
                </a>
              } @empty {
                <div class="empty small">
                  <span>{{ lang.t('dash.teamsEmpty') }}</span>
                  <a class="tm-btn sm" routerLink="/team"><tm-icon name="plus" [size]="14" />{{ lang.t('dash.createTeam') }}</a>
                </div>
              }
            </div>
          </section>

          <section class="tm-card">
            <div class="card-head"><h2>{{ lang.t('dash.activity') }}</h2></div>
            <ol class="timeline">
              @for (a of activity(); track a.key) {
                <li (click)="ui.openTask(a.taskId)">
                  <span class="tl-dot" [style.--c]="a.tone"><tm-icon [name]="a.icon" [size]="11" [stroke]="2.6" /></span>
                  <div class="tl-body">
                    <span class="tl-text"><strong>{{ a.name }}</strong> {{ a.text }}</span>
                    <span class="tl-title tm-ellipsis">{{ a.title }}</span>
                  </div>
                  <span class="tl-time">{{ lang.timeAgo(a.at) }}</span>
                </li>
              } @empty {
                <div class="empty small"><span>{{ lang.t('dash.activityEmpty') }}</span></div>
              }
            </ol>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ---------- Başlık ---------- */
    .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; padding: 8px 2px 4px; }
    .date { display: block; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
    h1 { font-size: clamp(28px, 3vw, 36px); font-weight: 800; letter-spacing: -0.035em; line-height: 1.1; }
    .name { background: linear-gradient(120deg, var(--accent), var(--secondary)); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .head p { margin: 10px 0 0; font-size: 15px; color: var(--text-secondary); max-width: 620px; }

    .error-card { display: flex; align-items: center; gap: 12px; color: #FCA5A5; padding: 14px 18px; }
    .error-card .tm-btn { margin-left: auto; }

    /* ---------- Metrik şeridi ---------- */
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .stat { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 18px 20px; text-align: left; color: var(--text); cursor: pointer; font: inherit; position: relative; overflow: hidden; }
    .stat::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: linear-gradient(90deg, var(--k), transparent 80%); opacity: 0.7; }
    .stat-top { display: flex; align-items: center; justify-content: space-between; width: 100%; }
    .stat-label { font-size: 13px; font-weight: 600; color: var(--muted); }
    .stat-icon { width: 28px; height: 28px; border-radius: 9px; display: flex; align-items: center; justify-content: center; color: var(--k); background: color-mix(in srgb, var(--k) 14%, transparent); }
    .stat-value { font-size: 34px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; font-variant-numeric: tabular-nums; }
    .stat-sub { font-size: 12.5px; color: var(--muted); }
    .stat.alert .stat-value { color: #FCA5A5; }

    /* ---------- Izgara ---------- */
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
    .col { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
    .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .card-head h2 { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
    .card-sub { display: block; margin-top: 3px; font-size: 12.5px; color: var(--muted); }

    /* Odak listesi */
    .tabs button { gap: 7px; }
    .count { min-width: 20px; height: 18px; padding: 0 6px; border-radius: 999px; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); color: var(--muted); }
    .count.hot { background: color-mix(in srgb, var(--primary) 45%, transparent); color: #fff; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .more { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 13px; font-weight: 600; color: var(--accent); text-decoration: none; }
    .more:hover { text-decoration: underline; }

    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 30px 16px; color: var(--muted); font-size: 13px; }
    .empty strong { color: var(--text); font-size: 15px; }
    .empty-icon { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; color: var(--accent); background: color-mix(in srgb, var(--primary) 14%, transparent); }
    .empty.small { padding: 16px 8px; }

    /* 7 günlük şerit */
    .days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
    .day { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 4px; border-radius: 14px; border: 1px solid var(--line); background: rgba(255,255,255,0.02); color: var(--text); cursor: pointer; font: inherit; transition: border-color 0.2s, background 0.2s, box-shadow 0.25s; }
    .day:hover { border-color: color-mix(in srgb, var(--hover-color) 60%, transparent); background: color-mix(in srgb, var(--hover-color) 8%, transparent); box-shadow: 0 0 20px color-mix(in srgb, var(--hover-color) 22%, transparent); }
    .day.today { border-color: color-mix(in srgb, var(--primary) 70%, transparent); background: color-mix(in srgb, var(--primary) 14%, transparent); }
    .dname { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
    .dnum { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .dots { display: flex; gap: 3px; height: 6px; }
    .dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--c); }
    .dcount { font-size: 11px; color: var(--muted); white-space: nowrap; }
    .day.busy .dcount { color: var(--text-secondary); }

    /* İlerleme */
    .progress-body { display: flex; align-items: center; gap: 20px; }
    .ring { --p: 0; width: 116px; height: 116px; flex-shrink: 0; border-radius: 50%; padding: 10px; background: conic-gradient(var(--accent) calc(var(--p) * 1%), rgba(255,255,255,0.07) 0); transition: background 0.6s ease; }
    .ring-inner { width: 100%; height: 100%; border-radius: 50%; background: color-mix(in srgb, var(--surface) 96%, black 4%); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .ring-inner strong { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
    .ring-inner small { font-size: 14px; color: var(--muted); margin-left: 1px; }
    .ring-inner span { margin-top: 4px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .bars { list-style: none; margin: 0; padding: 0; flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
    .bar-label { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-secondary); margin-bottom: 4px; }
    .bar-label strong { margin-left: auto; color: var(--text); font-variant-numeric: tabular-nums; }
    .bar { height: 5px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; }
    .bar span { display: block; height: 100%; border-radius: inherit; background: var(--c); transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1); }

    /* Takımlar */
    .teams { display: flex; flex-direction: column; gap: 4px; }
    .team-item { display: flex; align-items: center; gap: 12px; padding: 8px; margin: 0 -8px; border-radius: 12px; text-decoration: none; color: var(--text); transition: background 0.2s, box-shadow 0.25s; }
    .team-item:hover { background: rgba(255,255,255,0.04); box-shadow: 0 0 0 1px color-mix(in srgb, var(--hover-color) 50%, transparent), 0 0 18px color-mix(in srgb, var(--hover-color) 20%, transparent); }
    .team-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .team-text strong { font-size: 14px; }
    .team-text span { font-size: 12px; color: var(--muted); }
    .role { font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 999px; color: #F9A8D4; background: rgba(236,72,153,0.12); }

    /* Aktivite zaman çizelgesi */
    .timeline { list-style: none; margin: 0; padding: 0; position: relative; }
    .timeline::before { content: ''; position: absolute; left: 11px; top: 8px; bottom: 8px; width: 1px; background: var(--line); }
    .timeline li { position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 8px 8px 8px 0; margin-right: -8px; border-radius: 12px; cursor: pointer; transition: background 0.2s; }
    .timeline li:hover { background: rgba(255,255,255,0.03); }
    .tl-dot { position: relative; z-index: 1; width: 23px; height: 23px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--c); background: color-mix(in srgb, var(--c) 18%, var(--surface)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--surface) 90%, transparent); }
    .tl-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .tl-text { font-size: 12.5px; color: var(--muted); }
    .tl-text strong { color: var(--text-secondary); font-weight: 600; }
    .tl-title { font-size: 13.5px; font-weight: 600; }
    .tl-time { font-size: 11px; color: var(--muted); white-space: nowrap; padding-top: 2px; }

    @media (max-width: 1180px) {
      .grid { grid-template-columns: 1fr; }
      .side { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); align-items: start; }
    }
    @media (max-width: 900px) {
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .head { align-items: flex-start; }
      .stat { padding: 14px; }
      .stat-value { font-size: 28px; }
      .tabs { width: 100%; }
      .tabs button { flex: 1; justify-content: center; padding: 0 6px; }
      .days { grid-template-columns: repeat(7, minmax(42px, 1fr)); overflow-x: auto; }
      .dcount { display: none; }
      .progress-body { flex-direction: column; align-items: stretch; }
      .ring { align-self: center; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  lang = inject(LanguageService);
  ui = inject(UiService);
  store = inject(TaskStoreService);
  private teamService = inject(TeamService);
  private userState = inject(UserStateService);
  private router = inject(Router);

  readonly tabs: FocusTab[] = ['today', 'week', 'all'];
  private readonly FOCUS_LIMIT = 6;

  me = toSignal(this.userState.currentUser$, { initialValue: null });
  teams = signal<Team[]>([]);
  focusTab = signal<FocusTab>('today');

  firstName = computed(() => (this.me()?.fullName || '').trim().split(' ')[0]);

  greeting = computed(() => {
    this.lang.lang();
    const h = new Date().getHours();
    return this.lang.t(h < 5 ? 'dash.night' : h < 12 ? 'dash.morning' : h < 18 ? 'dash.afternoon' : h < 22 ? 'dash.evening' : 'dash.night');
  });

  todayLabel = computed(() => { this.lang.lang(); return this.lang.formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }); });

  open = computed(() => this.store.tasks().filter(t => t.status !== 'done'));

  // Bana atanan ya da kimseye atanmamış kendi görevlerim
  private mine = computed(() => {
    const id = this.me()?.id;
    return this.open().filter(t => t.assignedUserId === id || (t.assignedUserId === null && t.createdById === id));
  });

  private byUrgency = (a: TaskItem, b: TaskItem) =>
    (a.dueDate ? daysUntil(a.dueDate) : 9999) - (b.dueDate ? daysUntil(b.dueDate) : 9999) || PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];

  private tabLists = computed<Record<FocusTab, TaskItem[]>>(() => {
    const mine = [...this.mine()].sort(this.byUrgency);
    return {
      today: mine.filter(t => t.dueDate && daysUntil(t.dueDate) <= 0),
      week: mine.filter(t => t.dueDate && daysUntil(t.dueDate) > 0 && daysUntil(t.dueDate) <= 7),
      all: mine
    };
  });

  focusList = computed(() => this.tabLists()[this.focusTab()].slice(0, this.FOCUS_LIMIT));
  focusMore = computed(() => Math.max(0, this.tabLists()[this.focusTab()].length - this.FOCUS_LIMIT));

  tabCount(tab: FocusTab) {
    return this.tabLists()[tab].length;
  }

  summary = computed(() => {
    if (!this.store.loaded()) return '';
    const today = this.tabLists().today.length;
    if (this.open().length === 0) return this.lang.t('dash.heroSubEmpty');
    return this.lang.t('dash.heroSub', { today, open: this.open().length });
  });

  completion = computed(() => {
    const all = this.store.tasks();
    return all.length ? Math.round((all.filter(t => t.status === 'done').length / all.length) * 100) : 0;
  });

  stats = computed(() => {
    this.lang.lang();
    const open = this.open();
    const weekAgo = Date.now() - 7 * 86400000;
    const dueToday = open.filter(t => t.dueDate === todayKey()).length;
    const dueTomorrow = open.filter(t => t.dueDate && daysUntil(t.dueDate) === 1).length;
    const overdue = open.filter(t => dueState(t) === 'overdue').length;
    const doneWeek = this.store.tasks().filter(t => t.completedAt && new Date(t.completedAt).getTime() >= weekAgo).length;
    const inProgress = open.filter(t => t.status === 'inProgress' || t.status === 'review').length;
    const go = (path: string) => () => this.router.navigate([path]);
    return [
      { key: 'dash.stat.open', icon: 'tasks', color: 'var(--primary)', value: open.length, sub: this.lang.t('dash.stat.openSub', { n: inProgress }), alert: false, action: go('/tasks') },
      { key: 'dash.stat.today', icon: 'calendar', color: 'var(--st-review)', value: dueToday, sub: this.lang.t('dash.stat.todaySub', { n: dueTomorrow }), alert: false, action: () => this.focusTab.set('today') },
      { key: 'dash.overdue', icon: 'clock', color: '#EF4444', value: overdue, sub: this.lang.t(overdue ? 'dash.stat.overdueSub' : 'dash.stat.overdueNone'), alert: overdue > 0, action: go('/tasks') },
      { key: 'dash.doneWeek', icon: 'check', color: 'var(--st-done)', value: doneWeek, sub: this.lang.t('dash.stat.doneSub', { n: this.completion() }), alert: false, action: go('/reports') }
    ];
  });

  // Bugünden itibaren 7 gün ve o günlerin teslim tarihleri
  week = computed(() => {
    this.lang.lang();
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      const key = todayKey(date);
      return {
        key,
        isToday: i === 0,
        name: i === 0 ? this.lang.t('common.today') : this.lang.formatDate(date, { weekday: 'short' }),
        num: date.getDate(),
        tasks: this.open().filter(t => t.dueDate === key).sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])
      };
    });
  });

  statusMix = computed(() => {
    const all = this.store.tasks();
    return TASK_STATUSES.map(status => {
      const count = all.filter(t => t.status === status).length;
      return { status, count, pct: all.length ? (count / all.length) * 100 : 0 };
    });
  });

  activity = computed<Activity[]>(() => {
    this.lang.lang();
    const events: Activity[] = [];
    for (const t of this.store.tasks()) {
      events.push({ key: 'c' + t.id, icon: 'plus', tone: 'var(--primary)', name: t.createdByName, text: this.lang.t('dash.act.createdShort'), title: t.title, taskId: t.id, at: t.createdAt });
      if (t.completedAt) {
        events.push({ key: 'd' + t.id, icon: 'check', tone: 'var(--st-done)', name: t.assignedUserName || t.createdByName, text: this.lang.t('dash.act.completedShort'), title: t.title, taskId: t.id, at: t.completedAt });
      }
    }
    return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  });

  ngOnInit() {
    this.store.load();
    this.teamService.getMyTeams().subscribe({ next: teams => this.teams.set(teams), error: () => this.teams.set([]) });
  }

  teamOpenCount(teamId: number) {
    return this.open().filter(t => t.teamId === teamId).length;
  }

  // Görev olan gün takvimde açılır, boş günde o tarihe yeni görev açılır
  openDay(key: string) {
    const hasTasks = this.week().find(d => d.key === key)?.tasks.length;
    if (hasTasks) this.router.navigate(['/calendar'], { queryParams: { date: key } });
    else this.ui.newTask({ dueDate: key });
  }
}
