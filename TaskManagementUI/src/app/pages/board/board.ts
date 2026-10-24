import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { Team, TeamService } from '../../services/team.service';
import { UiService } from '../../services/ui.service';
import { UserStateService } from '../../services/user-state.service';
import { PRIORITY_WEIGHT, TASK_STATUSES, TaskItem, TaskStatus, todayKey } from '../../models/task.model';
import { TaskCardComponent } from '../../components/task-card/task-card';
import { IconComponent } from '../../components/ui/task-bits';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [FormsModule, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, TaskCardComponent, IconComponent],
  template: `
    <div class="tm-page wide">
      <header class="tm-page-head">
        <div>
          <h1 class="tm-title">{{ lang.t('board.title') }}</h1>
          <p class="tm-subtitle">{{ lang.t('board.subtitle') }}</p>
        </div>
        <div class="tm-actions">
          <div class="tm-search">
            <tm-icon name="search" [size]="16" />
            <input class="tm-input" [ngModel]="query()" (ngModelChange)="query.set($event)" [placeholder]="lang.t('common.search') + '…'" />
          </div>
          <select class="tm-select team-select" [ngModel]="teamId()" (ngModelChange)="teamId.set($event)">
            <option [ngValue]="undefined">{{ lang.t('tasks.allTeams') }}</option>
            <option [ngValue]="null">{{ lang.t('common.personal') }}</option>
            @for (t of teams(); track t.id) { <option [ngValue]="t.id">{{ t.name }}</option> }
          </select>
          <div class="tm-seg">
            <button [class.active]="!onlyMine()" (click)="onlyMine.set(false)">{{ lang.t('tasks.scope.all') }}</button>
            <button [class.active]="onlyMine()" (click)="onlyMine.set(true)">{{ lang.t('tasks.scope.mine') }}</button>
          </div>
          <button class="tm-btn primary" (click)="ui.newTask(defaults('todo'))"><tm-icon name="plus" [size]="16" />{{ lang.t('nav.newTask') }}</button>
        </div>
      </header>

      <div class="board" cdkDropListGroup>
        @for (col of columns(); track col.status) {
          <section class="column" [class]="'column st-' + col.status">
            <header class="col-head">
              <span class="tm-dot" style="color: var(--c)"></span>
              <h3>{{ lang.t('status.' + col.status) }}</h3>
              <span class="count">{{ col.tasks.length }}</span>
              <button class="tm-btn ghost icon sm no-glow add" (click)="ui.newTask(defaults(col.status))" [attr.aria-label]="lang.t('nav.newTask')"><tm-icon name="plus" [size]="15" /></button>
            </header>

            <div class="drop" cdkDropList [cdkDropListData]="col.status" (cdkDropListDropped)="drop($event)">
              @if (!store.loaded()) {
                @for (i of [1,2]; track i) { <div class="tm-skeleton" style="height: 96px"></div> }
              }
              @for (task of col.tasks; track task.id) {
                <tm-task-card cdkDrag [cdkDragData]="task" [task]="task">
                  <div class="placeholder" *cdkDragPlaceholder></div>
                </tm-task-card>
              } @empty {
                @if (store.loaded()) { <div class="empty-col">{{ lang.t('board.drop') }}</div> }
              }
            </div>

            @if (quickAddFor() === col.status) {
              <input class="tm-input quick" autofocus [(ngModel)]="quickTitle" [placeholder]="lang.t('board.quickAddPh')"
                     (keydown.enter)="quickAdd(col.status)" (keydown.escape)="quickAddFor.set(null)" (blur)="quickTitle.trim() ? null : quickAddFor.set(null)" />
            } @else {
              <button class="quick-btn no-glow" (click)="quickAddFor.set(col.status); quickTitle = ''">{{ lang.t('board.quickAdd') }}</button>
            }
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    .tm-page.wide { max-width: 1600px; }
    .team-select { width: auto; min-width: 160px; }
    .board { display: grid; grid-template-columns: repeat(4, minmax(260px, 1fr)); gap: 16px; align-items: start; overflow-x: auto; padding-bottom: 8px; }
    .column {
      display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 18px; min-height: 420px;
      background: linear-gradient(180deg, color-mix(in srgb, var(--c) 9%, transparent), transparent 140px), var(--card);
      border: 1px solid var(--line); backdrop-filter: blur(20px);
    }
    .col-head { display: flex; align-items: center; gap: 8px; padding: 4px 4px 6px; }
    .col-head h3 { font-size: 13.5px; font-weight: 700; }
    .count { font-size: 12px; color: var(--muted); background: var(--elev-2); padding: 1px 8px; border-radius: 999px; }
    .add { margin-left: auto; }
    .drop { display: flex; flex-direction: column; gap: 10px; min-height: 80px; flex: 1; border-radius: 12px; transition: background 0.2s; }
    .drop.cdk-drop-list-receiving, .drop.cdk-drop-list-dragging { background: color-mix(in srgb, var(--c) 8%, transparent); }
    .empty-col { display: flex; align-items: center; justify-content: center; height: 80px; border: 1.5px dashed rgba(255,255,255,0.12); border-radius: 12px; color: var(--muted); font-size: 12.5px; }
    .placeholder { height: 90px; border-radius: 14px; border: 2px dashed color-mix(in srgb, var(--c) 60%, transparent); background: color-mix(in srgb, var(--c) 8%, transparent); }
    .quick-btn { border: 0; background: transparent; color: var(--muted); font-size: 13px; font-weight: 600; text-align: left; padding: 8px 6px; border-radius: 10px; cursor: pointer; }
    .quick-btn:hover { background: var(--elev-2); color: var(--text); }
    .quick { height: 40px; }
    .cdk-drag-animating { transition: transform 220ms cubic-bezier(0, 0, 0.2, 1); }
    .drop.cdk-drop-list-dragging tm-task-card:not(.cdk-drag-placeholder) { transition: transform 220ms cubic-bezier(0, 0, 0.2, 1); }
    @media (max-width: 1100px) { .board { grid-template-columns: repeat(4, 280px); } }
    @media (max-width: 720px) { .tm-actions { width: 100%; } .team-select { flex: 1; } }
  `]
})
export class BoardComponent implements OnInit {
  lang = inject(LanguageService);
  ui = inject(UiService);
  store = inject(TaskStoreService);
  private teamService = inject(TeamService);
  private userState = inject(UserStateService);

