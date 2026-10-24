import { AfterViewInit, Component, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { Team, TeamMemberInfo, TeamService } from '../../services/team.service';
import { UiService } from '../../services/ui.service';
import { UserStateService } from '../../services/user-state.service';
import { SaveTaskRequest, TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus, todayKey } from '../../models/task.model';
import { AvatarComponent, IconComponent } from '../ui/task-bits';

// Yeni görev oluşturma ve düzenleme penceresi (UiService.taskModal ile açılır)
@Component({
  selector: 'tm-task-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, AvatarComponent],
  template: `
    <div class="tm-overlay" (click)="close()"></div>
    <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="heading()">
      <header class="modal-head">
        <div class="head-title">
          <span class="head-icon"><tm-icon [name]="isEdit() ? 'edit' : 'sparkle'" [size]="18" /></span>
          <h2>{{ heading() }}</h2>
        </div>
        <button class="tm-btn ghost icon sm no-glow" (click)="close()" [attr.aria-label]="lang.t('common.close')"><tm-icon name="close" [size]="16" /></button>
      </header>

      <form class="modal-body" (ngSubmit)="save()">
        <input #titleInput class="title-input" name="title" [(ngModel)]="title" [placeholder]="lang.t('modal.titlePh')" maxlength="200" autocomplete="off" />

        <textarea class="tm-textarea" name="description" [(ngModel)]="description" [placeholder]="lang.t('modal.descriptionPh')" rows="3" maxlength="4000"></textarea>

        <div class="tm-field">
          <span class="tm-label">{{ lang.t('modal.status') }}</span>
          <div class="tm-seg">
            @for (s of statuses; track s) {
              <button type="button" [class.active]="status() === s" (click)="status.set(s)">
                <span class="tm-dot" [class]="'tm-dot st-' + s" [style.color]="'var(--c)'"></span>{{ lang.t('status.' + s) }}
              </button>
            }
          </div>
        </div>

        <div class="tm-field">
          <span class="tm-label">{{ lang.t('modal.priority') }}</span>
          <div class="tm-seg">
            @for (p of priorities; track p) {
              <button type="button" [class.active]="priority() === p" (click)="priority.set(p)">
                <span class="tm-dot" [class]="'tm-dot pr-' + p" [style.color]="'var(--c)'"></span>{{ lang.t('priority.' + p) }}
              </button>
            }
          </div>
        </div>

        <div class="grid-2">
          <label class="tm-field">
            <span class="tm-label">{{ lang.t('modal.startDate') }}</span>
            <input class="tm-input" type="date" name="startDate" [(ngModel)]="startDate" [max]="dueDate || null" />
          </label>
          <label class="tm-field">
            <span class="tm-label">{{ lang.t('modal.dueDate') }} <span class="req">*</span></span>
            <input class="tm-input" type="date" name="dueDate" [(ngModel)]="dueDate" [min]="startDate || null" required [class.invalid]="dueMissing() && !dueDate" />
          </label>
        </div>

        <div class="grid-2">
          <label class="tm-field">
            <span class="tm-label">{{ lang.t('modal.team') }}</span>
            <select class="tm-select" name="team" [ngModel]="teamId()" (ngModelChange)="onTeamChange($event)">
              <option [ngValue]="null">{{ lang.t('common.personal') }}</option>
              @for (team of teams(); track team.id) {
                <option [ngValue]="team.id">{{ team.name }}</option>
              }
            </select>
          </label>
          <label class="tm-field">
            <span class="tm-label">{{ lang.t('modal.assignee') }}</span>
            <div class="assignee">
              <tm-avatar [name]="assigneeName()" size="xs" />
              <select class="tm-select" name="assignee" [ngModel]="assignedUserId()" (ngModelChange)="assignedUserId.set($event)">
                <option [ngValue]="null">{{ lang.t('common.unassigned') }}</option>
                @for (m of assigneeOptions(); track m.userId) {
                  <option [ngValue]="m.userId">{{ m.fullName }}{{ m.userId === meId() ? ' (' + lang.t('common.me') + ')' : '' }}</option>
                }
              </select>
            </div>
          </label>
        </div>
        @if (teamId() === null) {
          <p class="hint">{{ lang.t('modal.personalHint') }}</p>
        }

        @if (error()) {
          <div class="error" role="alert">{{ error() }}</div>
        }

        <footer class="modal-foot">
          <span class="shortcut"><span class="tm-kbd">Ctrl</span> <span class="tm-kbd">Enter</span> {{ lang.t('modal.shortcut') }}</span>
          <div class="tm-actions">
            <button type="button" class="tm-btn ghost" (click)="close()">{{ lang.t('common.cancel') }}</button>
            <button type="submit" class="tm-btn primary" [disabled]="saving()">
              <tm-icon name="check" [size]="16" />{{ isEdit() ? lang.t('common.save') : lang.t('common.create') }}
            </button>
          </div>
        </footer>
      </form>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 3000; display: flex; align-items: flex-start; justify-content: center; padding: 8vh 16px 16px; overflow-y: auto; }
    .tm-overlay { position: fixed; }
    .modal {
      position: relative; z-index: 1; width: 100%; max-width: 620px; border-radius: 22px;
      background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, white 4%), var(--surface));
      border: 1px solid var(--border); box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset;
      backdrop-filter: blur(30px); animation: pop 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes pop { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: none; } }
    .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 6px; }
    .head-title { display: flex; align-items: center; gap: 10px; }
    .head-icon { width: 34px; height: 34px; border-radius: 11px; display: flex; align-items: center; justify-content: center; color: var(--accent); background: color-mix(in srgb, var(--primary) 18%, transparent); }
    h2 { font-size: 17px; font-weight: 700; }
    .modal-body { padding: 10px 20px 18px; display: flex; flex-direction: column; gap: 16px; }
    .title-input { width: 100%; border: none; outline: none; background: transparent; color: var(--text); font-size: 22px; font-weight: 700; letter-spacing: -0.02em; padding: 6px 0; border-bottom: 1px solid var(--line); border-radius: 0; }
    .title-input:focus { border-bottom-color: var(--primary); box-shadow: none; }
    .title-input::placeholder { color: color-mix(in srgb, var(--muted) 65%, transparent); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .assignee { position: relative; display: flex; align-items: center; }
    .assignee tm-avatar { position: absolute; left: 10px; pointer-events: none; z-index: 1; }
    .assignee .tm-select { padding-left: 40px; }
    .hint { margin: -6px 0 0; font-size: 12px; color: var(--muted); }
    .req { color: #F472B6; }
    .tm-input.invalid { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.25); }
    .error { padding: 10px 12px; border-radius: 12px; font-size: 13px; color: #FCA5A5; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); }
    .modal-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 6px; border-top: 1px solid var(--line); margin-top: 2px; padding-top: 16px; flex-wrap: wrap; }
    .shortcut { font-size: 12px; color: var(--muted); display: inline-flex; align-items: center; gap: 4px; }
    .tm-seg { width: 100%; }
    .tm-seg button { flex: 1; justify-content: center; }
    @media (max-width: 560px) {
      :host { padding: 0; align-items: flex-end; }
      .modal { border-radius: 22px 22px 0 0; max-height: 92vh; overflow-y: auto; }
      .grid-2 { grid-template-columns: 1fr; }
      .shortcut { display: none; }
      .tm-seg button { flex: 1 1 45%; }
    }
  `]
})
export class TaskModalComponent implements OnInit, AfterViewInit {
  lang = inject(LanguageService);
  private ui = inject(UiService);
  private store = inject(TaskStoreService);
  private teamService = inject(TeamService);
  private userState = inject(UserStateService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;

  readonly statuses = TASK_STATUSES;
  readonly priorities = TASK_PRIORITIES;

  private state = this.ui.taskModal()!;
  isEdit = signal(!!this.state.task);
  heading = computed(() => this.lang.t(this.isEdit() ? 'modal.editTitle' : 'modal.newTitle'));

  title = '';
  description = '';
  startDate = '';
  dueDate = '';
  status = signal<TaskStatus>('todo');
  priority = signal<TaskPriority>('medium');
  teamId = signal<number | null>(null);
  assignedUserId = signal<number | null>(null);

  teams = signal<Team[]>([]);
  members = signal<TeamMemberInfo[]>([]);
  meId = signal<number | null>(null);
  meName = signal<string>('');
  saving = signal(false);
  error = signal<string | null>(null);
  dueMissing = signal(false);

  // Takım seçiliyse üyeler, değilse sadece kişinin kendisi
  assigneeOptions = computed(() => {
    if (this.teamId() !== null) return this.members();
    const id = this.meId();
    return id ? [{ userId: id, fullName: this.meName(), username: '', email: '', role: 'Admin', joinedAt: '' } as TeamMemberInfo] : [];
  });

  assigneeName = computed(() => this.assigneeOptions().find(m => m.userId === this.assignedUserId())?.fullName ?? null);

  ngOnInit() {
    const task = this.state.task;
    const d = this.state.defaults ?? {};
    this.title = task?.title ?? d.title ?? '';
    this.description = task?.description ?? d.description ?? '';
    this.startDate = task?.startDate ?? d.startDate ?? '';
    // Her görevin takvimde görünmesi için bitiş tarihi zorunlu; yeni görevde bugün ile başlar
    this.dueDate = task?.dueDate ?? d.dueDate ?? todayKey();
    this.status.set(task?.status ?? d.status ?? 'todo');
    this.priority.set(task?.priority ?? d.priority ?? 'medium');
    this.teamId.set(task?.teamId ?? d.teamId ?? null);
    this.assignedUserId.set(task?.assignedUserId ?? d.assignedUserId ?? null);

    this.userState.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(u => {
      this.meId.set(u?.id ?? null);
      this.meName.set(u?.fullName ?? '');
      // Yeni kişisel görev varsayılan olarak kişinin kendisine atanır
      if (!task && d.assignedUserId === undefined && this.teamId() === null && u) this.assignedUserId.set(u.id);
    });

    this.teamService.getMyTeams().subscribe(teams => this.teams.set(teams));
    if (this.teamId() !== null) this.loadMembers(this.teamId()!);
  }

  ngAfterViewInit() {
    setTimeout(() => this.titleInput?.nativeElement.focus(), 30);
  }

  onTeamChange(teamId: number | null) {
    this.teamId.set(teamId);
    this.members.set([]);
    if (teamId === null) {
      this.assignedUserId.set(this.meId());
    } else {
      this.loadMembers(teamId);
    }
  }

  private loadMembers(teamId: number) {
    this.teamService.getMembers(teamId).subscribe(members => {
      this.members.set(members);
      if (this.assignedUserId() !== null && !members.some(m => m.userId === this.assignedUserId())) {
        this.assignedUserId.set(null);
      }
    });
  }

  save() {
    if (this.saving()) return;
    const title = this.title.trim();
    if (!title) {
      this.error.set(this.lang.t('modal.titleRequired'));
      this.titleInput?.nativeElement.focus();
      return;
    }
    if (!this.dueDate) {
      this.dueMissing.set(true);
      this.error.set(this.lang.t('modal.dueRequired'));
      return;
    }

    const request: SaveTaskRequest = {
      title,
      description: this.description.trim(),
      status: this.status(),
      priority: this.priority(),
      startDate: this.startDate || null,
      dueDate: this.dueDate || null,
      teamId: this.teamId(),
      assignedUserId: this.assignedUserId()
    };

    this.saving.set(true);
    this.error.set(null);
    const task = this.state.task;
    const call = task ? this.store.update(task.id, request) : this.store.create(request);
    call.subscribe({
      next: saved => {
        this.saving.set(false);
        this.ui.closeTaskModal();
        this.ui.toast(this.lang.t(task ? 'toast.updated' : 'toast.created'), 'success',
          task ? undefined : { label: this.lang.t('palette.open'), run: () => this.ui.openTask(saved.id) });
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(err.status === 0 ? this.lang.t('common.serverDown') : err.error?.message || this.lang.t('common.genericError'));
      }
    });
  }

  close() {
    this.ui.closeTaskModal();
  }

  // Odak pencere içindeyken çalışır; olay belgeye ulaşmadan durdurulur (alttaki çekmece kapanmasın)
  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.close();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.save();
    }
  }
}
