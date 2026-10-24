import { Component, inject, input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { UiService } from '../../services/ui.service';
import { TaskItem } from '../../models/task.model';
import { AvatarComponent, DueChipComponent, IconComponent, PriorityChipComponent, StatusChipComponent } from '../ui/task-bits';

// Liste görünümündeki tek görev satırı (Görevler sayfası, ana sayfa)
@Component({
  selector: 'tm-task-row',
  standalone: true,
  imports: [IconComponent, AvatarComponent, DueChipComponent, PriorityChipComponent, StatusChipComponent],
  template: `
    @let t = task();
    <div class="row" [class.done]="t.status === 'done'" [class.compact]="compact()" (click)="ui.openTask(t.id)" tabindex="0" (keydown.enter)="ui.openTask(t.id)">
      <span class="prio-bar" [class]="'prio-bar pr-' + t.priority"></span>
      <button class="tm-check no-glow" [class.checked]="t.status === 'done'" (click)="toggle($event)" [attr.aria-label]="lang.t('status.done')">
        <tm-icon name="check" [size]="13" [stroke]="3" />
      </button>
      <div class="main">
        <div class="title tm-ellipsis" [class.tm-strike]="t.status === 'done'">{{ t.title }}</div>
        @if (!compact()) {
          <div class="sub">
            <span class="team">{{ t.teamName || lang.t('common.personal') }}</span>
            @if (t.description) { <span class="desc tm-ellipsis">· {{ t.description }}</span> }
          </div>
        }
      </div>
      <div class="chips">
        @if (!compact()) { <tm-status-chip [status]="t.status" /> }
        <tm-priority-chip [priority]="t.priority" [compact]="compact()" />
        <tm-due-chip [due]="t.dueDate" [status]="t.status" />
        @if (t.commentCount && !compact()) {
          <span class="comments"><tm-icon name="comment" [size]="13" />{{ t.commentCount }}</span>
        }
        <tm-avatar [name]="t.assignedUserName" size="xs" [emptyTitle]="lang.t('common.unassigned')" />
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .row {
      position: relative; display: flex; align-items: center; gap: 14px; padding: 12px 14px 12px 18px; border-radius: 14px;
      background: var(--elev); border: 1px solid var(--line); cursor: pointer; outline: none;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }
    .row:hover, .row:focus-visible { background: var(--elev-2); border-color: var(--hover-color); box-shadow: 0 0 0 1px color-mix(in srgb, var(--hover-color) 55%, transparent), 0 0 26px color-mix(in srgb, var(--hover-color) 40%, transparent); }
    .row.compact { padding: 10px 12px 10px 16px; gap: 12px; }
    .prio-bar { position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px; border-radius: 0 3px 3px 0; background: var(--c); opacity: 0.85; }
    .main { flex: 1; min-width: 0; }
    .title { font-weight: 600; font-size: 14px; }
    .sub { display: flex; gap: 4px; font-size: 12px; color: var(--muted); margin-top: 2px; min-width: 0; }
    .team { flex-shrink: 0; }
    .desc { opacity: 0.8; }
    .chips { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .comments { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--muted); }
    .done { opacity: 0.72; }
    @media (max-width: 760px) {
      .row { flex-wrap: wrap; }
      .chips { width: 100%; padding-left: 36px; flex-wrap: wrap; }
      tm-status-chip { display: none; }
    }
  `]
})
export class TaskRowComponent {
  lang = inject(LanguageService);
  ui = inject(UiService);
  private store = inject(TaskStoreService);

  task = input.required<TaskItem>();
  compact = input(false);

  toggle(e: Event) {
    e.stopPropagation();
    const t = this.task();
    const next = t.status === 'done' ? 'todo' : 'done';
    this.store.setStatus(t.id, next).subscribe({
      next: () => this.ui.toast(this.lang.t(next === 'done' ? 'toast.completed' : 'toast.reopened'), next === 'done' ? 'success' : 'info'),
      error: (err: HttpErrorResponse) => this.ui.error(err.error?.message || this.lang.t('common.genericError'))
    });
  }
}