  me = toSignal(this.userState.currentUser$, { initialValue: null });
  teams = signal<Team[]>([]);
  query = signal('');
  teamId = signal<number | null | undefined>(undefined);
  onlyMine = signal(false);
  quickAddFor = signal<TaskStatus | null>(null);
  quickTitle = '';

  private visible = computed(() => {
    const q = this.query().trim().toLocaleLowerCase(this.lang.locale);
    const me = this.me()?.id;
    return this.store.tasks().filter(t =>
      (this.teamId() === undefined || t.teamId === this.teamId()) &&
      (!this.onlyMine() || t.assignedUserId === me) &&
      (!q || t.title.toLocaleLowerCase(this.lang.locale).includes(q)));
  });

  // Sütun içinde önce öncelik, sonra bitiş tarihi
  columns = computed(() => TASK_STATUSES.map(status => ({
    status,
    tasks: this.visible()
      .filter(t => t.status === status)
      .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || (a.dueDate || '9').localeCompare(b.dueDate || '9'))
  })));

  ngOnInit() {
    this.store.load();
    this.teamService.getMyTeams().subscribe({ next: t => this.teams.set(t), error: () => {} });
  }

  defaults(status: TaskStatus) {
    const team = this.teamId();
    return typeof team === 'number' ? { status, teamId: team, assignedUserId: null } : { status };
  }

  drop(event: CdkDragDrop<TaskStatus, TaskStatus, TaskItem>) {
    const task = event.item.data;
    const status = event.container.data;
    if (task.status === status) return;
    this.store.setStatus(task.id, status).subscribe({
      next: () => this.ui.toast(status === 'done'
        ? this.lang.t('toast.completed')
        : this.lang.t('toast.moved', { title: task.title, status: this.lang.t('status.' + status) }), status === 'done' ? 'success' : 'info'),
      error: (e: HttpErrorResponse) => this.ui.error(e.error?.message || this.lang.t('common.genericError'))
    });
  }

  quickAdd(status: TaskStatus) {
    const title = this.quickTitle.trim();
    if (!title) return;
    const team = this.teamId();
    this.store.create({
      title,
      status,
      priority: 'medium',
      dueDate: todayKey(),
      teamId: typeof team === 'number' ? team : null,
      assignedUserId: typeof team === 'number' ? null : this.me()?.id ?? null
    }).subscribe({
      next: () => {
        this.quickTitle = '';
        this.ui.toast(this.lang.t('toast.created'));
      },
      error: (e: HttpErrorResponse) => this.ui.error(e.error?.message || this.lang.t('common.genericError'))
    });
  }
}
