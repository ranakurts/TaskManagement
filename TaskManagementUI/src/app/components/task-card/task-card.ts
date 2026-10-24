import { Component, inject, input } from '@angular/core';
import { LanguageService } from '../../services/language.service';
import { UiService } from '../../services/ui.service';
import { TaskItem } from '../../models/task.model';
import { AvatarComponent, DueChipComponent, IconComponent, PriorityChipComponent } from '../ui/task-bits';

// Panodaki sürüklenebilir görev kartı
@Component({
  selector: 'tm-task-card',
  standalone: true,
  imports: [IconComponent, AvatarComponent, DueChipComponent, PriorityChipComponent],
  template: `
    @let t = task();
    <article class="card" [class]="'card pr-' + t.priority" [class.done]="t.status === 'done'" (click)="ui.openTask(t.id)" tabindex="0" (keydown.enter)="ui.openTask(t.id)">
      <div class="top">
        <tm-priority-chip [priority]="t.priority" />
        @if (t.teamName) { <span class="team tm-ellipsis">{{ t.teamName }}</span> }
      </div>
      <h4 [class.tm-strike]="t.status === 'done'">{{ t.title }}</h4>
      @if (t.description) { <p class="desc">{{ t.description }}</p> }
      <div class="bottom">
        <tm-due-chip [due]="t.dueDate" [status]="t.status" />
        <span class="spacer"></span>
        @if (t.commentCount) { <span class="meta"><tm-icon name="comment" [size]="13" />{{ t.commentCount }}</span> }
        <tm-avatar [name]="t.assignedUserName" size="xs" [emptyTitle]="lang.t('common.unassigned')" />
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; }
    .card {
      position: relative; padding: 14px; border-radius: 14px; cursor: grab; outline: none;
      background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
      border: 1px solid var(--line); box-shadow: 0 8px 20px rgba(0,0,0,0.25);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      overflow: hidden;
    }
    .card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--c); opacity: 0.9; }
    .card:hover, .card:focus-visible { border-color: color-mix(in srgb, var(--hover-color) 60%, transparent); box-shadow: 0 10px 28px rgba(0,0,0,0.35), 0 0 22px color-mix(in srgb, var(--hover-color) 30%, transparent); }
    .card.done { opacity: 0.7; }
    .top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
    .team { font-size: 11.5px; color: var(--muted); font-weight: 600; }
    h4 { margin: 0; font-size: 14px; font-weight: 650; line-height: 1.4; word-break: break-word; }
    .desc { margin: 6px 0 0; font-size: 12.5px; color: var(--muted); line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .bottom { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
    .spacer { flex: 1; }
    .meta { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--muted); }
  `]
})
export class TaskCardComponent {
  lang = inject(LanguageService);
  ui = inject(UiService);
  task = input.required<TaskItem>();
}
