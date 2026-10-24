import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { Team, TeamService } from '../../services/team.service';
import { UiService } from '../../services/ui.service';
import { UserStateService } from '../../services/user-state.service';
import { PRIORITY_WEIGHT, TASK_PRIORITIES, TASK_STATUSES, TaskItem, TaskPriority, TaskStatus, daysUntil, dueState } from '../../models/task.model';
import { TaskRowComponent } from '../../components/task-row/task-row';
import { IconComponent } from '../../components/ui/task-bits';

type Scope = 'all' | 'mine' | 'created' | 'overdue';
type Sort = 'due' | 'priority' | 'newest' | 'title';

const PREFS_KEY = 'tm_tasks_prefs';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [FormsModule, TaskRowComponent, IconComponent],
  template: `
    <div class="tm-page">
      <header class="tm-page-head">
        <div>
          <div class="tm-eyebrow">{{ lang.t('tasks.count', { n: filtered().length }) }}</div>
          <h1 class="tm-title">{{ lang.t('tasks.title') }}</h1>
          <p class="tm-subtitle">{{ lang.t('tasks.subtitle') }}</p>
        </div>
        <div class="tm-actions">
          <button class="tm-btn primary" (click)="ui.newTask(newTaskDefaults())"><tm-icon name="plus" [size]="16" />{{ lang.t('nav.newTask') }}</button>
        </div>
      </header>

      <section class="toolbar tm-card">
        <div class="row">
          <div class="tm-search">
            <tm-icon name="search" [size]="16" />
            <input class="tm-input" [ngModel]="query()" (ngModelChange)="query.set($event)" [placeholder]="lang.t('common.search') + '…'" />
          </div>
          <div class="tm-seg scope">
            @for (s of scopes; track s) {
              <button [class.active]="scope() === s" (click)="setScope(s)">
                {{ lang.t('tasks.scope.' + s) }}
                <span class="badge">{{ scopeCount(s) }}</span>
              </button>
            }
          </div>
        </div>
        <div class="row filters">
          <select class="tm-select" [ngModel]="status()" (ngModelChange)="status.set($event); save()">
            <option [ngValue]="null">{{ lang.t('tasks.allStatus') }}</option>
            @for (s of statuses; track s) { <option [ngValue]="s">{{ lang.t('status.' + s) }}</option> }
          </select>
          <select class="tm-select" [ngModel]="priority()" (ngModelChange)="priority.set($event); save()">
            <option [ngValue]="null">{{ lang.t('tasks.allPriority') }}</option>
            @for (p of priorities; track p) { <option [ngValue]="p">{{ lang.t('priority.' + p) }}</option> }
          </select>
          <select class="tm-select" [ngModel]="teamId()" (ngModelChange)="teamId.set($event); save()">
            <option [ngValue]="undefined">{{ lang.t('tasks.allTeams') }}</option>
            <option [ngValue]="null">{{ lang.t('common.personal') }}</option>
            @for (t of teams(); track t.id) { <option [ngValue]="t.id">{{ t.name }}</option> }
          </select>
          <select class="tm-select" [ngModel]="sort()" (ngModelChange)="sort.set($event); save()">
            @for (s of sorts; track s) { <option [ngValue]="s">{{ lang.t('tasks.sort.' + s) }}</option> }
          </select>
          <label class="toggle">
            <input type="checkbox" [ngModel]="showDone()" (ngModelChange)="showDone.set($event); save()" />
            <span class="switch"></span>{{ lang.t('tasks.showDone') }}
          </label>
          @if (hasFilters()) {
            <button class="tm-btn ghost sm" (click)="clear()"><tm-icon name="close" [size]="14" />{{ lang.t('tasks.clearFilters') }}</button>
          }
        </div>
      </section>

      @if (!store.loaded()) {
        <div class="groups">
          @for (i of [1,2,3,4,5]; track i) { <div class="tm-skeleton" style="height: 62px"></div> }
        </div>
      } @else if (store.tasks().length === 0) {
        <div class="tm-card">
          <div class="tm-empty">
            <div class="tm-empty-icon"><tm-icon name="tasks" [size]="26" /></div>
            <strong>{{ lang.t('tasks.emptyTitle') }}</strong>
            <span>{{ lang.t('tasks.emptyText') }}</span>
            <button class="tm-btn primary sm" (click)="ui.newTask()"><tm-icon name="plus" [size]="14" />{{ lang.t('nav.newTask') }}</button>
          </div>
        </div>
      } @else if (filtered().length === 0) {
        <div class="tm-card">
          <div class="tm-empty">
            <div class="tm-empty-icon"><tm-icon name="filter" [size]="24" /></div>
            <strong>{{ lang.t('tasks.emptyFiltered') }}</strong>
            <span>{{ lang.t('tasks.emptyFilteredText') }}</span>
            <button class="tm-btn sm" (click)="clear()">{{ lang.t('tasks.clearFilters') }}</button>
          </div>
        </div>
      } @else {
        <div class="groups">
          @for (group of groups(); track group.status) {
            <section class="group">
              <button class="group-head no-glow" [class]="'group-head no-glow st-' + group.status" (click)="toggleGroup(group.status)">
                <tm-icon name="chevronRight" [size]="14" class="chev" [class.open]="!collapsed().has(group.status)" />
                <span class="tm-dot" style="color: var(--c)"></span>
                <span class="group-title">{{ lang.t('status.' + group.status) }}</span>
                <span class="group-count">{{ group.tasks.length }}</span>
              </button>
              @if (!collapsed().has(group.status)) {
                <div class="group-list">
                  @for (task of group.tasks; track task.id) {
                    <tm-task-row [task]="task" />
                  }
                </div>
              }
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .toolbar { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
    .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .filters .tm-select { width: auto; min-width: 150px; height: 38px; font-size: 13px; }
    .scope .badge { font-size: 11px; padding: 0 6px; border-radius: 999px; background: rgba(255,255,255,0.08); color: var(--muted); min-width: 20px; text-align: center; }
    .scope button.active .badge { background: color-mix(in srgb, var(--primary) 35%, transparent); color: #fff; }
    .toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); cursor: pointer; user-select: none; }
    .toggle input { display: none; }
    .switch { width: 34px; height: 20px; border-radius: 999px; background: rgba(255,255,255,0.12); position: relative; transition: background 0.2s; }
    .switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
    .toggle input:checked + .switch { background: var(--primary); }
    .toggle input:checked + .switch::after { transform: translateX(14px); }
    .groups { display: flex; flex-direction: column; gap: 18px; }
    .group { display: flex; flex-direction: column; gap: 8px; }
    .group-head { display: inline-flex; align-items: center; gap: 10px; border: 0; background: transparent; color: var(--text); cursor: pointer; padding: 4px 2px; align-self: flex-start; font-size: 14px; }
    .chev { color: var(--muted); transition: transform 0.2s; }
    .chev.open { transform: rotate(90deg); }
    .group-title { font-weight: 700; }
    .group-count { font-size: 12px; color: var(--muted); background: var(--elev-2); border-radius: 999px; padding: 1px 9px; }
    .group-list { display: flex; flex-direction: column; gap: 8px; }
    @media (max-width: 720px) {
      .filters .tm-select { flex: 1 1 45%; min-width: 0; }
      .scope { width: 100%; }
      .scope button { flex: 1; justify-content: center; }
    }
  `]
})
export class TasksComponent implements OnInit {
  lang = inject(LanguageService);
  ui = inject(UiService);
  store = inject(TaskStoreService);
  private teamService = inject(TeamService);
  private userState = inject(UserStateService);

