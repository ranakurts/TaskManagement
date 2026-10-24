import { Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { UiService } from '../../services/ui.service';
import { UserStateService } from '../../services/user-state.service';
import { TASK_STATUSES, TaskComment, TaskStatus } from '../../models/task.model';
import { AvatarComponent, DueChipComponent, IconComponent, PriorityChipComponent } from '../ui/task-bits';

// Sağdan açılan görev detay paneli: durum, bilgiler, açıklama ve yorumlar
@Component({
  selector: 'tm-task-drawer',
  standalone: true,
  imports: [FormsModule, IconComponent, AvatarComponent, DueChipComponent, PriorityChipComponent],
  template: `
    <div class="tm-overlay" (click)="close()"></div>
    <aside class="drawer" role="dialog" aria-modal="true">
      @if (task(); as task) {
        <header class="drawer-head">
          <div class="crumbs">
            <span class="tm-chip">{{ task.teamName || lang.t('common.personal') }}</span>
            <span class="tm-muted">#{{ task.id }}</span>
          </div>
          <div class="tm-actions">
            <button class="tm-btn sm" (click)="edit()"><tm-icon name="edit" [size]="14" />{{ lang.t('common.edit') }}</button>
            @if (task.canDelete) {
              <button class="tm-btn sm danger icon" (click)="remove()" [attr.title]="lang.t('common.delete')"><tm-icon name="trash" [size]="14" /></button>
            }
            <button class="tm-btn ghost icon sm no-glow" (click)="close()" [attr.aria-label]="lang.t('common.close')"><tm-icon name="close" [size]="16" /></button>
          </div>
        </header>

        <div class="drawer-body">
          <div class="title-row">
            <button class="tm-check" [class.checked]="task.status === 'done'" (click)="toggleDone()" [attr.aria-label]="lang.t('status.done')">
              <tm-icon name="check" [size]="13" [stroke]="3" />
            </button>
            <h2 [class.tm-strike]="task.status === 'done'">{{ task.title }}</h2>
          </div>

          <div class="status-track">
            @for (s of statuses; track s) {
              <button class="step" [class]="'step st-' + s" [class.active]="task.status === s" (click)="setStatus(s)">
                <span class="tm-dot"></span>{{ lang.t('status.' + s) }}
              </button>
            }
          </div>

          <dl class="meta">
            <dt>{{ lang.t('modal.assignee') }}</dt>
            <dd><tm-avatar [name]="task.assignedUserName" size="xs" />{{ task.assignedUserName || lang.t('common.unassigned') }}</dd>
            <dt>{{ lang.t('modal.priority') }}</dt>
            <dd><tm-priority-chip [priority]="task.priority" /></dd>
            <dt>{{ lang.t('modal.dueDate') }}</dt>
            <dd>
              @if (task.dueDate) {
                <tm-due-chip [due]="task.dueDate" [status]="task.status" />
                <span class="tm-muted small">{{ lang.formatDate(task.dueDate, { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
              } @else { <span class="tm-muted">{{ lang.t('common.noDue') }}</span> }
            </dd>
            @if (task.startDate) {
              <dt>{{ lang.t('modal.startDate') }}</dt>
              <dd>{{ lang.formatDate(task.startDate, { day: 'numeric', month: 'long', year: 'numeric' }) }}</dd>
            }
            <dt>{{ lang.t('drawer.createdBy') }}</dt>
            <dd><tm-avatar [name]="task.createdByName" size="xs" />{{ task.createdByName }} <span class="tm-muted small">· {{ lang.timeAgo(task.createdAt) }}</span></dd>
            @if (task.completedAt) {
              <dt>{{ lang.t('drawer.completed') }}</dt>
              <dd>{{ lang.formatDate(task.completedAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) }}</dd>
            }
          </dl>

          <section class="section">
            <h3>{{ lang.t('modal.description') }}</h3>
            @if (task.description) {
              <p class="description">{{ task.description }}</p>
            } @else {
              <button class="empty-desc" (click)="edit()">{{ lang.t('drawer.noDescription') }}</button>
            }
          </section>

          <section class="section">
            <h3>{{ lang.t('drawer.comments') }} <span class="count">{{ comments().length }}</span></h3>
            <div class="comments">
              @if (loadingComments()) {
                <div class="tm-skeleton" style="height: 54px"></div>
              } @else {
                @for (c of comments(); track c.id) {
                  <div class="comment">
                    <tm-avatar [name]="c.userName" />
                    <div class="bubble">
                      <div class="comment-head">
                        <strong>{{ c.userName }}</strong>
                        <span class="tm-muted small">{{ lang.timeAgo(c.createdAt) }}</span>
                        @if (c.userId === meId()) {
                          <button class="del" (click)="deleteComment(c)" [attr.aria-label]="lang.t('common.delete')"><tm-icon name="trash" [size]="12" /></button>
                        }
                      </div>
                      <p>{{ c.content }}</p>
                    </div>
                  </div>
                } @empty {
                  <p class="tm-muted small no-comments">{{ lang.t('drawer.noComments') }}</p>
                }
              }
            </div>
          </section>
        </div>

        <footer class="composer">
          <tm-avatar [name]="meName()" />
          <textarea #commentBox [(ngModel)]="newComment" [placeholder]="lang.t('drawer.commentPh')" rows="1"
                    (keydown.enter)="onEnter($any($event))" maxlength="2000"></textarea>
          <button class="tm-btn primary sm" [disabled]="!newComment.trim() || sending()" (click)="sendComment()">{{ lang.t('drawer.send') }}</button>
        </footer>
      } @else {
        <header class="drawer-head">
          <span></span>
          <button class="tm-btn ghost icon sm no-glow" (click)="close()"><tm-icon name="close" [size]="16" /></button>
        </header>
        <div class="tm-empty"><div class="tm-empty-icon"><tm-icon name="inbox" [size]="24" /></div><strong>{{ lang.t('drawer.notFound') }}</strong></div>
      }
    </aside>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 2900; }
    .drawer {
      position: absolute; z-index: 1; top: 0; right: 0; bottom: 0; width: min(560px, 100vw);
      background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, white 4%), var(--surface));
      border-left: 1px solid var(--border); box-shadow: -30px 0 80px rgba(0,0,0,0.5);
      backdrop-filter: blur(30px); display: flex; flex-direction: column;
      animation: slide 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes slide { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
    .drawer-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--line); }
    .crumbs { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 12.5px; }
    .drawer-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 22px; }
    .title-row { display: flex; gap: 12px; align-items: flex-start; }
    .title-row .tm-check { margin-top: 5px; }
    h2 { font-size: 22px; font-weight: 800; line-height: 1.3; word-break: break-word; }
    .status-track { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 5px; border-radius: 14px; background: rgba(0,0,0,0.25); border: 1px solid var(--line); }
    .step { border: 0; background: transparent; color: var(--muted); height: 34px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0 6px; white-space: nowrap; }
    .step .tm-dot { color: var(--c); }
    .step.active { color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 40%, transparent); }
    .meta { display: grid; grid-template-columns: 130px 1fr; gap: 12px 14px; margin: 0; font-size: 13.5px; }
    dt { color: var(--muted); font-size: 12.5px; font-weight: 600; padding-top: 3px; }
    dd { margin: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .small { font-size: 12px; }
    .section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .count { background: var(--elev-2); border-radius: 999px; padding: 1px 8px; font-size: 11px; color: var(--text); }
    .description { margin: 0; white-space: pre-wrap; line-height: 1.65; color: var(--text-secondary); font-size: 14px; word-break: break-word; }
    .empty-desc { width: 100%; text-align: left; border: 1px dashed rgba(255,255,255,0.15); background: transparent; color: var(--muted); padding: 14px; border-radius: 12px; cursor: pointer; font-size: 13px; }
    .comments { display: flex; flex-direction: column; gap: 14px; }
    .comment { display: flex; gap: 10px; align-items: flex-start; }
    .bubble { flex: 1; min-width: 0; background: var(--elev); border: 1px solid var(--line); border-radius: 4px 14px 14px 14px; padding: 10px 12px; }
    .comment-head { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .bubble p { margin: 4px 0 0; font-size: 13.5px; white-space: pre-wrap; word-break: break-word; color: var(--text-secondary); }
    .del { margin-left: auto; border: 0; background: transparent; color: var(--muted); cursor: pointer; padding: 2px; border-radius: 6px; opacity: 0; transition: opacity 0.2s; }
    .comment:hover .del { opacity: 1; }
    .del:hover { color: #FCA5A5; }
    .no-comments { margin: 0; }
    .composer { display: flex; align-items: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--line); background: rgba(0,0,0,0.15); }
    .composer textarea { flex: 1; resize: none; min-height: 40px; max-height: 140px; border-radius: 12px; border: 1px solid var(--line); background: rgba(0,0,0,0.25); color: var(--text); padding: 10px 12px; font-size: 13.5px; outline: none; line-height: 1.4; }
    .composer textarea:focus { border-color: var(--primary); box-shadow: var(--ring); }
    .composer .tm-btn { height: 40px; }
    @media (max-width: 560px) {
      .meta { grid-template-columns: 110px 1fr; }
      .status-track { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class TaskDrawerComponent {
  lang = inject(LanguageService);
  private ui = inject(UiService);
  private store = inject(TaskStoreService);
  private userState = inject(UserStateService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('commentBox') commentBox?: ElementRef<HTMLTextAreaElement>;

  readonly statuses = TASK_STATUSES;

  task = computed(() => {
    const id = this.ui.drawerTaskId();
    return id === null ? undefined : this.store.tasks().find(t => t.id === id);
  });

  comments = signal<TaskComment[]>([]);
  loadingComments = signal(true);
  sending = signal(false);
  newComment = '';
  meId = signal<number | null>(null);
  meName = signal<string>('');

  constructor() {
    this.userState.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(u => {
      this.meId.set(u?.id ?? null);
      this.meName.set(u?.fullName ?? '');
    });

    // Farklı bir görev açılınca yorumlarını yükle
    effect(() => {
      const id = this.ui.drawerTaskId();
      if (id === null) return;
      untracked(() => this.loadComments(id));
    });
  }

  private loadComments(id: number) {
    this.loadingComments.set(true);
    this.comments.set([]);
    this.store.getComments(id).subscribe({
      next: list => {
        this.comments.set(list);
        this.loadingComments.set(false);
      },
      error: () => this.loadingComments.set(false)
    });
  }

  setStatus(status: TaskStatus) {
    const task = this.task();
    if (!task || task.status === status) return;
    this.store.setStatus(task.id, status).subscribe({
      next: () => {
        if (status === 'done') this.ui.toast(this.lang.t('toast.completed'));
      },
      error: (e: HttpErrorResponse) => this.ui.error(e.error?.message || this.lang.t('common.genericError'))
    });
  }

  toggleDone() {
    const task = this.task();
    if (task) this.setStatus(task.status === 'done' ? 'todo' : 'done');
  }

  edit() {
    const task = this.task();
    if (task) this.ui.editTask(task);
  }

  remove() {
    const task = this.task();
    if (!task || !confirm(this.lang.t('drawer.confirmDelete'))) return;
    this.store.delete(task.id).subscribe({
      next: () => {
        this.ui.closeDrawer();
        this.ui.toast(this.lang.t('toast.deleted'));
      },
      error: (e: HttpErrorResponse) => this.ui.error(e.error?.message || this.lang.t('common.genericError'))
    });
  }

  onEnter(e: KeyboardEvent) {
    if (e.shiftKey) return;
    e.preventDefault();
    this.sendComment();
  }

  sendComment() {
    const task = this.task();
    const content = this.newComment.trim();
    if (!task || !content || this.sending()) return;
    this.sending.set(true);
    this.store.addComment(task.id, content).subscribe({
      next: c => {
        this.comments.update(list => [...list, c]);
        this.newComment = '';
        this.sending.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.sending.set(false);
        this.ui.error(e.error?.message || this.lang.t('common.genericError'));
      }
    });
  }

  deleteComment(c: TaskComment) {
    const task = this.task();
    if (!task) return;
    this.store.deleteComment(task.id, c.id).subscribe({
      next: () => this.comments.update(list => list.filter(x => x.id !== c.id)),
      error: (e: HttpErrorResponse) => this.ui.error(e.error?.message || this.lang.t('common.genericError'))
    });
  }

  close() {
    this.ui.closeDrawer();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    // Düzenleme penceresi açıksa önce o kapanır
    if (!this.ui.taskModal()) this.close();
  }
}