  readonly statuses = TASK_STATUSES;
  readonly priorities = TASK_PRIORITIES;
  readonly scopes: Scope[] = ['all', 'mine', 'created', 'overdue'];
  readonly sorts: Sort[] = ['due', 'priority', 'newest', 'title'];

  me = toSignal(this.userState.currentUser$, { initialValue: null });
  teams = signal<Team[]>([]);

  query = signal('');
  scope = signal<Scope>('all');
  status = signal<TaskStatus | null>(null);
  priority = signal<TaskPriority | null>(null);
  teamId = signal<number | null | undefined>(undefined);
  sort = signal<Sort>('due');
  showDone = signal(true);
  collapsed = signal(new Set<TaskStatus>());

  constructor() {
    // Kullanıcının son filtre tercihleri hatırlanır
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      if (p.scope) this.scope.set(p.scope);
      if (p.sort) this.sort.set(p.sort);
      if (typeof p.showDone === 'boolean') this.showDone.set(p.showDone);
    } catch { /* yok say */ }
  }

  ngOnInit() {
    this.store.load();
    this.teamService.getMyTeams().subscribe({ next: t => this.teams.set(t), error: () => {} });
  }

  private matchesScope(t: TaskItem, scope: Scope): boolean {
    const id = this.me()?.id;
    switch (scope) {
      case 'mine': return t.assignedUserId === id;
      case 'created': return t.createdById === id;
      case 'overdue': return dueState(t) === 'overdue';
      default: return true;
    }
  }

  scopeCount(scope: Scope) {
    return this.store.tasks().filter(t => this.matchesScope(t, scope) && (scope === 'overdue' || t.status !== 'done')).length;
  }

  filtered = computed(() => {
    const q = this.query().trim().toLocaleLowerCase(this.lang.locale);
    const list = this.store.tasks().filter(t =>
      this.matchesScope(t, this.scope()) &&
      (this.showDone() || t.status !== 'done') &&
      (this.status() === null || t.status === this.status()) &&
      (this.priority() === null || t.priority === this.priority()) &&
      (this.teamId() === undefined || t.teamId === this.teamId()) &&
      (!q || t.title.toLocaleLowerCase(this.lang.locale).includes(q) || t.description.toLocaleLowerCase(this.lang.locale).includes(q) ||
        (t.assignedUserName || '').toLocaleLowerCase(this.lang.locale).includes(q))
    );

    const sorters: Record<Sort, (a: TaskItem, b: TaskItem) => number> = {
      due: (a, b) => (a.dueDate ? daysUntil(a.dueDate) : 99999) - (b.dueDate ? daysUntil(b.dueDate) : 99999) || PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority],
      priority: (a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || (a.dueDate || '9').localeCompare(b.dueDate || '9'),
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      title: (a, b) => a.title.localeCompare(b.title, this.lang.locale)
    };
    return [...list].sort(sorters[this.sort()]);
  });

  groups = computed(() => TASK_STATUSES
    .map(status => ({ status, tasks: this.filtered().filter(t => t.status === status) }))
    .filter(g => g.tasks.length));

  hasFilters = computed(() => !!this.query() || this.scope() !== 'all' || this.status() !== null || this.priority() !== null || this.teamId() !== undefined);

  // Bir takım filtresi seçiliyse yeni görev o takımda açılır
  newTaskDefaults() {
    const team = this.teamId();
    return typeof team === 'number' ? { teamId: team, assignedUserId: null } : undefined;
  }

  setScope(scope: Scope) {
    this.scope.set(scope);
    this.save();
  }

  toggleGroup(status: TaskStatus) {
    const next = new Set(this.collapsed());
    next.has(status) ? next.delete(status) : next.add(status);
    this.collapsed.set(next);
  }

  clear() {
    this.query.set('');
    this.scope.set('all');
    this.status.set(null);
    this.priority.set(null);
    this.teamId.set(undefined);
    this.save();
  }

  save() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ scope: this.scope(), sort: this.sort(), showDone: this.showDone() }));
    } catch { /* yok say */ }
  }
}
